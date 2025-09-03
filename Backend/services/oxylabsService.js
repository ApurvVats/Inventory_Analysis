// services/oxylabsService.js

import axios from "axios";
// Apne existing redis connection ko import karein
import { redisConnection } from '../config/redis.js';

const OXYLABS_USERNAME = process.env.OXYLABS_USERNAME;
const OXYLABS_PASSWORD = process.env.OXYLABS_PASSWORD;

/**
 * Centralized function for making authenticated requests to the Oxylabs API.
 */
async function makeOxylabsRequest(payload) {
    if (!OXYLABS_USERNAME || !OXYLABS_PASSWORD) {
        throw new Error("Oxylabs API credentials are not configured.");
    }
    return axios.post("https://realtime.oxylabs.io/v1/queries", payload, {
        auth: { username: OXYLABS_USERNAME, password: OXYLABS_PASSWORD },
    });
}

/**
 * Fetches the category hierarchy for a given ASIN.
 */
export async function getCategoryUrlFromAsin(asin) {
    const payload = {
        source: "amazon_product",
        domain: "com",
        query: asin,
        parse: true,
    };
    try {
        const response = await makeOxylabsRequest(payload);
        const categoryPath = response.data?.results?.[0]?.content?.category?.[0]?.ladder;
        if (!categoryPath || categoryPath.length === 0) {
            throw new Error(`No category path found for ASIN ${asin}.`);
        }
        const primaryCategory = categoryPath[categoryPath.length - 1];
        return {
            categoryName: primaryCategory.name,
            categoryUrl: primaryCategory.url,
        };
    } catch (error) {
        if (error.response) {
            console.error("[Oxylabs API Error] Status:", error.response.status);
            console.error("[Oxylabs API Error] Data:", error.response.data);
        }
        throw error;
    }
}

/**
 * Fetches up to 100 best-selling products for a category, using cache first.
 */
export async function getBestSellersByCategoryId(categoryId) {
    const cacheKey = `bestsellers:${categoryId}`;
    const CACHE_EXPIRATION_SECONDS = 86400; // 24 hours

    // 1. Check cache first
    try {
        const cachedData = await redisConnection.get(cacheKey);
        if (cachedData) {
            console.log(`[Cache] HIT! Data for Category ID ${categoryId} found in cache.`);
            return JSON.parse(cachedData);
        }
    } catch (error) {
        console.error("[Redis GET Error]", error);
    }

    // 2. If not in cache, fetch from Oxylabs
    console.log(`[Cache] MISS! Fetching from Oxylabs for Category ID: ${categoryId}.`);
    let allBestsellers = [];
    const totalPagesToFetch = 2;

    for (let page = 1; page <= totalPagesToFetch; page++) {
        const payload = {
            source: "amazon_bestsellers",
            domain: "com",
            query: categoryId,
            start_page: page,
            pages: 1,
            parse: true,
        };
        try {
            const response = await makeOxylabsRequest(payload);
            const pageBestsellers = response.data?.results?.[0]?.content?.bestsellers || response.data?.results?.[0]?.content?.results || [];
            if (pageBestsellers.length > 0) {
                allBestsellers = allBestsellers.concat(pageBestsellers);
            } else {
                break;
            }
        } catch (error) {
            console.error(`[Oxylabs API Error] on page ${page}:`, error.response ? error.response.data : error.message);
            throw error;
        }
    }

    // 3. Save new data to cache
    if (allBestsellers.length > 0) {
        try {
            await redisConnection.setex(cacheKey, CACHE_EXPIRATION_SECONDS, JSON.stringify(allBestsellers));
            console.log(`[Cache] SET! Data for Category ID ${categoryId} saved to cache.`);
        } catch (error) {
            console.error("[Redis SETEX Error]", error);
        }
    }

    console.log(`[Oxylabs] Discovered a total of ${allBestsellers.length} products.`);
    return allBestsellers;
}
