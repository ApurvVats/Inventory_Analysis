import express from "express";
import { authRequired } from "../middleware/auth.js";
import upload from "../middleware/fileUpload.js"; // Naya, centralized Azure middleware
import { uploadSales, dailyTrend } from "../controllers/salesController.js";
import { prisma } from "../db/prisma.js";
const router = express.Router();
router.post("/upload", authRequired, upload.single("file"), uploadSales);
router.get("/daily/trend", authRequired, dailyTrend);
// Optional JSON ingest
router.post("/daily/ingest", authRequired, async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body) ? req.body : [];
    if (!rows.length) return res.status(400).json({ error: "Empty payload" });    
    const userId = req.user.id;
    const ops = rows.map((r) => 
      prisma.salesDaily.upsert({
        where: { userId_date_sku: { userId, date: new Date(r.date), sku: r.sku } },
        update: { quantity: Number(r.unitsSold || 0), asin: r.asin },
        create: { userId, date: new Date(r.date), sku: r.sku, asin: r.asin, quantity: Number(r.unitsSold || 0) }
      })
    );    
    const result = await prisma.$transaction(ops);
    res.json({ ok: true, count: result.length });
  } catch (e) {
    next(e);
  }
});
export default router;