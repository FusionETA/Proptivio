import React, { useMemo, useState } from 'react';

export default function OverviewDashboard({ units, loading, onRefresh }) {
    const [categoryFilter, setCategoryFilter] = useState('all');

    const calculateStats = (unitList) => {
        if (!unitList || unitList.length === 0) return null;

        const totalUnits = unitList.length;
        let availableCount = 0;
        let bookedCount = 0;
        let soldCount = 0;
        let holdCount = 0;
        let totalValue = 0;
        let availableValue = 0;
        let soldValue = 0;
        let bookedValue = 0;

        unitList.forEach(u => {
            const price = parseFloat(u.price) || 0;
            totalValue += price;

            switch (u.status) {
                case 'Available':
                    availableCount++;
                    availableValue += price;
                    break;
                case 'Booking':
                    bookedCount++;
                    bookedValue += price;
                    break;
                case 'Sold':
                    soldCount++;
                    soldValue += price;
                    break;
                case 'Hold':
                    holdCount++;
                    break;
            }
        });

        const soldPercentage = totalUnits > 0 ? ((soldCount + bookedCount) / totalUnits * 100).toFixed(1) : 0;

        return {
            totalUnits,
            availableCount,
            bookedCount,
            soldCount,
            holdCount,
            totalValue,
            availableValue,
            soldValue,
            bookedValue,
            soldPercentage
        };
    };

    const stats = useMemo(() => {
        if (!units) return null;
        let filtered = units;

        if (categoryFilter === 'soho') {
            filtered = units.filter(u => u.unitCategory === 'soho');
        } else if (categoryFilter === 'retail') {
            filtered = units.filter(u => u.unitCategory === 'retail' || u.viewOrientation === 'retail');
        } else if (categoryFilter === 'pantairemis') {
            filtered = units.filter(u => u.unitCategory === 'pantairemis');
        }

        return calculateStats(filtered);
    }, [units, categoryFilter]);

    const breakdownStats = useMemo(() => {
        if (!units) return null;
        const soho = units.filter(u => u.unitCategory === 'soho');
        const retail = units.filter(u => u.unitCategory === 'retail' || u.viewOrientation === 'retail');
        const pantairemis = units.filter(u => u.unitCategory === 'pantairemis');

        return {
            soho: calculateStats(soho),
            retail: calculateStats(retail),
            pantairemis: calculateStats(pantairemis),
            all: calculateStats(units)
        };
    }, [units]);

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-MY', {
            style: 'currency',
            currency: 'MYR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading && (!units || units.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                <p className="text-gray-500 font-medium">Loading dashboard analytics...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100">
                <p className="text-gray-500">No data available. Click refresh to load.</p>
                <button
                    onClick={onRefresh}
                    className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    Refresh Data
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Sales Overview</h2>
                    <p className="text-gray-500 text-sm mt-1">Real-time property sales performance</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                    {/* Filter Tabs */}
                    <div className="bg-gray-100 p-1 rounded-xl flex">
                        {[
                            { key: 'all', label: 'All Units' },
                            { key: 'soho', label: 'ABC Soho' },
                            { key: 'retail', label: 'Retail' },
                        ].map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => setCategoryFilter(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${categoryFilter === key
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={onRefresh}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md active:scale-95"
                    >
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Revenue (Sold + Booking) */}
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200 transform transition-all hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">
                            {stats.soldPercentage}% Sold
                        </span>
                    </div>
                    <div>
                        <p className="text-indigo-100 text-sm font-medium mb-1">Total Confirm Sales</p>
                        <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(stats.soldValue)}</h3>
                        <p className="text-xs text-indigo-200 mt-2 opacity-80">
                            + {formatCurrency(stats.bookedValue)} in bookings
                        </p>
                    </div>
                </div>

                {/* Units Sold Count */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-50 rounded-lg">
                            <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Units Sold</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.soldCount}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <p className="text-xs text-gray-500">Confirmed Sales</p>
                        </div>
                    </div>
                </div>

                {/* Units Booking Count */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Pending Bookings</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.bookedCount}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            <p className="text-xs text-gray-500">Awaiting Confirmation</p>
                        </div>
                    </div>
                </div>

                {/* Availability */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm font-medium mb-1">Available Units</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.availableCount}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <p className="text-xs text-gray-500">Ready for Sale</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Breakdown */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Inventory Status</h3>
                    <div className="space-y-6">
                        {/* Available Bar */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-medium text-gray-700">Available</span>
                                <span className="text-sm font-bold text-gray-900">{stats.availableCount} Units ({((stats.availableCount / stats.totalUnits) * 100).toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                                <div
                                    className="bg-blue-500 h-3 rounded-full transition-all duration-1000"
                                    style={{ width: `${(stats.availableCount / stats.totalUnits) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">Value: {formatCurrency(stats.availableValue)}</p>
                        </div>

                        {/* Sold Bar */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-medium text-gray-700">Sold</span>
                                <span className="text-sm font-bold text-gray-900">{stats.soldCount} Units ({((stats.soldCount / stats.totalUnits) * 100).toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                                <div
                                    className="bg-emerald-500 h-3 rounded-full transition-all duration-1000"
                                    style={{ width: `${(stats.soldCount / stats.totalUnits) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">Value: {formatCurrency(stats.soldValue)}</p>
                        </div>

                        {/* Booking Bar */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-sm font-medium text-gray-700">Booking / Reserved</span>
                                <span className="text-sm font-bold text-gray-900">{stats.bookedCount} Units ({((stats.bookedCount / stats.totalUnits) * 100).toFixed(0)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3">
                                <div
                                    className="bg-orange-500 h-3 rounded-full transition-all duration-1000"
                                    style={{ width: `${(stats.bookedCount / stats.totalUnits) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-1 text-right">Value: {formatCurrency(stats.bookedValue)}</p>
                        </div>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Total Project Value</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mb-2">{formatCurrency(stats.totalValue)}</p>
                    <p className="text-sm text-gray-500 mb-8">Gross Development Value (GDV)</p>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-500 text-sm">Total Units</span>
                            <span className="font-bold text-gray-900">{stats.totalUnits}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-500 text-sm">Unsold Value</span>
                            <span className="font-bold text-gray-900">{formatCurrency(stats.availableValue)}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <span className="text-gray-500 text-sm">Conversion Rate</span>
                            <span className="font-bold text-emerald-600">{stats.soldPercentage}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category Performance Breakdown */}
            {breakdownStats && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900">Category Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50/50">
                                    <th className="text-left py-4 px-6 text-sm font-semibold text-gray-500">Category</th>
                                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-500">Total Units</th>
                                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-500">Sold</th>
                                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-500">Booked</th>
                                    <th className="text-center py-4 px-6 text-sm font-semibold text-gray-500">Available</th>
                                    <th className="text-right py-4 px-6 text-sm font-semibold text-gray-500">Conversion</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {[
                                    { key: 'soho', label: 'ABC Soho', dot: 'bg-indigo-500' },
                                    { key: 'retail', label: 'Retail', dot: 'bg-teal-500' },
                                    { key: 'all', label: 'Total Project', dot: null },
                                ].map(({ key, label, dot }) => {
                                    const data = breakdownStats[key];
                                    if (!data) return null;
                                    const isAll = key === 'all';
                                    return (
                                        <tr key={key} className={`hover:bg-gray-50 transition-colors ${isAll ? 'bg-gray-50/30 font-semibold' : ''}`}>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {dot && <span className={`w-2 h-2 rounded-full ${dot}`}></span>}
                                                    <span className={isAll ? 'text-gray-900' : 'text-gray-700'}>
                                                        {label}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="text-center py-4 px-6 text-gray-900">{data.totalUnits}</td>
                                            <td className="text-center py-4 px-6 text-emerald-600">{data.soldCount}</td>
                                            <td className="text-center py-4 px-6 text-orange-600">{data.bookedCount}</td>
                                            <td className="text-center py-4 px-6 text-blue-600">{data.availableCount}</td>
                                            <td className="text-right py-4 px-6 text-gray-900">{data.soldPercentage}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
