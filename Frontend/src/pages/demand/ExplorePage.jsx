// Frontend/src/pages/demand/ExplorePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { mutate } from 'swr';
import { route } from '../../route';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';

const fetcher = url => route.get(url).then(res => res.data);

const AsinDiscoveryTool = () => {
    const [asin, setAsin] = useState('');
    const [category, setCategory] = useState({ name: '', url: '' });
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [debouncedAsin] = useDebounce(asin, 800);

    useEffect(() => {
        if (!debouncedAsin || debouncedAsin.length < 10) return;
        
        const fetchCategory = async () => {
            setIsFetching(true);
            try {
                const { data } = await route.get(`/demand/category-from-asin?asin=${debouncedAsin}`);
                setCategory({ name: data.categoryName, url: data.categoryUrl });
                toast.success("Category discovered!");
            } catch (error) {
                toast.error(error.response?.data?.error || "Could not find category.");
                setCategory({ name: '', url: '' });
            } finally {
                setIsFetching(false);
            }
        };
        fetchCategory();
    }, [debouncedAsin]);

    const handleAssociateAsin = async (e) => {
        e.preventDefault();
        if (!category.url) return toast.error("Discover a category first.");
        
        setIsSubmitting(true);
        try {
            await route.post('/demand/categories/associate-asin', {
                asin,
                categoryName: category.name,
                categoryUrl: category.url,
            });
            toast.success(`ASIN associated with ${category.name}!`);
            mutate('/demand/categories'); // Re-fetch the global category list
            setAsin('');
            setCategory({ name: '', url: '' });
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to associate ASIN.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl mb-8">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">Discover & Associate New ASINs</h2>
            <form onSubmit={handleAssociateAsin} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label className="text-sm text-gray-400">Representative ASIN</label>
                    <input type="text" value={asin} onChange={e => setAsin(e.target.value.toUpperCase())} placeholder="Enter an ASIN" className="w-full p-2 rounded bg-slate-700 text-white mt-1" required />
                </div>
                <div>
                    <label className="text-sm text-gray-400">Category (Auto-Discovered)</label>
                    <input type="text" value={category.name} placeholder={isFetching ? "Discovering..." : "Auto-filled from ASIN"} readOnly className="w-full p-2 rounded bg-slate-700 text-white mt-1" />
                </div>
                <button type="submit" disabled={isSubmitting || isFetching || !category.url} className="bg-green-600 text-white font-semibold p-2 rounded h-10 hover:bg-green-700 disabled:bg-slate-500">
                    {isSubmitting ? 'Saving...' : 'Associate ASIN'}
                </button>
            </form>
        </div>
    );
};

const GlobalCategoryTable = () => {
    const navigate = useNavigate();
    const { data: categories, error } = useSWR('/demand/categories', fetcher);

    const handleGenerateReport = async (category) => {
        try {
            await route.post('/demand/reports', {
                globalCategoryId: category.id,
            });
            toast.success(`Report generation queued for "${category.name}"!`);
            navigate('/demand/reports');
        } catch (error) {
            toast.error(error.response?.data?.error || "Failed to start report generation.");
        }
    };

    if (error) return <div className="text-red-400 bg-slate-800 p-4 rounded-lg">Failed to load global categories.</div>;
    if (!categories) return <div className="text-gray-400 bg-slate-800 p-4 rounded-lg">Loading...</div>;

    return (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">Global Category Explorer</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-300">
                    <thead>
                        <tr className="border-b border-slate-600">
                            <th className="p-3">Category Name</th>
                            <th className="p-3">Associated ASINs</th>
                            <th className="p-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                                <td className="p-3 font-medium">{cat.name}</td>
                                <td className="p-3">{cat.asinCount} ASINs found</td>
                                <td className="p-3">
                                    <button onClick={() => handleGenerateReport(cat)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                        Generate Report
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function ExplorePage() {
    return (
        <div className="bg-slate-900 text-gray-200 min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                <AsinDiscoveryTool />
                <GlobalCategoryTable />
            </div>
        </div>
    );
}
