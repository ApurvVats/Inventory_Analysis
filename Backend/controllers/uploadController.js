import { prisma } from '../db/prisma.js';
export const listMyUploads = async (req, res, next) => {
  try {
    const uploads = await prisma.upload.findMany({
      where: { 
        userId: req.user.id 
      },
      orderBy: { 
        createdAt: 'desc' 
      },
      take: 200, 
    });
    return res.json({ uploads });
  } catch (e) {
    next(e);
  }
};