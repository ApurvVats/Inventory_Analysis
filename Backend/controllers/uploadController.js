// controllers/uploadController.js
import path from "path";
import { prisma } from '../db/prisma.js';
import { processInventoryUpload } from "../services/uploadService.js"; 

// POST /api/upload/:type
const uploadFile = async (req, res) => {
  try {
    const { type } = req.params;
    const { dateStart, dateEnd } = req.body;
    const userId = req.user.id;

    if (!req.file) return res.status(400).json({ error: "File missing" });
    if (!type) return res.status(400).json({ error: "Upload type is required" });

    let upload = await prisma.upload.create({
      data: {
        userId,
        type,
        dateStart: dateStart ? new Date(dateStart) : undefined,
        dateEnd: dateEnd ? new Date(dateEnd) : undefined,
        filename: req.file.originalname || path.basename(req.file.path),
        path: req.file.path,
        status: "pending",
        meta: {},
      }
    });

    if (type === "inventory" || type === "inventory_vendor") {
      try {
        await processInventoryUpload({
          uploadId: upload.id,
          userId,
          date: dateStart || new Date(),
        });
      } catch (e) {
        await prisma.upload.update({
          where: { id: upload.id },
          data: {
            status: "failed",
            meta: { ...(upload.meta || {}), error: e.message || "Parsing failed" }
          }
        });
        return res.status(400).json({ error: e.message || "Inventory parsing failed" });
      }
    }

    return res.status(201).json({ ok: true, uploadId: upload.id, upload });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Upload failed" });
  }
};
// GET /api/upload/mine
const listMyUploads = async (req, res) => {
  try {
    const uploads = await prisma.upload.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    return res.json({ uploads });
  } catch (e) {
    return res.status(e.status || 500).json({ error: e.message || "Failed to fetch uploads" });
  }
};

export default { uploadFile, listMyUploads };
