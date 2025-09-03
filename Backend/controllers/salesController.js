import { prisma } from '../db/prisma.js';
import * as salesService from '../services/salesService.js';

export async function uploadSales(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required." });
    }
    const upload = await prisma.upload.create({
      data: {
        userId: req.user.id,
        type: 'sales',
        filename: req.file.originalname,
        path: req.file.url,
        status: 'pending',
      }
    });
    salesService.processSalesUpload({
      uploadId: upload.id,
      userId: req.user.id,
      fileUrl: req.file.url,
      dateStart: req.body.dateStart,
      dateEnd: req.body.dateEnd
    }).catch(err => {
      console.error(`BACKGROUND_PROCESSING_FAILED for sales upload ${upload.id}:`, err);
    });
    res.status(202).json({
      message: "Sales file accepted and is being processed.",
      uploadId: upload.id
    });

  } catch (e) {
    next(e);
  }
}
export async function dailyTrend(req, res, next) {
  try {
    const userId = req.user.id;
    const days = Math.max(1, Math.min(30, Number(req.query.days || 7)));
    const data = await salesService.getDailyTrend({ userId, days });
    res.json(data);
  } catch (e) {
    next(e);
  }
}