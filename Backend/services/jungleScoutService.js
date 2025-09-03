import axios from 'axios';
const JUNGLE_SCOUT_API_KEY = process.env.JUNGLE_SCOUT_API_KEY;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetches sales data from Jungle Scout for a batch of ASINs.
export async function fetchSalesDataInChunks(asins, onProgress) {
    if (!JUNGLE_SCOUT_API_KEY) {
        throw new Error('Jungle Scout API key is not configured.');
    }

    const allProductData = [];
    const BATCH_SIZE = 10;

    for (let i = 0; i < asins.length; i += BATCH_SIZE) {
        const chunk = asins.slice(i, i + BATCH_SIZE);
        console.log(`[JungleScout] Fetching data for ASIN chunk ${Math.floor(i / BATCH_SIZE) + 1}...`);
        
        try {
            const response = await axios.get('https://api.junglescout.com/v1/products', {
                params: { marketplace: 'us', asins: chunk.join(',') },
                headers: { 
                    'Authorization': `Bearer ${JUNGLE_SCOUT_API_KEY}`,
                    'Content-Type': 'application/json' 
                },
            });

            if (response.data.data) {
                allProductData.push(...response.data.data);
            }
        } catch (error) {
            console.error(`[JungleScout] Failed to fetch chunk for ASINs [${chunk.join(', ')}]:`, error.message);
        }
        
        // Report progress back to the worker (0.0 to 1.0)
        onProgress((i + chunk.length) / asins.length);
        
        // Throttle requests to avoid rate limiting
        if (i + BATCH_SIZE < asins.length) {
            await sleep(1200); // 1.2-second delay between batches
        }
    }
    
    console.log(`[JungleScout] Successfully fetched data for ${allProductData.length} ASINs.`);
    return allProductData;
}
