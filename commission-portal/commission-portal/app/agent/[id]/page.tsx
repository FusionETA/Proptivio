"use client";

import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitleSmall } from "@/components/ui/Card";
import { ChevronLeft, RefreshCw, Printer, Download, Calendar } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { formatCurrency } from "@/lib/bitrix/utils";

interface Transaction {
    id: number;
    title: string;
    dealId: string;
    dealTitle: string;
    buyerName: string;
    project: string;
    transactionDate: string;
    processDate: string;
    transactionAmount: number;
    commissionRate: number;
    commissionAmount: number;
    status: string;
}

interface AgentData {
    id: string;
    name: string;
    totalSales: number;
    totalCommission: number;
    transactionCount: number;
    pendingCount: number;
    approvedCount: number;
}

// Generate month options for the filter
function getMonthOptions() {
    const options: { value: string; label: string }[] = [
        { value: 'all', label: 'All Months' }
    ];

    const now = new Date();
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const label = date.toLocaleDateString('en-MY', { year: 'numeric', month: 'long' });
        options.push({ value, label });
    }

    return options;
}

export default function AgentView({ params }: { params: Promise<{ id: string }> }) {
    const [agentId, setAgentId] = useState<string>('');
    const [agent, setAgent] = useState<AgentData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    const monthOptions = useMemo(() => getMonthOptions(), []);

    useEffect(() => {
        params.then(p => setAgentId(decodeURIComponent(p.id)));
    }, [params]);

    const loadAgentData = async () => {
        if (!agentId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/agents/${agentId}`);
            const data = await response.json();

            if (data.error) {
                console.error('API Error:', data.error);
                return;
            }

            setAgent(data.agent);
            setTransactions(data.transactions || []);
        } catch (error) {
            console.error('Failed to load agent data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (agentId) {
            loadAgentData();
        }
    }, [agentId]);

    const handlePrint = () => {
        // TODO: Implement print functionality
        console.log('Print clicked');
    };

    const handleDownload = () => {
        // TODO: Implement download functionality
        console.log('Download clicked');
    };

    const getStatusVariant = (status: string) => {
        if (status === 'APPROVED') return 'success';
        if (status === 'PENDING' || !status) return 'warning';
        return 'destructive';
    };

    // Filter transactions by selected month
    const filteredTransactions = useMemo(() => {
        if (selectedMonth === 'all') return transactions;

        return transactions.filter(tx => {
            const txDate = tx.transactionDate || tx.processDate;
            if (!txDate) return false;
            const date = new Date(txDate);
            const txMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            return txMonth === selectedMonth;
        });
    }, [transactions, selectedMonth]);

    // Calculate totals based on filtered transactions
    const filteredTotals = useMemo(() => {
        return {
            totalSales: filteredTransactions.reduce((sum, t) => sum + t.transactionAmount, 0),
            totalCommission: filteredTransactions.reduce((sum, t) => sum + t.commissionAmount, 0),
            transactionCount: filteredTransactions.length,
        };
    }, [filteredTransactions]);

    return (
        <div className="min-h-screen">
            <Header />
            <main className="px-8 py-6">
                <div className="mb-6">
                    <Link href="/agents" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Agents
                    </Link>
                </div>

                <div className="mb-8 flex justify-between items-start">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                            {agent?.name.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{agent?.name || 'Loading...'}</h2>
                            <p className="text-gray-500 text-sm mt-1">Agent ID: {agentId}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Printer className="h-4 w-4" />
                            Print
                        </button>
                        <button
                            onClick={handleDownload}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </button>
                        <button
                            onClick={loadAgentData}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                {agent && (
                    <div className="grid gap-6 md:grid-cols-3 mb-8">
                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                            <CardHeader className="pb-2">
                                <CardTitleSmall className="text-emerald-600">
                                    {selectedMonth === 'all' ? 'Total Sales' : 'Filtered Sales'}
                                </CardTitleSmall>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-emerald-900">
                                    {formatCurrency(selectedMonth === 'all' ? agent.totalSales : filteredTotals.totalSales)}
                                </div>
                                <p className="text-xs text-emerald-600 mt-1">
                                    {selectedMonth === 'all' ? agent.transactionCount : filteredTotals.transactionCount} transactions
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <CardHeader className="pb-2">
                                <CardTitleSmall className="text-purple-600">
                                    {selectedMonth === 'all' ? 'Total Commission' : 'Filtered Commission'}
                                </CardTitleSmall>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-900">
                                    {formatCurrency(selectedMonth === 'all' ? agent.totalCommission : filteredTotals.totalCommission)}
                                </div>
                                <p className="text-xs text-purple-600 mt-1">Agent earnings</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardHeader className="pb-2">
                                <CardTitleSmall className="text-blue-600">All Time Commission</CardTitleSmall>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-900">{formatCurrency(agent.totalCommission)}</div>
                                <p className="text-xs text-blue-600 mt-1">{agent.transactionCount} total transactions</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Transactions Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Commission Transactions</h3>

                        {/* Month Filter */}
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                {monthOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">
                                {selectedMonth === 'all'
                                    ? 'No transactions found for this agent'
                                    : 'No transactions found for the selected month'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3">Stage</th>
                                        <th className="px-4 py-3">Deal</th>
                                        <th className="px-4 py-3">Buyer</th>
                                        <th className="px-4 py-3">Project</th>
                                        <th className="px-4 py-3">Transaction</th>
                                        <th className="px-4 py-3">Rate</th>
                                        <th className="px-4 py-3">Commission</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredTransactions.map((tx) => {
                                        // Extract stage from title (e.g., "Commission - Site Clearing - Deal #102")
                                        const stageName = tx.title?.split(' - ')[1] || '-';

                                        return (
                                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                                        {stageName}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{tx.dealTitle}</p>
                                                        <p className="text-xs text-gray-500">#{tx.dealId}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-gray-900">{tx.buyerName || '-'}</td>
                                                <td className="px-4 py-3 text-gray-900">{tx.project || '-'}</td>
                                                <td className="px-4 py-3 text-gray-900">{formatCurrency(tx.transactionAmount)}</td>
                                                <td className="px-4 py-3 text-gray-600">{tx.commissionRate}%</td>
                                                <td className="px-4 py-3 text-purple-600 font-medium">{formatCurrency(tx.commissionAmount)}</td>
                                                <td className="px-4 py-3">
                                                    <Badge variant={getStatusVariant(tx.status)}>
                                                        {tx.status || 'PENDING'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-gray-50 font-medium border-t-2 border-gray-200">
                                    <tr>
                                        <td colSpan={4} className="px-4 py-3 text-gray-900">
                                            Total {selectedMonth !== 'all' && `(${monthOptions.find(o => o.value === selectedMonth)?.label})`}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">{formatCurrency(filteredTotals.totalSales)}</td>
                                        <td className="px-4 py-3"></td>
                                        <td className="px-4 py-3 text-purple-600">{formatCurrency(filteredTotals.totalCommission)}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
