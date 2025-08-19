// services/uploadService.js
import fs from "fs";
import path from "path";
import { parse as csvParse } from "csv-parse";
import { prisma } from '../db/prisma.js';

function toNum(v) {
  const n = Number(String(v || '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function parseCsv(filePath, onRow) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath)
      .pipe(csvParse({ columns: true, skip_empty_lines: true, trim: true }));
    stream.on("data", onRow);
    stream.on("end", resolve);
    stream.on("error", reject);
  });
}

export async function processInventoryUpload({ uploadId, userId, date }) {
  const upload = await prisma.upload.findUnique({ where: { id: uploadId } });
  if (!upload) throw new Error("Upload not found");

  await prisma.upload.update({ where: { id: uploadId }, data: { status: "processing" } });

  const filePath = upload.path;
  const errors = [];
  let rowCount = 0;
  const upsertData = [];

  const mapRow = (row) => {
    rowCount++;
    const asin = row.asin || row.ASIN || row.Asin || row.asin1;
    const sku = row.sku || row.SKU || row["seller-sku"] || row.Sku;
    if (!asin || !sku) {
      errors.push({ row: rowCount, error: "Missing ASIN or SKU" });
      return;
    }

    const fbaQty = toNum(row.fbaQty || row.FBAQty || row["FBA Qty"] || row["Quantity Available"] || row.fulfillable_quantity);
    const mfnQty = toNum(row.mfnQty || row.MFNQty || row["MFN Qty"] || row.mfn);
    const vendorQty = toNum(row.vendorQty || row["Vendor Qty"] || row.vendor || row.vc);
    const totalQty = fbaQty + mfnQty + vendorQty;

    upsertData.push({ asin, sku, fbaQty, mfnQty, vendorQty, totalQty });
  };

  await parseCsv(filePath, mapRow);

  // Perform all database operations in a single transaction
  try {
    await prisma.$transaction(
      upsertData.map(data =>
        prisma.product.upsert({
          where: { userId_asin_sku: { userId, asin: data.asin, sku: data.sku } },
          update: {
            fbaQty: data.fbaQty, mfnQty: data.mfnQty, vendorQty: data.vendorQty,
            totalQty: data.totalQty, lastUpdated: new Date()
          },
          create: {
            userId, asin: data.asin, sku: data.sku, title: data.sku,
            fbaQty: data.fbaQty, mfnQty: data.mfnQty, vendorQty: data.vendorQty,
            totalQty: data.totalQty, lastUpdated: new Date()
          },
        })
      )
    );
    await prisma.$transaction(
        upsertData.map(data =>
          prisma.inventorySnapshot.upsert({
            where: { userId_asin_sku_date: { userId, asin: data.asin, sku: data.sku, date: new Date(date) } },
            update: { fbaQty: data.fbaQty, mfnQty: data.mfnQty, vendorQty: data.vendorQty, totalQty: data.totalQty },
            create: {
              userId, asin: data.asin, sku: data.sku, date: new Date(date),
              fbaQty: data.fbaQty, mfnQty: data.mfnQty, vendorQty: data.vendorQty, totalQty: data.totalQty
            },
          })
        )
      );

    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "processed", meta: { rowCount, errors } },
    });
  } catch (e) {
    await prisma.upload.update({
        where: { id: uploadId },
        data: { status: "failed", meta: { error: e.message } },
    });
    throw e; // Re-throw to signal failure to the controller
  }

  return { rowCount, errors };
}
