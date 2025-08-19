import { prisma } from '../db/prisma.js';
import { processInventoryUpload } from "../services/uploadService.js"; 

function dayStart(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n) {
  const d = dayStart();
  d.setDate(d.getDate() - n);
  return d;
}

async function getAverageDailySalesMap(userId, windowDays = 30) {
  const since = daysAgo(windowDays - 1);

  // Prisma's equivalent of the Mongoose aggregation
  const aggResult = await prisma.salesDaily.groupBy({
    by: ['asin', 'sku'],
    where: { userId, date: { gte: since } },
    _sum: {
      quantity: true,
    },
  });

  const salesMap = new Map();
  for (const group of aggResult) {
    const key = `${group.asin}__${group.sku}`;
    const totalUnits = group._sum.quantity || 0;
    salesMap.set(key, +(totalUnits / windowDays).toFixed(2));
  }
  return salesMap;
}

export const uploadInventory = async (req, res) => {
  try {
    const { date } = req.body;
    if (!req.file) return res.status(400).json({ error: "File required" });

    const upload = await prisma.upload.create({
      data: {
        userId: req.user.id,
        type: "inventory",
        dateStart: date ? new Date(date) : new Date(),
        filename: req.file.originalname,
        path: req.file.path,
        status: "pending",
        meta: {}
      }
    });

    // This service function must be adapted to Prisma internally
    await processInventoryUpload({ uploadId: upload.id, userId: req.user.id, date: date || new Date() });

    res.json({ ok: true, uploadId: upload.id });
  } catch (e) {
    res.status(400).json({ error: e.message || "Upload failed" });
  }
};

export const uploadInventoryVendor = uploadInventory;

export const availability = async (req, res) => {
  const userId = req.user.id;
  const since = daysAgo(29);
  const [prodCount, salesCount] = await prisma.$transaction([
    prisma.product.count({ where: { userId } }),
    prisma.salesDaily.count({ where: { userId, date: { gte: since } } })
  ]);
  res.json({ available: prodCount > 0 && salesCount > 0, prodCount, salesCount, since: since.toISOString() });
};

export const view = async (req, res) => {
  const userId = req.user.id;
  const windowDays = Number(req.query.window || 30);
  
  const [products, avgSalesMap] = await Promise.all([
    prisma.product.findMany({ where: { userId }, take: 10000 }),
    getAverageDailySalesMap(userId, windowDays)
  ]);

  const rows = products.map(p => {
    const key = `${p.asin}__${p.sku}`;
    const avg = avgSalesMap.get(key) || 0;
    const total = p.totalQty || 0;
    const proj1 = Math.max(total - avg * 30, 0);
    const proj2 = Math.max(total - avg * 60, 0);
    const proj3 = Math.max(total - avg * 90, 0);
    const daysToOOS = avg > 0 ? Math.ceil(total / avg) : null;

    return {
      asin: p.asin, sku: p.sku, imageUrl: p.imageUrl || null,
      fbaQty: p.fbaQty, mfnQty: p.mfnQty, vendorQty: p.vendorQty, totalQty: total,
      avgDailySales: avg,
      proj1m: Math.round(proj1), proj2m: Math.round(proj2), proj3m: Math.round(proj3),
      daysToOOS
    };
  });
  
  res.json({ window: windowDays, rows });
};