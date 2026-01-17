import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, AlertTriangle, Wallet } from 'lucide-react';
import { getCashFlowForecast } from '../services/api';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export default function CashFlowForecast({ days = 90 }) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['cash-flow-forecast', days],
        queryFn: () => getCashFlowForecast(days)
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
    const insights = data?.insights || {};
    const upcomingEvents = data?.upcoming_events || [];
    const spendingBreakdown = data?.spending_breakdown || {};

    // Get lowest point info
    const lowestPoint = insights.lowest_point || {};
    const willGoDanger = insights.days_until_danger !== null && insights.days_until_danger !== undefined;

    // Prepare chart data - sample every few days for cleaner display
    const chartData = forecast.filter((_, idx) => idx === 0 || idx % 3 === 0 || idx === forecast.length - 1)
        .map(point => ({
            date: point.date,
            label: point.label,
            balance: Math.round(point.balance),
            isProjected: point.is_projected
        }));

    return (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                            <TrendingUp className="text-primary" />
                            Cash Flow Forecast
                        </h3>
                        <p className="text-sm text-text-secondary mt-1">
                            Projected balance for the next {days} days
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4 p-6 border-b border-border">
                <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Available Cash</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">
                        {formatCurrency(currentBalance)}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Daily Spending</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">
                        {formatCurrency(spendingBreakdown.daily_total || 0)}/day
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-text-secondary uppercase tracking-wide">Lowest Point</p>
                    <p className={`text-2xl font-bold mt-1 ${lowestPoint.balance < 500 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {formatCurrency(lowestPoint.balance || 0)}
                    </p>
                    {lowestPoint.days_away > 0 && (
                        <p className="text-xs text-text-secondary">in {lowestPoint.days_away} days</p>
                    )}
                </div>
            </div>

            {/* Warning Banner */}
            {willGoDanger && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-3">
                    <AlertTriangle className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>Warning:</strong> Balance drops below ${insights.danger_threshold} in {insights.days_until_danger} days
                    </p>
                </div>
            )}

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
                <div className="p-6 border-b border-border">
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Next Events</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {upcomingEvents.slice(0, 4).map((event, idx) => (
                            <div
                                key={`${event.id}-${idx}`}
                                className={`flex-shrink-0 px-3 py-2 rounded-lg border ${event.type === 'Income'
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                        : 'bg-card border-border'
                                    }`}
                            >
                                <p className={`text-sm font-semibold ${event.type === 'Income' ? 'text-emerald-600' : 'text-text-primary'}`}>
                                    {event.type === 'Income' ? '+' : ''}{formatCurrency(Math.abs(event.amount))}
                                </p>
                                <p className="text-xs text-text-secondary truncate" style={{ maxWidth: '100px' }}>{event.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="p-6">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <defs>
                                <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12 }}
                                className="text-text-secondary"
                            />
                            <YAxis
                                tickFormatter={(val) => {
                                    if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                                    return `$${val}`;
                                }}
                                tick={{ fontSize: 12 }}
                                className="text-text-secondary"
                                domain={['dataMin - 500', 'dataMax + 500']}
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
                            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="5 5" />
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, fill: '#8b5cf6' }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-surface border-t border-border">
                <p className="text-xs text-text-secondary text-center">
                    Forecast based on your budget limits and scheduled payments
                </p>
            </div>
        </div>
    );
}
