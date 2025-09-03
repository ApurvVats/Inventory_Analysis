import { prisma } from '../db/prisma.js';
import { getStreamFromBlob } from '../utils/azureStreamer.js'; // Assuming you have this utility
import { parse as csvParse } from 'csv-parse';
import xlsx from 'xlsx';

function toNum(v) {
  const n = Number(String(v || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

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
    const daysWithSales = await prisma.salesDaily.count({
        where: {
            userId,
            asin: group.asin,
            sku: group.sku,
            date: { gte: since },
            quantity: { gt: 0 }
        }
    });
    const divisor = Math.max(daysWithSales, 1);
    salesMap.set(key, +(totalUnits / divisor).toFixed(2));
  }
  return salesMap;
}
export async function processInventoryUpload({ uploadId, userId, fileUrl, date }) {
  const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
  if (!upload) throw new Error("Upload record not found");

  await prisma.upload.update({ where: { id: uploadId }, data: { status: "processing" } });

  try {
    const fileStream = await getStreamFromBlob(fileUrl);
    const fileExtension = fileUrl.split('.').pop().toLowerCase();
    
    let rows;
    if (fileExtension === 'csv') {
        rows = await new Promise((resolve, reject) => {
            const records = [];
            const parser = fileStream.pipe(csvParse({ columns: true, skip_empty_lines: true, trim: true }));
            parser.on('data', (record) => records.push(record));
            parser.on('end', () => resolve(records));
            parser.on('error', reject);
        });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
        const buffer = await streamToBuffer(fileStream);
        const wb = xlsx.read(buffer);
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = xlsx.utils.sheet_to_json(ws, { defval: '' });
    } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    if (!rows.length) {
      await prisma.upload.update({ where: { id: uploadId }, data: { status: "processed", meta: { rowCount: 0, errors: ["Empty file"] } } });
      return;
    }

    const errors = [];
    const upsertData = [];
    
    rows.forEach((row, index) => {
      const asin = row.asin || row.ASIN || row.Asin || row.asin1;
      const sku = row.sku || row.SKU || row["seller-sku"] || row.Sku;
      if (!asin || !sku) {
        errors.push({ row: index + 1, error: "Missing ASIN or SKU" });
        return;
      }
      const fbaQty = toNum(row.fbaQty || row.FBAQty || row["FBA Qty"] || row["Quantity Available"] || row.fulfillable_quantity);
      const mfnQty = toNum(row.mfnQty || row.MFNQty || row["MFN Qty"] || row.mfn);
      const vendorQty = toNum(row.vendorQty || row["Vendor Qty"] || row.vendor || row.vc);
      const totalQty = fbaQty + mfnQty + vendorQty;
      upsertData.push({ asin, sku, fbaQty, mfnQty, vendorQty, totalQty });
    });

    // Database operations in a single transaction
    await prisma.$transaction([
      ...upsertData.map(data =>
        prisma.product.upsert({
          where: { userId_asin_sku: { userId, asin: data.asin, sku: data.sku } },
          update: { fbaQty: data.fbaQty, mfnQty: data.mfnQty, vendorQty: data.vendorQty, totalQty: data.totalQty, lastUpdated: new Date() },
          create: { userId, asin: data.asin, sku: data.sku, title: data.sku, fbaQty: data.fbaQty, mfnQty: data.mfnQty, vendorQty: data.vendorQty, totalQty: data.totalQty, lastUpdated: new Date() },
        })
      ),
      ...upsertData.map(data =>
        prisma.inventorySnapshot.upsert({
          where: { userId_asin_sku_date: { userId, asin: data.asin, sku: data.sku, date: new Date(date) } },
          update: { fbaQty: data.fbaQty, mfnQty: data.mfnQty, vendorQty: data.vendorQty, totalQty: data.totalQty },
          create: { userId, asin: data.asin, sku: data.sku, date: new Date(date), fbaQty: data.fbaQty, mfnQty: data.mfnQty, vendorQty: data.vendorQty, totalQty: data.totalQty },
        })
      )
    ]);

    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "processed", meta: { rowCount: rows.length, errors } },
    });

  } catch (e) {
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "failed", meta: { error: e.message } },
    });
    throw e;
  }
}

export async function getInventoryViewData({ userId, windowDays = 30 }) {
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
  
  return { window: windowDays, rows };
}
export async function getAvailabilityStatus(userId) {
    const since = daysAgo(29);
    const [prodCount, salesCount] = await prisma.$transaction([
        prisma.product.count({ where: { userId } }),
        prisma.salesDaily.count({ where: { userId, date: { gte: since } } })
    ]);
    return { available: prodCount > 0 && salesCount > 0, prodCount, salesCount, since: since.toISOString() };
}