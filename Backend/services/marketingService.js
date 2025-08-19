import fs from 'fs';
import path from 'path';
import { parse as csvParse } from 'csv-parse/sync';
import xlsx from 'xlsx';
import { prisma } from '../db/prisma.js'; // Import Prisma client
// --- Helper functions (no changes needed) ---
function readRows(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    const content = fs.readFileSync(filePath, 'utf8');
    return csvParse(content, { columns: true, skip_empty_lines: true });
  }
  const wb = xlsx.readFile(filePath);
  const ws = wb.Sheets[wb.SheetNames[0]];
  return xlsx.utils.sheet_to_json(ws, { defval: '' });
}
function pick(headers, candidates) {
  const low = headers.map(h => String(h).toLowerCase());
  for (const c of candidates) {
    const i = low.indexOf(String(c).toLowerCase());
    if (i >= 0) return headers[i];
  }
  return null;
}
function toNum(v) {
  const n = Number(String(v).replace(/[, $]/g, '')); // More robust cleaning
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
    if (!isNaN(+d)) return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const m = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
    if (m) {
      const dd = Number(m[1]), mm = Number(m), yy = Number(m);
      return new Date(Date.UTC(yy, mm - 1, dd));
    }
    return null;
}
// --- Main processing function ---
export async function processMarketingUpload({ userId, filePath, dateStart, dateEnd }) {
  const rows = readRows(filePath);
  if (!rows.length) return { inserted: 0, errors: ['Empty file'] };
  const headers = Object.keys(rows);
  const hDate = pick(headers, ['date', 'report date', 'day']);
  const hCamp = pick(headers, ['campaign', 'campaign name', 'campaign_name']);
  const hAdgrp = pick(headers, ['ad group', 'adgroup', 'ad group name']);
  const hKw = pick(headers, ['keyword', 'search term']);
  const hAsin = pick(headers, ['asin']);
  const hSku = pick(headers, ['sku', 'seller-sku', 'seller_sku']);
  const hImpr = pick(headers, ['impressions', 'impr']);
  const hClk = pick(headers, ['clicks', 'click']);
  const hSpend = pick(headers, ['spend', 'cost']);
  const hOrders = pick(headers, ['orders', 'conversions']);
  const hSales = pick(headers, ['sales', 'revenue']);
  if (!hDate || !(hCamp || hAdgrp || hKw || hAsin || hSku)) {
    return { inserted: 0, errors: ['Missing essential columns (date and one of campaign/adgroup/keyword/asin/sku)'] };
  }
  const start = dateStart ? new Date(new Date(dateStart).setHours(0, 0, 0, 0)) : null;
  const end = dateEnd ? new Date(new Date(dateEnd).setHours(23, 59, 59, 999)) : null;
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
      let level = 'campaign';
      if (r[hKw]) level = 'keyword';
      else if (r[hAdgrp]) level = 'adgroup';
      else if (r[hAsin]) level = 'asin';
      else if (r[hSku]) level = 'sku';
      docs.push({
        userId, date: d, level,
        campaignName: r[hCamp] || null, adGroupName: r[hAdgrp] || null, keyword: r[hKw] || null,
        asin: r[hAsin] || null, sku: r[hSku] || null,
        impressions, clicks, spend, orders, sales,
        ...safeMetrics({ impressions, clicks, spend, sales })
      });
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (!docs.length) return { inserted: 0, errors: errors.length ? errors : ['No valid rows'] };
  // --- Prisma Insert ---
  const res = await prisma.marketingRecord.createMany({
    data: docs,
    skipDuplicates: true // This will silently ignore rows that violate a unique constraint if you add one
  });
  return { inserted: res.count, errors };
}