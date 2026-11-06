"use client";

import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitleSmall } from "@/components/ui/Card";
import { TransactionTable } from "@/components/TransactionTable";
import { DollarSign, FileText, RefreshCw, Calendar } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { bitrixService } from "@/lib/services/bitrix-service";
import { mapBitrixItem } from "@/lib/bitrix/utils";

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

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [stats, setStats] = useState({
    totalCommission: 0,
  });

  const monthOptions = useMemo(() => getMonthOptions(), []);

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
  const filteredStats = useMemo(() => {
    return {
      totalCommission: filteredTransactions.reduce((sum: number, t: any) => sum + (t.commissionAmount || 0), 0),
      recordCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const result = await bitrixService.getTransactions();
      const items = result.items || [];
      const mapped = items.map(mapBitrixItem);
      setTransactions(mapped);

      // Calculate stats

      const totalCommission = mapped.reduce((sum: number, t: any) => sum + (t.commissionAmount || 0), 0);

      setStats({ totalCommission });
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="px-8 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Transaction Overview</h2>
            <p className="text-gray-500 text-sm mt-1">Real-time commission transaction records</p>
          </div>
          <button
            onClick={loadTransactions}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Month Filter */}
        <div className="flex items-center gap-2 mb-6">
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

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitleSmall>{selectedMonth === 'all' ? 'Total Commission' : 'Filtered Commission'}</CardTitleSmall>
              <DollarSign className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">RM {filteredStats.totalCommission.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedMonth === 'all' ? 'From all transactions' : `From ${monthOptions.find(o => o.value === selectedMonth)?.label}`}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitleSmall>{selectedMonth === 'all' ? 'Total Records' : 'Filtered Records'}</CardTitleSmall>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredStats.recordCount}</div>
              <p className="text-xs text-gray-500 mt-1">
                {selectedMonth === 'all' ? 'In system' : `of ${transactions.length} total`}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">
                {selectedMonth === 'all'
                  ? 'No transactions found'
                  : 'No transactions found for the selected month'}
              </p>
            </div>
          ) : (
            <TransactionTable transactions={filteredTransactions} />
          )}
        </div>
      </main>
    </div>
  );
}
