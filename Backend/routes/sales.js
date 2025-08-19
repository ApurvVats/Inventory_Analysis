// routes/sales.js
import express from "express";
import multer from "multer";
import { authRequired } from "../middleware/auth.js";
import { uploadSales, dailyTrend } from "../controllers/salesController.js";
import { prisma } from "../db/prisma.js"; // Import Prisma client

const router = express.Router();
const upload = multer({ dest: process.env.UPLOAD_DIR || "uploads" });

router.use(authRequired);

router.post("/upload", upload.single("file"), uploadSales);
router.get("/daily/trend", dailyTrend);

// Optional JSON ingest - UPDATED to use Prisma
router.post("/daily/ingest", async (req, res) => {
  const rows = Array.isArray(req.body) ? req.body : [];
  if (!rows.length) return res.status(400).json({ error: "Empty payload" });
  const userId = req.user.id;

  const ops = rows.map((r) => 
    prisma.salesDaily.upsert({
      where: {
        userId_date_sku: {
          userId,
          date: new Date(r.date),
          sku: r.sku
        }
      },
      update: {
        quantity: Number(r.unitsSold || 0),
        asin: r.asin, // Ensure your payload includes asin
      },
      create: {
        userId,
        date: new Date(r.date),
        sku: r.sku,
        asin: r.asin,
        quantity: Number(r.unitsSold || 0),
      }
    })
  );

  // Run all upserts in a single transaction
  const result = await prisma.$transaction(ops);

  res.json({ ok: true, count: result.length });
});

export default router;
