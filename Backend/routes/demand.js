// --- demand.js ---

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authRequired } from "../middleware/auth.js";
import { demandAnalysisQueue } from "../queues/demandAnalysisQueue.js";
import { getCategoryUrlFromAsin } from "../services/oxylabsService.js";

const prisma = new PrismaClient();
const router = Router();

function extractCategoryIdFromUrl(url) {
    if (!url) return null;
    // Matches node=, /bestsellers/books/, /dp/, or just a number in the path
    const match = url.match(/(?:node=|\/bestsellers\/\w+\/|\/)([0-9]{4,})/);
    return match ? match[1] : null;
}

router.use(authRequired);

router.get("/category-from-asin", async (req, res) => {
    const { asin } = req.query;
    if (!asin) {
        return res.status(400).json({ error: "ASIN query parameter is required." });
    }
    try {
        const { categoryName, categoryUrl } = await getCategoryUrlFromAsin(asin);
        res.json({ categoryName, categoryUrl });
    } catch (error) {
        console.error(`[API /category-from-asin] Error:`, error.message);
        res.status(404).json({ error: `No valid category found for ASIN ${asin}.` });
    }
});

router.get("/categories", async (req, res) => {
    try {
        const categories = await prisma.globalCategory.findMany({
            include: { _count: { select: { asins: true } } },
            orderBy: { name: 'asc' }
        });
        const response = categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            url: cat.url,
            asinCount: cat._count.asins
        }));
        res.json(response);
    } catch (error) {
        console.error("[API /categories] Failed to fetch global categories:", error);
        res.status(500).json({ error: "Failed to fetch global categories." });
    }
});

router.post("/categories/associate-asin", async (req, res) => {
    const { asin, categoryName, categoryUrl } = req.body;
    const userId = req.user.id;

    if (!asin || !categoryName || !categoryUrl) {
        return res.status(400).json({ error: "ASIN, category name, and category URL are required." });
    }

    const categoryId = extractCategoryIdFromUrl(categoryUrl);
    if (!categoryId) {
        return res.status(400).json({ error: "Could not determine a valid category ID from the provided URL." });
    }

    try {
        const globalCategory = await prisma.globalCategory.upsert({
            where: { categoryId: categoryId },
            update: { name: categoryName, url: categoryUrl },
            create: { name: categoryName, url: categoryUrl, categoryId: categoryId },
        });

        await prisma.categoryAsin.create({
            data: { asin, userId, globalCategoryId: globalCategory.id },
        });

        res.status(201).json({ message: "ASIN associated successfully." });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ error: "You have already associated this ASIN with this category." });
        }
        console.error("[API /associate-asin] Error:", error);
        res.status(500).json({ error: "Failed to associate ASIN due to a server error." });
    }
});

router.post("/reports", async (req, res) => {
    const { globalCategoryId } = req.body;
    const userId = req.user.id;

    if (!globalCategoryId) {
        return res.status(400).json({ error: "A global category ID is required." });
    }

    try {
        const report = await prisma.demandReport.create({
            data: {
                status: "QUEUED",
                progress: 5,
                user: { connect: { id: userId } },
                globalCategory: { connect: { id: globalCategoryId } },
                analytics: { create: {} },
            },
            include: { analytics: true, globalCategory: true },
        });

        // Pass the numeric categoryId to the queue.
        await demandAnalysisQueue.add("analyze-demand", {
            reportId: report.id,
            categoryAnalyticsId: report.analytics.id,
            categoryId: report.globalCategory.categoryId, // The key change
        });

        req.io.emit("report_update", { reportId: report.id, status: "QUEUED" });
        res.status(201).json(report);
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: "The specified category does not exist." });
        }
        console.error("[API /reports POST] Error:", error);
        res.status(500).json({ error: "Failed to create report." });
    }
});

router.get("/reports", async (req, res) => {
    try {
        const reports = await prisma.demandReport.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                globalCategory: true,
                analytics: { select: { summaryJson: true } },
            },
        });
        res.json(reports);
    } catch (error) {
        console.error("[API /reports GET] Error:", error);
        res.status(500).json({ error: "Failed to retrieve your reports." });
    }
});

router.get("/reports/:reportId", async (req, res) => {
    const { reportId } = req.params;
    try {
        const report = await prisma.demandReport.findFirst({
            where: { id: reportId, userId: req.user.id },
            include: {
                globalCategory: true,
                analytics: { include: { bestSellingAsins: true } },
            },
        });

        if (!report) {
            return res.status(404).json({ error: "Report not found." });
        }
        res.json(report);
    } catch (error) {
        console.error(`[API /reports/${reportId} GET] Error:`, error);
        res.status(500).json({ error: "Failed to retrieve report details." });
    }
});

export default router;
