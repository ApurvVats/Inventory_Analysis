import { prisma } from "../db/prisma.js";
import { getStreamFromBlob } from "../utils/azureStreamer.js"; // Common utility
import { parse as csvParse } from "csv-parse";
import xlsx from "xlsx";
import dayjs from "dayjs";

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}

function normDate(value, dateFormat) {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  if (dateFormat === "DD/MM/YYYY") {
    const parts = raw.split(/[/\-]/);
    if (parts.length === 3) {
      const [d, m, y] = parts.map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
  } else if (dateFormat === "MM/DD/YYYY") {
    const parts = raw.split(/[/\-]/);
    if (parts.length === 3) {
      const [m, d, y] = parts.map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }
  }
  const d = new Date(raw);
  return isNaN(+d)
    ? null
    : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function pickHeader(headers, candidates) {
  const low = headers.map((h) => h.toLowerCase());
  for (const c of candidates) {
    const i = low.indexOf(c.toLowerCase());
    if (i >= 0) return headers[i];
  }
  return null;
}

export async function processSalesUpload({
  uploadId,
  userId,
  fileUrl,
  dateStart,
  dateEnd,
}) {
  await prisma.upload.update({
    where: { id: uploadId },
    data: { status: "processing" },
  });

  try {
    const fileStream = await getStreamFromBlob(fileUrl);
    const fileExtension = fileUrl.split(".").pop().toLowerCase();

    let rows;
    if (fileExtension === "csv") {
      rows = await new Promise((resolve, reject) => {
        const records = [];
        const parser = fileStream.pipe(
          csvParse({ columns: true, skip_empty_lines: true, trim: true })
        );
        parser.on("data", (record) => records.push(record));
        parser.on("end", () => resolve(records));
        parser.on("error", reject);
      });
    } else if (["xlsx", "xls"].includes(fileExtension)) {
      const buffer = await streamToBuffer(fileStream);
      const wb = xlsx.read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      rows = xlsx.utils.sheet_to_json(ws, { defval: "" });
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    if (!rows.length) {
      await prisma.upload.update({
        where: { id: uploadId },
        data: {
          status: "processed",
          meta: { processed: 0, errors: ["Empty file"] },
        },
      });
      return;
    }

    // Baaki ka saara logic ab waisa hi rahega
    const headers = Object.keys(rows[0]);
    const hDate = pickHeader(headers, ["date", "order_date", "purchase_date"]);
    const hSku = pickHeader(headers, ["sku", "seller-sku"]);
    const hAsin = pickHeader(headers, ["asin"]);
    const hQty = pickHeader(headers, ["units", "quantity", "units ordered"]);
    const hRevenue = pickHeader(headers, ["revenue", "sales", "amount"]);
    const hCost = pickHeader(headers, ["cost", "cogs"]);

    if (!hDate || !hSku || !hQty) {
      return {
        processed: 0,
        errors: [`Missing required columns (date/sku/quantity)`],
      };
    }

    const winStart = dateStart ? dayjs(dateStart).startOf("day") : null;
    const winEnd = dateEnd ? dayjs(dateEnd).endOf("day") : null;

    const ops = [];
    const errors = [];
    for (const r of rows) {
      try {
        const d = normDate(r[hDate]);
        if (
          !d ||
          (winStart && dayjs(d).isBefore(winStart)) ||
          (winEnd && dayjs(d).isAfter(winEnd))
        ) {
          continue;
        }
        const sku = String(r[hSku] ?? "").trim();
        const asin = String(r[hAsin] ?? sku).trim(); 
        if (!sku) continue;

        ops.push(
          prisma.salesDaily.upsert({
            where: { userId_date_sku: { userId, date: d, sku } },
            update: {
              quantity: Number(r[hQty] ?? 0),
              revenue: Number(r[hRevenue] ?? 0),
              cost: Number(r[hCost] ?? 0),
            },
            create: {
              userId,
              date: d,
              sku,
              asin,
              quantity: Number(r[hQty] ?? 0),
              revenue: Number(r[hRevenue] ?? 0),
              cost: Number(r[hCost] ?? 0),
            },
          })
        );
      } catch (e) {
        errors.push({ row: r, reason: e.message });
      }
    }

    if (ops.length) {
      await prisma.$transaction(ops);
    }

    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "processed", meta: { processed: ops.length, errors } },
    });
  } catch (e) {
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "failed", meta: { error: e.message } },
    });
    throw e;
  }
}
export async function getDailyTrend({ userId, days = 7 }) {
  const end = dayjs().endOf("day").toDate();
  const startN = dayjs(end)
    .subtract(days - 1, "day")
    .startOf("day")
    .toDate();
  const start14 = dayjs(end).subtract(13, "day").startOf("day").toDate();
  const start30 = dayjs(end).subtract(29, "day").startOf("day").toDate();

  const [has30DaysData, recent14, recentN, products] =
    await prisma.$transaction([
      prisma.salesDaily.findFirst({
        where: { userId, date: { gte: start30 } },
      }),
      prisma.salesDaily.findMany({
        where: { userId, date: { gte: start14, lte: end } },
      }),
      prisma.salesDaily.findMany({
        where: { userId, date: { gte: startN, lte: end } },
      }),
      prisma.product.findMany({
        where: { userId },
        select: { sku: true, asin: true },
      }),
    ]);

  const skuToAsin = new Map(products.map((p) => [p.sku, p.asin || p.sku]));
  const bySku14 = new Map();
  for (const r of recent14) {
    const current = bySku14.get(r.sku) || { totalQty: 0, dates: new Set() };
    current.totalQty += r.quantity;
    current.dates.add(r.date.toDateString());
    bySku14.set(r.sku, current);
  }
  const expectedBySku = new Map();
  for (const [sku, data] of bySku14.entries()) {
    const daysWithSales = data.dates.size;
    const divisor =
      daysWithSales >= 7
        ? Math.min(daysWithSales, 14)
        : Math.max(daysWithSales, 1);
    expectedBySku.set(sku, data.totalQty / divisor);
  }
  // 2. Group recent N days of sales by SKU and date
  const perSkuDayQty = new Map();
  for (const r of recentN) {
    if (!perSkuDayQty.has(r.sku)) {
      perSkuDayQty.set(r.sku, new Map());
    }
    const dateKey = dayjs(r.date).format("YYYY-MM-DD");
    const dayMap = perSkuDayQty.get(r.sku);
    dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + r.quantity);
  }
  // 3. Build the final response object
  const daysList = Array.from({ length: days }, (_, i) =>
    dayjs(startN).add(i, "day")
  );
  const allSkus = new Set([...expectedBySku.keys(), ...perSkuDayQty.keys()]);
  const items = Array.from(allSkus).map((sku) => {
    const expected = expectedBySku.get(sku) || 0;
    const dayMap = perSkuDayQty.get(sku) || new Map();
    const daysArr = daysList.map((d) => {
      const dateKey = d.format("YYYY-MM-DD");
      const qty = dayMap.get(dateKey) || 0;
      let status = "gray";
      if (dayMap.has(dateKey)) {
        status = qty > expected ? "green" : qty < expected ? "red" : "gray";
      }
      return { date: dateKey, qty, status };
    });
    return {
      asin: skuToAsin.get(sku) || sku,
      expected: Number(expected.toFixed(2)),
      days: daysArr,
    };
  });
  return { has30DaysData: !!has30DaysData, items };
}