import fs from 'fs';
import { prisma } from '../db/prisma.js';
import { processMarketingUpload } from '../services/marketingService.js'; // This service must be converted to Prisma

/* Variations CRUD */
export async function createVariation(req, res, next) {
  try {
    const { name, code, items = [], tags = [] } = req.body;
    const variation = await prisma.variation.create({
      data: {
        userId: req.user.id,
        name,
        code,
        tags,
        active: true,
        items: {
          create: items.map(it => ({ sku: it.sku, asin: it.asin, note: it.note }))
        }
      },
      include: { items: true }
    });
    res.status(201).json(variation);
  } catch (e) { next(e); }
}

export async function listVariations(req, res, next) {
  try {
    const { search = '', page = 1, limit = 20, active } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause = {
      userId: req.user.id,
      ...(active && { active: active === 'true' }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } },
          { items: { some: { sku: { contains: search, mode: 'insensitive' } } } },
          { items: { some: { asin: { contains: search, mode: 'insensitive' } } } },
        ]
      })
    };

    const [items, total] = await prisma.$transaction([
      prisma.variation.findMany({
        where: whereClause,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: Number(limit),
        include: { items: true }
      }),
      prisma.variation.count({ where: whereClause })
    ]);

    res.json({ items, total, page: Number(page), limit: Number(limit) });
  } catch (e) { next(e); }
}

export async function getVariation(req, res, next) {
  try {
    const variation = await prisma.variation.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { items: true }
    });
    if (!variation) return res.status(404).json({ error: 'Not found' });
    res.json(variation);
  } catch (e) { next(e); }
}

export async function updateVariation(req, res, next) {
  try {
    const { name, code, items, tags, active } = req.body;
    const variationId = req.params.id;

    const updatedVariation = await prisma.$transaction(async (tx) => {
      await tx.variationItem.deleteMany({ where: { variationId } });
      const v = await tx.variation.update({
        where: { id: variationId, userId: req.user.id },
        data: {
          name, code, tags, active,
          items: {
            create: items.map(it => ({ sku: it.sku, asin: it.asin, note: it.note }))
          }
        },
        include: { items: true }
      });
      return v;
    });

    res.json(updatedVariation);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    next(e);
  }
}

export async function deleteVariation(req, res, next) {
  try {
    await prisma.variation.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { active: false }
    });
    res.json({ ok: true });
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Not found' });
    next(e);
  }
}

/* Marketing upload */
export async function uploadMarketing(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'file required' });
    const { dateStart, dateEnd } = req.body || {};

    const upload = await prisma.upload.create({
      data: {
        userId: req.user.id,
        type: 'marketing',
        filename: req.file.originalname,
        path: req.file.path,
        status: 'processing',
        meta: { dateStart, dateEnd }
      }
    });

    const result = await processMarketingUpload({
      userId: req.user.id,
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
    res.json({ ok: true, ...result });
  } catch (e) { next(e); }
}
