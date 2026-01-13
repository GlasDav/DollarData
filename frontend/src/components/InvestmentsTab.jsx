import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    TrendingUp, TrendingDown, DollarSign, PieChart,
    RefreshCw, Plus, Filter, ArrowUpRight, ArrowDownRight,
    Briefcase, Activity
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { SkeletonBox as Skeleton } from './Skeleton';
import AddTradeModal from './AddTradeModal';
import ImportTradesModal from './ImportTradesModal';

export default function InvestmentsTab() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // --- Queries ---

    const { data: portfolio, isLoading: loadingPortfolio } = useQuery({
        queryKey: ['investments-portfolio'],
        queryFn: async () => (await api.get('/investments/portfolio')).data
    });

    const { data: history = [], isLoading: loadingHistory } = useQuery({
        queryKey: ['investments-history'],
        queryFn: async () => (await api.get('/investments/history')).data
    });

    const { data: allocation, isLoading: loadingAllocation } = useQuery({
        queryKey: ['investments-allocation'],
        queryFn: async () => (await api.get('/investments/allocation')).data
    });

    const { data: holdings = [], isLoading: loadingHoldings } = useQuery({
        queryKey: ['investments-holdings'],
        queryFn: async () => (await api.get('/investments/holdings')).data
    });

    // --- Mutations ---

    const refreshPricesMutation = useMutation({
        mutationFn: async () => (await api.post('/net-worth/holdings/refresh-prices')).data,
        onMutate: () => setRefreshing(true),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['investments-portfolio']);
            queryClient.invalidateQueries(['investments-allocation']);
            queryClient.invalidateQueries(['investments-holdings']);
            queryClient.invalidateQueries(['investments-history']);
            // Successfully updated holdings
        },
        onSettled: () => setRefreshing(false)
    });

    // --- Helpers ---

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: user?.currency_symbol?.replace('$', '') || 'AUD'
        }).format(val);
    };

    const formatPercent = (val) => {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val / 100);
    };

    const COLORS = [
        'var(--color-accent-success)',
        'var(--color-primary)',
        'var(--color-primary-light)',
        'var(--color-accent-warning)',
        'var(--color-accent-error)',
        'var(--color-text-muted)'
    ];

    // --- Render ---

    return (
        <div className="space-y-6">
            <AddTradeModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
            <ImportTradesModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
                        <Briefcase className="text-accent-success" />
                        Investments
                    </h2>
                    <p className="text-text-muted dark:text-text-muted-dark text-sm">
                        Track your portfolio performance across all asset classes.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => refreshPricesMutation.mutate()}
                        disabled={refreshing}
                        className={`flex items-center gap-2 px-4 py-2 bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg text-sm font-medium text-text-primary dark:text-text-primary-dark hover:bg-surface dark:hover:bg-card-dark-hover transition-colors ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Updating Prices...' : 'Refresh Prices'}
                    </button>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-card dark:bg-card-dark border border-border dark:border-border-dark rounded-lg text-sm font-medium text-text-primary dark:text-text-primary-dark hover:bg-surface dark:hover:bg-card-dark-hover transition-colors"
                    >
                        <ArrowDownRight size={16} />
                        <span className="hidden sm:inline">Import Trades</span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Add Trade
                    </button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Value */}
                <div className="bg-card dark:bg-card-dark p-6 rounded-xl shadow-sm border border-border dark:border-border-dark">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Total Portfolio Value</span>
                        <div className="p-2 bg-accent-success/10 dark:bg-accent-success/20 rounded-lg text-accent-success">
                            <DollarSign size={20} />
                        </div>
                    </div>
                    {loadingPortfolio ? <Skeleton className="h-8 w-32" /> : (
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
                                {formatCurrency(portfolio?.total_value || 0)}
                            </h3>
                            <p className="text-sm text-text-muted dark:text-text-muted-dark">
                                Across {portfolio?.holding_count || 0} holdings
                            </p>
                        </div>
                    )}
                </div>

                {/* Total Return */}
                <div className="bg-card dark:bg-card-dark p-6 rounded-xl shadow-sm border border-border dark:border-border-dark">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Total Return</span>
                        <div className={`p-2 rounded-lg ${(portfolio?.total_return || 0) >= 0 ? 'bg-accent-success/10 dark:bg-accent-success/20 text-accent-success' : 'bg-accent-error/10 dark:bg-accent-error/20 text-accent-error'}`}>
                            {(portfolio?.total_return || 0) >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                        </div>
                    </div>
                    {loadingPortfolio ? <Skeleton className="h-8 w-32" /> : (
                        <div className="space-y-1">
                            <h3 className={`text-3xl font-bold ${(portfolio?.total_return || 0) >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                                {((portfolio?.total_return || 0) >= 0 ? '+' : '')}{formatCurrency(portfolio?.total_return || 0)}
                            </h3>
                            <p className={`text-sm font-medium ${(portfolio?.total_return_percent || 0) >= 0 ? 'text-accent-success' : 'text-accent-error'}`}>
                                {((portfolio?.total_return_percent || 0) >= 0 ? '+' : '')}{formatPercent(portfolio?.total_return_percent || 0)} all time
                            </p>
                        </div>
                    )}
                </div>

                {/* Allocation Summary (Mini) */}
                <div className="bg-card dark:bg-card-dark p-6 rounded-xl shadow-sm border border-border dark:border-border-dark">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Top Sectors</span>
                        <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary">
                            <PieChart size={20} />
                        </div>
                    </div>
                    {loadingAllocation ? <Skeleton className="h-20 w-full" /> : (
                        <div className="space-y-3 pt-2">
                            {(allocation?.by_sector || []).slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                        <span className="text-text-muted dark:text-text-muted-dark truncate max-w-[120px]">{item.name}</span>
                                    </div>
                                    <span className="font-medium text-text-primary dark:text-text-primary-dark">{Math.round(item.percent)}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* History Chart */}
                <div className="lg:col-span-2 bg-card dark:bg-card-dark p-6 rounded-xl shadow-sm border border-border dark:border-border-dark">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-6">Portfolio Performance</h3>
                    <div className="h-[300px]">
                        {loadingHistory ? <div className="h-full flex items-center justify-center text-text-muted">Loading chart...</div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={history}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                        tickMargin={10}
                                    />
                                    <YAxis
                                        orientation="right"
                                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                        stroke="var(--color-text-muted)"
                                        tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        formatter={(val) => [formatCurrency(val), 'Value']}
                                        labelFormatter={(d) => new Date(d).toLocaleDateString()}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--color-accent-success)"
                                        strokeWidth={3}
                                        dot={false}
                                        activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--color-accent-success)' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Asset Allocation */}
                <div className="bg-card dark:bg-card-dark p-6 rounded-xl shadow-sm border border-border dark:border-border-dark flex flex-col">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark mb-6">Asset Allocation</h3>
                    <div className="flex-1 min-h-[300px] relative">
                        {loadingAllocation ? <div className="h-full flex items-center justify-center text-text-muted">Loading chart...</div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={allocation?.by_type || []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {(allocation?.by_type || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(val) => formatCurrency(val)}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        align="center"
                                        layout="horizontal"
                                        iconSize={8}
                                        wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                                    />
                                </RePieChart>
                            </ResponsiveContainer>
                        )}
                        {/* Center Text */}
                        {!loadingAllocation && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                                        {allocation?.by_type?.length || 0}
                                    </span>
                                    <span className="text-xs text-text-muted">Types</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Holdings Table */}
            <div className="bg-card dark:bg-card-dark rounded-xl shadow-sm border border-border dark:border-border-dark overflow-hidden">
                <div className="p-6 border-b border-border dark:border-border-dark flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">Holdings</h3>
                    <div className="flex gap-2">
                        <button className="p-2 text-text-muted hover:text-text-primary dark:hover:text-text-primary-dark">
                            <Filter size={18} />
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-surface dark:bg-surface-dark text-text-muted dark:text-text-muted-dark text-xs uppercase font-medium">
                            <tr>
                                <th className="px-6 py-4">Asset</th>
                                <th className="px-6 py-4">Quantity</th>
                                <th className="px-6 py-4">Current Price</th>
                                <th className="px-6 py-4">Cost Basis</th>
                                <th className="px-6 py-4">Market Value</th>
                                <th className="px-6 py-4 text-right">Return</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border dark:divide-border-dark">
                            {holdings.map((h) => {
                                const isPositive = h.total_return >= 0;
                                return (
                                    <tr key={h.id} className="hover:bg-surface dark:hover:bg-surface-dark/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent-success/10 dark:bg-accent-success/20 flex items-center justify-center text-accent-success font-bold text-xs ring-2 ring-card dark:ring-card-dark">
                                                    {h.ticker?.slice(0, 1) || '?'}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-text-primary dark:text-text-primary-dark">{h.ticker}</div>
                                                    <div className="text-xs text-text-muted">{h.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-text-secondary-dark">
                                            {h.quantity?.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-text-secondary-dark font-medium">
                                            {formatCurrency(h.price)}
                                            <span className="text-xs text-text-muted ml-1 font-normal">({h.currency})</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-text-secondary-dark">
                                            {formatCurrency(h.cost_basis)}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-text-primary dark:text-text-primary-dark">
                                            {formatCurrency(h.value)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className={`text-sm font-medium ${isPositive ? 'text-accent-success' : 'text-accent-error'}`}>
                                                    {isPositive ? '+' : ''}{formatCurrency(h.total_return)}
                                                </span>
                                                <div className={`flex items-center gap-0.5 text-xs ${isPositive ? 'text-accent-success bg-accent-success/10 dark:bg-accent-success/20' : 'text-accent-error bg-accent-error/10 dark:bg-accent-error/20'} px-1.5 py-0.5 rounded-full mt-1`}>
                                                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                                    {formatPercent(h.total_return_percent)}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {holdings.length === 0 && !loadingHoldings && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-text-muted">
                                        No investments found. Add your first holding to see it here!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
