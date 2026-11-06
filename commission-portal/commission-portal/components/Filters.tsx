"use client";

import { X } from "lucide-react";

interface FiltersProps {
    selectedYear: string;
    selectedMonth: string;
    selectedAgent: string;
    availableYears: string[];
    availableMonths: { value: string; label: string }[];
    availableAgents: string[];
    onYearChange: (year: string) => void;
    onMonthChange: (month: string) => void;
    onAgentChange: (agent: string) => void;
    onClearFilters: () => void;
    showAgentFilter?: boolean;
}

export function Filters({
    selectedYear,
    selectedMonth,
    selectedAgent,
    availableYears,
    availableMonths,
    availableAgents,
    onYearChange,
    onMonthChange,
    onAgentChange,
    onClearFilters,
    showAgentFilter = true,
}: FiltersProps) {
    const hasActiveFilters = selectedYear !== 'all' || selectedMonth !== 'all' || selectedAgent !== 'all';

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                        <X className="h-3 w-3" />
                        Clear All
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Year Filter */}
                <div>
                    <label htmlFor="year-filter" className="block text-xs font-medium text-gray-700 mb-2">
                        Year
                    </label>
                    <select
                        id="year-filter"
                        value={selectedYear}
                        onChange={(e) => onYearChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                        <option value="all">All Years</option>
                        {availableYears.map((year) => (
                            <option key={year} value={year}>
                                {year}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Month Filter */}
                <div>
                    <label htmlFor="month-filter" className="block text-xs font-medium text-gray-700 mb-2">
                        Month
                    </label>
                    <select
                        id="month-filter"
                        value={selectedMonth}
                        onChange={(e) => onMonthChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                        <option value="all">All Months</option>
                        {availableMonths.map((month) => (
                            <option key={month.value} value={month.value}>
                                {month.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Agent/Developer Filter */}
                {showAgentFilter && (
                    <div>
                        <label htmlFor="agent-filter" className="block text-xs font-medium text-gray-700 mb-2">
                            Agent / Developer
                        </label>
                        <select
                            id="agent-filter"
                            value={selectedAgent}
                            onChange={(e) => onAgentChange(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                        >
                            <option value="all">All Agents/Developers</option>
                            {availableAgents.map((agent) => (
                                <option key={agent} value={agent}>
                                    {agent}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Active filters:</span>
                    {selectedYear !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                            Year: {selectedYear}
                            <button
                                onClick={() => onYearChange('all')}
                                className="hover:bg-indigo-100 rounded-full p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {selectedMonth !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                            Month: {availableMonths.find(m => m.value === selectedMonth)?.label}
                            <button
                                onClick={() => onMonthChange('all')}
                                className="hover:bg-indigo-100 rounded-full p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                    {selectedAgent !== 'all' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs font-medium">
                            Agent: {selectedAgent}
                            <button
                                onClick={() => onAgentChange('all')}
                                className="hover:bg-indigo-100 rounded-full p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
