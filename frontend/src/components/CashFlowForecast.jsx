import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { getCashFlowForecast } from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';

export default function CashFlowForecast() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['cash-flow-forecast'],
        queryFn: () => getCashFlowForecast()
    });

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    if (isLoading) {
        return (
            <div className="bg-card rounded-2xl p-6 border border-border">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 w-48 bg-surface rounded"></div>
                    <div className="h-64 bg-surface rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                <p className="text-red-600 dark:text-red-400">Failed to load forecast data</p>
            </div>
        );
    }

    const forecast = data?.forecast || [];
    const currentBalance = data?.current_balance || 0;
    const monthlyIncome = data?.monthly_income || 0;
    const monthlyExpenses = data?.monthly_expenses || 0;
    const netMonthly = data?.net_monthly || 0;
    const insights = data?.insights || {};

    const isPositive = netMonthly >= 0;
    const willGoNegative = insights.months_until_negative !== null;

    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            {isPositive ? (
                                <TrendingUp className="text-emerald-500" />
                            ) : (
                                <TrendingDown className="text-red-500" />
                            )}
                            12-Month Cash Flow Forecast
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Based on your budget (income - expenses)
                        </p>
                    </div>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-border">
                <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Available Cash</p>
                    <p className="text-xl font-bold text-text-primary mt-1">
                        {formatCurrency(currentBalance)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Monthly Income</p>
                    <p className="text-xl font-bold text-emerald-600 mt-1">
                        +{formatCurrency(monthlyIncome)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Monthly Expenses</p>
                    <p className="text-xl font-bold text-text-primary mt-1">
                        {formatCurrency(monthlyExpenses)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Net Monthly</p>
                    <p className={`text-xl font-bold mt-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(netMonthly)}
                    </p>
                </div>
            </div>

            {/* Warning Banner */}
            {willGoNegative && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>Warning:</strong> Balance goes negative in {insights.months_until_negative} months
                    </p>
                </div>
            )}

            {/* Chart */}
            <div className="p-6">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={forecast} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 11 }}
                                className="text-text-secondary"
                                tickLine={false}
                            />
                            <YAxis
                                tickFormatter={(val) => {
                                    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                                    return `$${val}`;
                                }}
                                tick={{ fontSize: 11 }}
                                className="text-text-secondary"
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                formatter={(value) => [formatCurrency(value), 'Balance']}
                                contentStyle={{
                                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white'
                                }}
                            />
                            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                            <Bar dataKey="balance" radius={[4, 4, 0, 0]}>
                                {forecast.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.balance >= 0 ? '#8b5cf6' : '#ef4444'}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface border-t border-border">
                <p className="text-xs text-text-secondary text-center">
                    Projected end balance in 12 months: <strong>{formatCurrency(insights.projected_end_balance || 0)}</strong>
                </p>
            </div>
        </div>
    );
}
