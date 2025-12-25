import React from 'react';
import { Link } from 'react-router-dom';
import { Receipt, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { ICON_MAP } from '../../utils/icons';

/**
 * RecentTransactionsWidget - Shows 5 most recent transactions
 */
export default function RecentTransactionsWidget({ formatCurrency }) {
    const { data: transactions = [], isLoading } = useQuery({
        queryKey: ['recentTransactions'],
        queryFn: async () => {
            const res = await api.get('/transactions', {
                params: { limit: 5, sort_by: 'date', sort_order: 'desc' }
            });
            // API returns { transactions: [...], total: n } or just array
            const data = res.data;
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.transactions)) return data.transactions;
            return [];
        },
        staleTime: 60000 // 1 minute
    });

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                        <Receipt size={20} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Transactions</h2>
                </div>
                <Link to="/transactions" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    View All <ArrowRight size={14} />
                </Link>
            </div>

            {transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">No transactions yet</p>
                    <Link to="/transactions" className="text-xs text-indigo-500 font-medium hover:underline">
                        Add Transaction
                    </Link>
                </div>
            ) : (
                <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => {
                        const Icon = ICON_MAP[tx.bucket_icon] || Receipt;
                        const isIncome = tx.amount > 0;

                        return (
                            <div key={tx.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${isIncome ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                        <Icon size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-slate-800 dark:text-white truncate max-w-[180px]">
                                            {tx.description}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate">
                                            {tx.bucket_name || 'Uncategorized'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-sm font-semibold whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {isIncome ? '+' : ''}{formatCurrency(tx.amount)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
