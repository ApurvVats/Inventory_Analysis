import { prisma } from "../db/prisma.js";
import { getStreamFromBlob } from "../utils/azureStreamer.js"; 
import { parse as csvParse } from "csv-parse";
import xlsx from "xlsx";

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
  });
}
function pick(headers, candidates) {
  const low = headers.map((h) => String(h).toLowerCase());
  for (const c of candidates) {
    const i = low.indexOf(String(c).toLowerCase());
    if (i >= 0) return headers[i];
  }
  return null;
}
function toNum(v) {
  const n = Number(String(v).replace(/[, $]/g, "")); 
  return Number.isFinite(n) ? n : 0;
}
function safeMetrics({ impressions, clicks, spend, sales }) {
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const acos = sales > 0 ? spend / sales : 0;
  const roas = spend > 0 ? sales / spend : 0;
  return { ctr, cpc, acos, roas };
}
function normDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  const d = new Date(s);
  if (!isNaN(+d))
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (m) {
    const dd = Number(m[1]),
      mm = Number(m),
      yy = Number(m);
    return new Date(Date.UTC(yy, mm - 1, dd));
  }
  return null;
}

export async function processMarketingUpload({
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
          meta: { inserted: 0, errors: ["Empty file"] },
        },
      });
      return;
    }
    const headers = Object.keys(rows[0]);
    const hDate = pick(headers, ["date", "report date", "day"]);
    const hCamp = pick(headers, ["campaign", "campaign name", "campaign_name"]);
    const hAdgrp = pick(headers, ["ad group", "adgroup", "ad group name"]);
    const hKw = pick(headers, ["keyword", "search term"]);
    const hAsin = pick(headers, ["asin"]);
    const hSku = pick(headers, ["sku", "seller-sku", "seller_sku"]);
    const hImpr = pick(headers, ["impressions", "impr"]);
    const hClk = pick(headers, ["clicks", "click"]);
    const hSpend = pick(headers, ["spend", "cost"]);
    const hOrders = pick(headers, ["orders", "conversions"]);
    const hSales = pick(headers, ["sales", "revenue"]);
    if (!hDate || !(hCamp || hAdgrp || hKw || hAsin || hSku)) {
      return {
        inserted: 0,
        errors: [
          "Missing essential columns (date and one of campaign/adgroup/keyword/asin/sku)",
        ],
      };
    }
    const start = dateStart
      ? new Date(new Date(dateStart).setHours(0, 0, 0, 0))
      : null;
    const end = dateEnd
      ? new Date(new Date(dateEnd).setHours(23, 59, 59, 999))
      : null;

    const docs = [];
    const errors = [];
  for (const r of rows) {
    try {
      const d = normDate(r[hDate]);
      if (!d || (start && d < start) || (end && d > end)) continue;
      const impressions = hImpr ? toNum(r[hImpr]) : 0;
      const clicks = hClk ? toNum(r[hClk]) : 0;
      const spend = hSpend ? toNum(r[hSpend]) : 0;
      const orders = hOrders ? toNum(r[hOrders]) : 0;
      const sales = hSales ? toNum(r[hSales]) : 0;
      let level = "campaign";
      if (r[hKw]) level = "keyword";
      else if (r[hAdgrp]) level = "adgroup";
      else if (r[hAsin]) level = "asin";
      else if (r[hSku]) level = "sku";
      docs.push({
        userId,
        date: d,
        level,
        campaignName: r[hCamp] || null,
        adGroupName: r[hAdgrp] || null,
        keyword: r[hKw] || null,
        asin: r[hAsin] || null,
        sku: r[hSku] || null,
        impressions,
        clicks,
        spend,
        orders,
        sales,
        ...safeMetrics({ impressions, clicks, spend, sales }),
      });
    } catch (e) {
      errors.push(e.message);
    }
  }
    if (docs.length) {
      const res = await prisma.marketingRecord.createMany({
        data: docs,
        skipDuplicates: true,
      });
      // Update the meta with the result
    }
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "processed", meta: { inserted: docs.length, errors } },
    });
  } catch (e) {
    await prisma.upload.update({
      where: { id: uploadId },
      data: { status: "failed", meta: { error: e.message } },
    });
    throw e;
  }
}