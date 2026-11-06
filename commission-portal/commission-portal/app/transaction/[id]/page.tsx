"use client";

import { Header } from "@/components/Header";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ChevronLeft, Calendar, User, Building, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { bitrixService } from "@/lib/services/bitrix-service";
import { mapBitrixItem, formatCurrency, formatDate } from "@/lib/bitrix/utils";

export default function TransactionDetail({ params }: { params: Promise<{ id: string }> }) {
    const [transactionId, setTransactionId] = useState<string>('');
    const [transaction, setTransaction] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        params.then(p => setTransactionId(p.id));
    }, [params]);

    const loadTransaction = async () => {
        if (!transactionId) return;

        setLoading(true);
        try {
            const result = await bitrixService.getStatement(parseInt(transactionId));
            const item = result.item || result;
            const mapped = mapBitrixItem(item);
            setTransaction(mapped);
        } catch (error) {
            console.error('Failed to load transaction:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (transactionId) {
            loadTransaction();
        }
    }, [transactionId]);

    const getStatusVariant = (status: string) => {
        if (status === 'APPROVED') return 'success';
        if (status === 'PENDING' || !status) return 'warning';
        return 'destructive';
    };

    if (loading) {
        return (
            <div className="min-h-screen ">
                <Header />
                <main className="px-8 py-6">
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
                    </div>
                </main>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-screen ">
                <Header />
                <main className="px-8 py-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Transaction not found</p>
                        <Link href="/" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
                            Back to Dashboard
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen ">
            <Header />
            <main className="px-8 py-6">
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Back to Overview
                    </Link>
                </div>

                <div className="mb-8 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-sm font-medium text-gray-700">{transaction.accountNo || `#${transaction.id}`}</span>
                            <Badge variant={getStatusVariant(transaction.approvalStatus)}>
                                {transaction.approvalStatus || 'PENDING'}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* General Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Transaction Date</p>
                                    <div className="flex items-center mt-1">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{formatDate(transaction.transactionDate)}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Process Date</p>
                                    <div className="flex items-center mt-1">
                                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{formatDate(transaction.processDate)}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Buyer Name (Customer)</p>
                                <div className="flex items-center mt-1">
                                    <User className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{transaction.buyerName || '-'}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Project / Developer</p>
                                <div className="flex items-center mt-1">
                                    <Building className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>{transaction.projectDeveloper || '-'}</span>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-500">Account No</p>
                                <div className="mt-1 font-mono text-sm">{transaction.accountNo || '-'}</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financials */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Transaction Amount</p>
                                <div className="text-2xl font-bold text-gray-900">{formatCurrency(transaction.transactionAmount)}</div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-600">Commission Rate</p>
                                    <p className="font-semibold text-gray-900">{transaction.commissionRate || 0}%</p>
                                </div>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-600">Total Commission</p>
                                    <p className="font-semibold text-gray-900">{formatCurrency(transaction.commissionAmount)}</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm text-gray-600">Income</p>
                                    <p className="font-semibold text-indigo-600">{formatCurrency(transaction.developerIncome)}</p>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-500">
                                    <p>Developer Rate</p>
                                    <p>{transaction.developerRate || 0}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
