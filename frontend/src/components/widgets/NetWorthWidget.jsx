import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { ASSET_COLOR, LIABILITY_COLOR, CHART_COLORS } from '../../constants/chartColors';

/**
 * NetWorthWidget - Dashboard Widget
 * Displays total Net Worth with a sparkline trend and an asset allocation donut chart.
 */
export default function NetWorthWidget({ history: historyProp = [], accounts = [], formatCurrency }) {
    // Defensive checks
    const history = Array.isArray(historyProp) ? historyProp : [];
    const safeAccounts = Array.isArray(accounts) ? accounts : [];

    // --- Stats & Trend Logic ---
    const latestSnapshot = history.length > 0 ? history[history.length - 1] : null;
    const prevSnapshot = history.length > 1 ? history[history.length - 2] : null;

    const currentNetWorth = latestSnapshot?.net_worth || 0;
    const prevNetWorth = prevSnapshot?.net_worth || 0;
    const change = currentNetWorth - prevNetWorth;
    const changePercent = prevNetWorth !== 0 ? (change / Math.abs(prevNetWorth)) * 100 : 0;
    const isPositive = change >= 0;

    // Sparkline data (last 6 months)
    const chartData = useMemo(() => {
        return history.slice(-6).map(s => ({
            date: s.date,
            value: s.net_worth
        }));
    }, [history]);

    // --- Asset Allocation Logic ---
    const allocationData = useMemo(() => {
        const map = {};
        safeAccounts.forEach(acc => {
            // Only count assets with positive balance
            if (acc.type === 'Asset' && (acc.balance || 0) > 0) {
                map[acc.category] = (map[acc.category] || 0) + acc.balance;
            }
        });

        const data = Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // Limit to top 4 categories + Others to keep widget clean
        if (data.length > 5) {
            const top4 = data.slice(0, 4);
            const others = data.slice(4).reduce((sum, item) => sum + item.value, 0);
            return [...top4, { name: 'Others', value: others }];
        }
        return data;
    }, [safeAccounts]);

    return (
        <Link
            to="/net-worth"
            className="bg-card dark:bg-card-dark rounded-2xl shadow-sm border border-border dark:border-border-dark hover:shadow-md transition-all relative overflow-hidden group block flex flex-col h-[420px]"
        >
            {/* TOP SECTION: Net Worth Trend */}
            <div className="p-6 pb-2 flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Wallet size={18} className="text-text-muted dark:text-text-muted-dark" />
                            <span className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Net Worth</span>
                        </div>
                        {change !== 0 && (
                            <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                <span>{isPositive ? '+' : ''}{changePercent.toFixed(1)}%</span>
                            </div>
                        )}
                    </div>
                    <p className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
                        {formatCurrency(currentNetWorth)}
                    </p>
                </div>

                {/* Line Chart Area (Expanded) */}
                <div className="h-32 w-full mt-2">
                    {chartData.length >= 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.length === 1 ? [chartData[0], chartData[0]] : chartData}>
                                <defs>
                                    <linearGradient id="netWorthWidgetGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPositive ? ASSET_COLOR : LIABILITY_COLOR} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={isPositive ? ASSET_COLOR : LIABILITY_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Tooltip
                                    labelStyle={{ display: 'none' }}
                                    contentStyle={{ display: 'none' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isPositive ? ASSET_COLOR : LIABILITY_COLOR}
                                    strokeWidth={3}
                                    fill="url(#netWorthWidgetGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center border-t border-border dark:border-border-dark">
                            <span className="text-xs text-text-muted">No history</span>
                        </div>
                    )}
                </div>
            </div>

            {/* SEPARATOR */}
            <div className="h-px bg-border dark:bg-border-dark mx-6" />

            {/* BOTTOM SECTION: Asset Allocation */}
            <div className="p-5 h-40 bg-surface/30 dark:bg-surface-dark/30">
                <p className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-2">Asset Allocation</p>
                <div className="h-full flex items-center">
                    {allocationData.length > 0 ? (
                        <div className="w-full h-full flex items-center justify-between gap-2">
                            {/* Donut Chart */}
                            <div className="h-28 w-28 shrink-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={45}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {allocationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text (Total Assets) - Optional, keeping empty for now to avoid clutter */}
                            </div>

                            {/* Detailed Legend */}
                            <div className="flex-1 flex flex-col gap-1.5 overflow-auto max-h-28 scrollbar-hide pl-2">
                                {allocationData.slice(0, 4).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs group/item">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                            />
                                            <span className="text-text-primary dark:text-text-primary-dark truncate font-medium max-w-[90px]" title={item.name}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-text-muted dark:text-text-muted-dark font-mono text-[10px] group-hover/item:text-text-primary dark:group-hover/item:text-text-primary-dark transition-colors">
                                            {Math.round((item.value / allocationData.reduce((a, b) => a + b.value, 0)) * 100)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-20 w-full flex items-center justify-center text-xs text-text-muted">
                            No asset data found
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
