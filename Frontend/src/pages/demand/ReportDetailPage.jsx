import React from 'react';
import { useParams, Link } from 'react-router-dom';
import useSWR from 'swr';
import { route } from '../../route';

const fetcher = url => route.get(url).then(res => res.data);

// --- Main Page Component ---
export default function ReportDetailPage() {
    const { reportId } = useParams();
    const { data: report, error } = useSWR(`/demand/reports/${reportId}`, fetcher);

    if (error) return (
        <div className="p-8 text-center text-red-400 bg-slate-900 min-h-screen">
            <h2 className="text-2xl font-bold mb-2">Failed to load report.</h2>
            <p>It may have been deleted or you may not have permission to view it.</p>
            <Link to="/demand/reports" className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Back to My Reports
            </Link>
        </div>
    );
    if (!report) return <div className="p-8 bg-slate-900 text-gray-300 min-h-screen">Loading report details...</div>;
    
    const summary = report.analytics?.summaryJson || {};
    const bestSellers = report.analytics?.bestSellingAsins || [];

    return (
        <div className="bg-slate-900 text-gray-200 min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-4xl font-bold text-white">{report.categoryName}</h1>
                    <p className="text-lg text-gray-400">Demand Analysis Report</p>
                    <p className="text-sm text-gray-500">Generated on: {new Date(report.completedAt).toLocaleString()}</p>
                </header>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-lg">
                        <h3 className="text-gray-400 text-sm">Est. Monthly Revenue</h3>
                        <p className="text-3xl font-bold text-white mt-2">{summary.totalSales?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-lg">
                        <h3 className="text-gray-400 text-sm">Top ASIN Revenue</h3>
                        <p className="text-3xl font-bold text-white mt-2">{summary.topAsinSales?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-lg">
                        <h3 className="text-gray-400 text-sm">Top 3 Brands Mkt Share</h3>
                        <p className="text-3xl font-bold text-white mt-2">{summary.topBrandShare || 'N/A'}%</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-lg">
                        <h3 className="text-gray-400 text-sm">Data Trust Score</h3>
                        <p className="text-3xl font-bold text-white mt-2">{summary.trustScore || 'N/A'}%</p>
                    </div>
                </div>

                {/* Best Sellers Table */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
                   <h2 className="text-2xl font-bold text-white mb-4">Top 100 Best-Selling Products</h2>
                   <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead>
                                <tr className="border-b border-slate-600">
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Product</th>
                                    <th className="p-3">Brand</th>
                                    <th className="p-3">Est. Monthly Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bestSellers.map(product => (
                                    <tr key={product.id} className="border-b border-slate-700">
                                        <td className="p-3 font-bold">{product.rank}</td>
                                        <td className="p-3 flex items-center gap-4">
                                            <img src={product.imageUrl} alt={product.title} className="w-12 h-12 object-cover rounded-md" />
                                            <span className="font-medium">{product.title}</span>
                                        </td>
                                        <td className="p-3">{product.brand || 'N/A'}</td>
                                        <td className="p-3 font-mono">{product.monthlyRevenue?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                   </div>
                </div>
            </div>
        </div>
    );
}
