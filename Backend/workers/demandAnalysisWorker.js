import 'dotenv/config';
dotenv.config();
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redisConnection } from '../config/redis.js';
import { getBestSellersByCategoryId } from '../services/oxylabsService.js';
import { fetchSalesDataInChunks } from '../services/jungleScoutService.js';
import { aggregateAnalytics } from '../services/analyticsEngine.js';

const prisma = new PrismaClient();

const worker = new Worker(
  'demandAnalysisQueue',
  async (job) => {
    const { reportId, categoryAnalyticsId, categoryId } = job.data;
    const io = job.queue.opts.io;

    const updateProgress = async (progress, status = 'GENERATING') => {
      await prisma.demandReport.update({
        where: { id: reportId },
        data: { progress, status },
      });
      await job.updateProgress(progress);
      if (io) io.emit('report_update', { reportId, status, progress });
    };

    try {
      await updateProgress(10, 'GENERATING');

      // --- Step A: Check DB first ---
      let bestSellerProducts = await prisma.bestSellingAsin.findMany({
        where: { categoryAnalyticsId },
        orderBy: { rank: 'asc' },
      });

      if (!bestSellerProducts || bestSellerProducts.length === 0) {
        console.log(`[DB] MISS! Fetching data from service...`);
        const apiProducts = await getBestSellersByCategoryId(categoryId);

        if (!apiProducts || apiProducts.length === 0) {
          throw new Error('Oxylabs returned no best sellers for the given category ID.');
        }

        const productsToCreate = apiProducts.map((p, index) => ({
          categoryAnalyticsId,
          rank: p.rank || index + 1,
          asin: p.asin,
          title: p.title || 'N/A',
          imageUrl: p.image || null,
          price: p.price || null,
          rating: p.rating || null,
          reviewsCount: p.reviews_count || null,
        }));

        await prisma.bestSellingAsin.createMany({
          data: productsToCreate,
          skipDuplicates: true,
        });

        bestSellerProducts = await prisma.bestSellingAsin.findMany({
          where: { categoryAnalyticsId },
          orderBy: { rank: 'asc' },
        });
      } else {
        console.log(`[DB] HIT! Found ${bestSellerProducts.length} products in DB. Skipping API.`);
      }

      await updateProgress(50);

      // --- Step B: Fetch sales data ---
      const asinsToFetch = bestSellerProducts.map((p) => p.asin);

      const onChunkProgress = (chunkProgress) => {
        const totalProgress = 50 + Math.floor(chunkProgress * 40);
        updateProgress(totalProgress);
      };

      const salesData = await fetchSalesDataInChunks(asinsToFetch, onChunkProgress);

      for (const product of salesData) {
        await prisma.bestSellingAsin.updateMany({
          where: { categoryAnalyticsId, asin: product.id },
          data: {
            monthlySales: product.attributes?.estimated_monthly_sales,
            monthlyRevenue: product.attributes?.estimated_monthly_sales_revenue,
          },
        });
      }

      await updateProgress(95);

      // --- Step C: Generate analytics JSON ---
      const finalProducts = await prisma.bestSellingAsin.findMany({
        where: { categoryAnalyticsId },
      });

      const analyticsJson = aggregateAnalytics(finalProducts);

      await prisma.categoryAnalytics.update({
        where: { id: categoryAnalyticsId },
        data: { summaryJson: analyticsJson.summary },
      });

      await prisma.demandReport.update({
        where: { id: reportId },
        data: { status: 'COMPLETED', progress: 100, completedAt: new Date() },
      });

      if (io) io.emit('report_update', { reportId, status: 'COMPLETED', progress: 100 });
    } catch (error) {
      console.error(`[Worker] Job ${job.id} FAILED for report ${reportId}:`, error);
      await prisma.demandReport.update({
        where: { id: reportId },
        data: { status: 'FAILED' },
      });
      if (io) io.emit('report_update', { reportId, status: 'FAILED' });
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);
worker.on('completed', (job) => console.log(`[Worker] Job ${job.id} completed.`));
worker.on('failed', (job, err) =>
  console.error(`[Worker] Job ${job.id} failed:`, err)
);
export default worker;