"use client";

import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import Link from "next/link";
import { RefreshCw, Users, DollarSign, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/bitrix/utils";

interface Agent {
    id: string;
    name: string;
    totalSales: number;
    totalCommission: number;
    transactionCount: number;
    pendingCount: number;
    approvedCount: number;
}

interface Summary {
    totalSales: number;
    totalCommission: number;
}

export default function AgentsPage() {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAgents = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/agents');
            const data = await response.json();
            setAgents(data.agents || []);
            setSummary(data.summary || null);
        } catch (error) {
            console.error('Failed to load agents:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAgents();
    }, []);

    return (
        <div className="min-h-screen">
            <Header />
            <main className="px-8 py-6">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Agents</h2>
                        <p className="text-gray-500 text-sm mt-1">View commission breakdown by responsible agent</p>
                    </div>
                    <button
                        onClick={loadAgents}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid gap-4 md:grid-cols-4 mb-8">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-600 uppercase tracking-wide font-medium">Total Transactions</p>
                                        <p className="text-2xl font-bold text-blue-900">{agents.reduce((sum, a) => sum + a.transactionCount, 0)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-emerald-600 uppercase tracking-wide font-medium">Total Sales</p>
                                        <p className="text-2xl font-bold text-emerald-900">{formatCurrency(summary.totalSales)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-purple-600 uppercase tracking-wide font-medium">Total Commission</p>
                                        <p className="text-2xl font-bold text-purple-900">{formatCurrency(summary.totalCommission)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-500 rounded-lg">
                                        <Users className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-amber-600 uppercase tracking-wide font-medium">Active Agents</p>
                                        <p className="text-2xl font-bold text-amber-900">{agents.length}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {agents.map((agent) => (
                            <Link href={`/agent/${encodeURIComponent(agent.id)}`} key={agent.id} className="block group">
                                <Card className="h-full transition-all group-hover:border-indigo-300 group-hover:shadow-md">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-md">
                                                    {agent.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                        {agent.name}
                                                    </h3>
                                                    <p className="text-xs text-gray-500">ID: {agent.id}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {agent.pendingCount > 0 && (
                                                    <Badge variant="warning" className="text-[10px] px-1.5 py-0 h-5">
                                                        {agent.pendingCount} Pending
                                                    </Badge>
                                                )}
                                                {agent.approvedCount > 0 && (
                                                    <Badge variant="success" className="text-[10px] px-1.5 py-0 h-5">
                                                        {agent.approvedCount} Approved
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Total Sales</p>
                                                    <p className="font-semibold text-gray-900 mt-1">{formatCurrency(agent.totalSales)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-400 uppercase tracking-wide">Commission</p>
                                                    <p className="font-semibold text-purple-600 mt-1">{formatCurrency(agent.totalCommission)}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-gray-100">
                                                <p className="text-xs text-gray-400 uppercase tracking-wide">Transactions</p>
                                                <p className="font-semibold text-gray-700 mt-1">{agent.transactionCount} commission records</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}

                        {agents.length === 0 && !loading && (
                            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
                                <p className="text-gray-500">No agents found</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
