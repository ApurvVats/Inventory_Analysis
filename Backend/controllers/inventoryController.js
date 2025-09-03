import { prisma } from '../db/prisma.js';
import * as inventoryService from '../services/inventoryService.js';
export const uploadInventory = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File is required." });
    }
    const upload = await prisma.upload.create({
      data: {
        userId: req.user.id,
        type: "inventory",
        filename: req.file.originalname,
        path: req.file.url, 
        status: "pending", 
      }
    });
inventoryService.processInventoryUpload({ 
        uploadId: upload.id, 
        userId: req.user.id,
        fileUrl: req.file.url,
        date: req.body.date || new Date() 
    }).catch(err => {
        console.error(`BACKGROUND_PROCESSING_FAILED for upload ${upload.id}:`, err);
    });
    res.status(202).json({ 
        message: "File upload accepted and is being processed in the background.", 
        uploadId: upload.id 
    });

  } catch (e) {
    next(e);
  }
};
export const uploadInventoryVendor = async (req, res, next) => {
    try {
        if (!req.file) {
          return res.status(400).json({ error: "File is required." });
        }
        const upload = await prisma.upload.create({
          data: {
            userId: req.user.id,
            type: "inventory_vendor", // Type badal gaya
            filename: req.file.originalname,
            path: req.file.url,
            status: "pending",
          }
        });
        inventoryService.processInventoryUpload({ 
            uploadId: upload.id, 
            userId: req.user.id,
            fileUrl: req.file.url,
            date: req.body.date || new Date() 
        }).catch(err => {
            console.error(`BACKGROUND_PROCESSING_FAILED for upload ${upload.id}:`, err);
        });
        res.status(202).json({ 
            message: "Vendor file accepted and is being processed.", 
            uploadId: upload.id 
        });

    } catch (e) {
        next(e);
    }
};
export const view = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const windowDays = Number(req.query.window || 30);
    const data = await inventoryService.getInventoryViewData({ userId, windowDays });    
    res.json(data);
  } catch(e) {
    next(e);
  }
};

export const availability = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data = await inventoryService.getAvailabilityStatus(userId);        
        res.json(data);
    } catch(e) {
        next(e);
    }
};