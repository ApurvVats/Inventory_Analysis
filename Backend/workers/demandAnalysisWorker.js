
import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { redisConnection } from '../config/redis.js';
import { getBestSellersByCategoryId } from '../services/oxylabsService.js';
import { fetchSalesDataInChunks } from '../services/jungleScoutService.js';
import { aggregateAnalytics } from '../services/analyticsEngine.js';

const prisma = new PrismaClient();

const worker = new Worker('demandAnalysisQueue', async (job) => {
    const { reportId, categoryAnalyticsId, categoryId } = job.data;
    const io = job.queue.opts.io;

    const updateProgress = async (progress, status = 'GENERATING') => {
        await prisma.demandReport.update({ where: { id: reportId }, data: { progress, status } });
        job.updateProgress(progress);
        if (io) io.emit('report_update', { reportId, status, progress });
    };
    try {
        await updateProgress(10, 'GENERATING');

        // --- NEW LOGIC: Pehle Database Check Karein ---
        let bestSellerProducts = await prisma.bestSellingAsin.findMany({
            where: { categoryAnalyticsId: categoryAnalyticsId },
            orderBy: { rank: 'asc' },
        });

        // Agar database mein data NAHI hai, tabhi API call karein
        if (!bestSellerProducts || bestSellerProducts.length === 0) {
            console.log(`[DB] MISS! Is report ke liye DB mein data nahi hai. Service se fetch kar rahe hain...`);
            // Service ab caching aur API call dono handle karega
            const apiProducts = await getBestSellersByCategoryId(categoryId);
            if (!apiProducts || apiProducts.length === 0) {
                throw new Error("Oxylabs returned no best sellers for the given category ID.");
            }
            const productsToCreate = apiProducts.map((p, index) => ({
                categoryAnalyticsId,
                rank: p.rank || (index + 1),
                asin: p.asin,
                title: p.title || 'N/A',
                imageUrl: p.image || null,
                price: p.price || null,
                rating: p.rating || null,
                reviewsCount: p.reviews_count || null,
            }));

            await prisma.bestSellingAsin.createMany({
                data: productsToCreate,
                skipDuplicates: true, // Safeguard
            });
            
            // Local variable ko naye data se update karein
            bestSellerProducts = await prisma.bestSellingAsin.findMany({
                where: { categoryAnalyticsId: categoryAnalyticsId },
                orderBy: { rank: 'asc' },
            });
        } else {
            console.log(`[DB] HIT! Is report ke liye ${bestSellerProducts.length} products DB mein mil gaye. API call skip kar rahe hain.`);
        }
        
        await updateProgress(50);
        // === Step B: Jungle Scout se sales data fetch karein ===
        const asinsToFetch = bestSellerProducts.map(p => p.asin);
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

        // === Step C: Analytics JSON generate karein ===
        const finalProducts = await prisma.bestSellingAsin.findMany({ where: { categoryAnalyticsId } });
        const analyticsJson = aggregateAnalytics(finalProducts);
        await prisma.categoryAnalytics.update({
            where: { id: categoryAnalyticsId },
            data: { 
                summaryJson: analyticsJson.summary,
            },
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
            data: { status: 'FAILED' }
        });
        if (io) io.emit('report_update', { reportId, status: 'FAILED' });
        throw error;
    }
}, { connection: redisConnection, concurrency: 5 });

export default worker;