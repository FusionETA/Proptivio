"use client";

import Link from "next/link";

import { formatCurrency } from "@/lib/bitrix/utils";

export function TransactionTable({ transactions }: { transactions: any[] }) {
    return (
        <div className="rounded-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-3">Deal</th>
                            <th className="px-4 py-3">Buyer Name</th>
                            <th className="px-4 py-3">Project</th>
                            <th className="px-4 py-3">Agent</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Rate</th>
                            <th className="px-4 py-3">Commission</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3">
                                    <div>
                                        <p className="font-medium text-gray-900">{t.dealTitle || t.accountNo || '-'}</p>
                                        {t.dealId && <p className="text-xs text-gray-500">#{t.dealId}</p>}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-gray-900">{t.buyerName || '-'}</td>
                                <td className="px-4 py-3 text-gray-900">{t.projectDeveloper || '-'}</td>
                                <td className="px-4 py-3">
                                    {t.agentName && t.agentName !== '-' ? (
                                        <Link
                                            href={`/agent/${t.agentId}`}
                                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-900 font-medium"
                                        >
                                            <span className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                {t.agentName.charAt(0).toUpperCase()}
                                            </span>
                                            <span className="text-xs">{t.agentName}</span>
                                        </Link>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-gray-900">{formatCurrency(t.transactionAmount)}</td>
                                <td className="px-4 py-3 text-gray-600">{t.commissionRate || 0}%</td>
                                <td className="px-4 py-3 text-purple-600 font-medium">{formatCurrency(t.commissionAmount)}</td>
                                <td className="px-4 py-3 text-right">
                                    <Link href={`/transaction/${t.id}`} className="text-indigo-600 hover:text-indigo-900 font-medium text-xs">
                                        View
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
