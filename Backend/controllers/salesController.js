// controllers/salesController.js
import fs from 'fs';
import path from 'path';
import { prisma } from '../db/prisma.js';
import { processSalesUpload, getDailyTrend } from '../services/salesService.js'; 
export async function uploadSales(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const { dateStart, dateEnd } = req.body || {};
    try {
      const dir = path.dirname(req.file.path);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch {}

    const upload = await prisma.upload.create({
      data: {
        userId,
        type: 'sales',
        filename: req.file.originalname,
        path: req.file.path,
        status: 'processing',
        meta: { dateStart, dateEnd }
      }
    });

    const result = await processSalesUpload({
      userId,
      filePath: req.file.path,
      dateStart,
      dateEnd
    });

    await prisma.upload.update({
      where: { id: upload.id },
      data: {
        status: 'processed',
        meta: { ...(upload.meta || {}), ...result }
      }
    });

    try { fs.unlinkSync(req.file.path); } catch {}
    res.json({ ok: true, uploadId: upload?.id || null, ...result });
  } catch (e) {
    console.error('uploadSales error:', e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
}

export async function dailyTrend(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const days = Math.max(1, Math.min(30, Number(req.query.days || 7)));
    const data = await getDailyTrend({ userId, days });
    res.json(data);
  } catch (e) {
    console.error('dailyTrend error:', e);
    res.status(500).json({ error: e.message || 'Trend failed' });
  }
}
