// Frontend/src/pages/demand/ManageReportsPage.jsx
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { route } from '../../route';
import { io } from 'socket.io-client';

const fetcher = url => route.get(url).then(res => res.data);
const socket = io(import.meta.env.VITE_API_BASE_URL, { withCredentials: true });

const ReportStatus = ({ status, progress }) => {
    if (status === 'COMPLETED') return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-green-100 text-green-800">Completed</span>;
    if (status === 'FAILED') return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-red-100 text-red-800">Failed</span>;
    return <span className="px-2 py-1 text-xs font-semibold rounded-md bg-yellow-100 text-yellow-800 animate-pulse">{status} ({progress}%)</span>;
};

function ManageReportsPage() {
    const { data: reports, error, mutate } = useSWR('/demand/reports', fetcher);

    useEffect(() => {
        const handleUpdate = (updateData) => {
            if (reports?.some(report => report.id === updateData.reportId)) {
                mutate();
            } else if (reports) {
                mutate();
            }
        };
        socket.on('report_update', handleUpdate);
        return () => socket.off('report_update', handleUpdate);
    }, [reports, mutate]);

    if (error) return (
        <div className="p-8 text-center bg-slate-900 min-h-screen">
            <h2 className="text-2xl font-bold text-red-400">Failed to load your reports.</h2>
            <p className="text-gray-400">Please try refreshing the page.</p>
        </div>
    );
    if (!reports) return <div className="p-8 text-center bg-slate-900 text-gray-300 min-h-screen">Loading your reports...</div>;

    return (
        <div className="bg-slate-900 text-gray-200 min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-4">Your Personal Demand Reports</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-gray-300">
                            <thead>
                                <tr className="border-b border-slate-600">
                                    <th className="p-3">Date Requested</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Monthly Revenue</th>
                                    <th className="p-3">Trust Score</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center p-8 text-gray-400">You have not generated any reports yet.</td>
                                    </tr>
                                ) : (
                                    reports.map(report => (
                                        <tr key={report.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                            <td className="p-3">{new Date(report.createdAt).toLocaleString()}</td>
                                            
                                            {/* --- THIS IS THE FIX --- */}
                                            {/* Use optional chaining to prevent crash if globalCategory is null */}
                                            <td className="p-3 font-medium">{report.globalCategory?.name || 'N/A'}</td>
                                            
                                            <td className="p-3"><ReportStatus status={report.status} progress={report.progress} /></td>
                                            <td className="p-3 font-mono">{report.analytics?.summaryJson?.totalSales?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '---'}</td>
                                            <td className="p-3">{report.analytics?.summaryJson?.trustScore ? `${report.analytics.summaryJson.trustScore}%` : '---'}</td>
                                            <td className="p-3">
                                                {report.status === 'COMPLETED' && (
                                                    <Link to={`/demand/reports/${report.id}`} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                                        View Report
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ManageReportsPage;
