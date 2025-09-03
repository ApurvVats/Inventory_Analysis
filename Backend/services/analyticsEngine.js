// This engine takes the raw data and transforms it into high-level insights.
export function aggregateAnalytics(bestSellingAsins) {
    if (!bestSellingAsins || bestSellingAsins.length === 0) {
        return {
            summary: {
                asinCount: 0,
                totalSales: 0,
                trustScore: 0,
                topAsinSales: 0,
                topBrandShare: 0,
            },
        };
    }

    const totalRevenue = bestSellingAsins.reduce((sum, p) => sum + (p.monthlyRevenue || 0), 0);
    
    const topAsin = [...bestSellingAsins].sort((a, b) => (b.monthlyRevenue || 0) - (a.monthlyRevenue || 0))[0];

    // Calculate market share by brand
    const brandSales = {};
    bestSellingAsins.forEach(p => {
        if (p.title) { // Use title to infer brand if brand field is missing
            const brand = p.title.split(' ')[0]; // Simple assumption: first word is the brand
            brandSales[brand] = (brandSales[brand] || 0) + (p.monthlyRevenue || 0);
        }
    });

    const sortedBrands = Object.entries(brandSales).sort(([, a], [, b]) => b - a);
    const top3BrandSales = sortedBrands.slice(0, 3).reduce((sum, [, sales]) => sum + sales, 0);
    const topBrandShare = totalRevenue > 0 ? Math.round((top3BrandSales / totalRevenue) * 100) : 0;
    
    // Calculate data trust score
    const productsWithSalesData = bestSellingAsins.filter(p => p.monthlyRevenue > 0).length;
    const trustScore = bestSellingAsins.length > 0 ? Math.round((productsWithSalesData / bestSellingAsins.length) * 100) : 0;

    return {
        summary: {
            asinCount: bestSellingAsins.length,
            totalSales: Math.round(totalRevenue),
            trustScore: trustScore,
            topAsinSales: Math.round(topAsin?.monthlyRevenue || 0),
            topBrandShare: topBrandShare,
        },
        // You can add more detailed JSON data for charts here
        // salesOverTimeJson: { ... },
        // brandMarketShareJson: { ... },
    };
}
