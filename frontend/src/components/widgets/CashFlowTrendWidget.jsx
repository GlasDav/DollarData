import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowRight, ArrowRightLeft } from 'lucide-react';
import { CHART_COLORS } from '../../constants/chartColors';

/**
 * CashFlowTrendWidget - Main Dashboard Chart
 * Displays 6-month Income vs Expenses trend.
 * Falls back to Mock Data if API returns empty/zero data.
 */
export default function CashFlowTrendWidget({
    start,
    end,
    interval = 'month',
    trendHistory = [],
    isLoading,
    formatCurrency,
    ignoreOneOff,
    onToggleOneOff
}) {

    // --- Data Processing (Clean - No Mocks) ---
    const data = useMemo(() => {
        const hasData = trendHistory && trendHistory.length > 0 && trendHistory.some(d => d.spent > 0 || d.income > 0);

        if (hasData) {
            return trendHistory;
        }

        // Return empty array to trigger empty state in UI instead of showing mock/dummy data
        return [];
    }, [trendHistory, interval, start, end]);

    if (isLoading) return <div className="h-80 bg-slate-50 dark:bg-slate-800/50 rounded-3xl animate-pulse"></div>;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card dark:bg-card-dark p-4 rounded-xl shadow-xl border border-border dark:border-border-dark">
                    <p className="font-bold text-text-primary dark:text-text-primary-dark mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm mb-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-text-muted dark:text-text-muted-dark capitalize">{entry.name}:</span>
                            <span className="font-semibold text-text-primary dark:text-text-primary-dark">
                                {formatCurrency ? formatCurrency(entry.value) : `$${entry.value}`}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="bg-card dark:bg-card-dark rounded-card p-6 shadow-sm border border-border dark:border-border-dark">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
                        Cash Flow Trend
                    </h2>
                    <p className="text-sm text-text-muted dark:text-text-muted-dark mt-1">
                        Income vs Expenses
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {onToggleOneOff && (
                        <div className="flex items-center gap-2 mr-2">
                            <button
                                onClick={onToggleOneOff}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${ignoreOneOff ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                            >
                                <span
                                    className={`${ignoreOneOff ? 'translate-x-4.5' : 'translate-x-0.5'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                            <span className="text-xs font-medium text-text-muted dark:text-text-muted-dark">Ignore One Off</span>
                        </div>
                    )}

                    <Link
                        to="/reports?tab=cash-flow"
                        className="group flex items-center gap-2 text-primary dark:text-primary-light font-medium text-sm hover:bg-surface dark:hover:bg-surface-dark px-4 py-2 rounded-full transition-all"
                    >
                        <ArrowRightLeft size={16} />
                        View Detailed Flow
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>

            <div className="h-[300px] w-full">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />

                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }}
                                tickFormatter={(val) => {
                                    // Calculate max value in data to determine formatting
                                    const maxVal = Math.max(...data.map(d => Math.max(d.income || 0, d.spent || 0)), 0);
                                    if (maxVal < 5000) {
                                        return `$${val}`;
                                    }
                                    return `$${val / 1000}k`;
                                }}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            <Area
                                type="monotone"
                                dataKey="income"
                                name="Income"
                                stroke="#10B981"
                                fillOpacity={1}
                                fill="url(#colorIncome)"
                                strokeWidth={3}
                            />
                            <Area
                                type="monotone"
                                dataKey="spent"
                                name="Expenses"
                                stroke="#6366F1"
                                fillOpacity={1}
                                fill="url(#colorExpense)"
                                strokeWidth={3}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-text-muted dark:text-text-muted-dark border-2 border-dashed border-border dark:border-border-dark rounded-2xl bg-surface/50 dark:bg-surface-dark/50">
                        <p className="font-medium">No cash flow data available</p>
                        <p className="text-sm mt-1">Connect an account or add transactions to see trends.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
