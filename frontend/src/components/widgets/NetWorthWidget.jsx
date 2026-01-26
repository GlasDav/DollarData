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
            className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark hover:shadow-md transition-all relative overflow-hidden group block"
        >
            <div className="flex flex-col h-full justify-between gap-6">

                {/* Header Section */}
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

                {/* Content Grid: Sparkline (Left) vs Allocation (Right) */}
                <div className="grid grid-cols-2 gap-4 flex-1 items-end">

                    {/* Left: Trend Sparkline */}
                    <div className="h-24 w-full">
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
                                        contentStyle={{ display: 'none' }} // Hide tooltip for cleaner widget look
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={isPositive ? ASSET_COLOR : LIABILITY_COLOR}
                                        strokeWidth={2}
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

                    {/* Right: Allocation Legend/Donut */}
                    <div className="h-24 w-full relative">
                        {allocationData.length > 0 ? (
                            <div className="flex items-center gap-2 h-full">
                                <div className="h-20 w-20 shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={allocationData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={25}
                                                outerRadius={35}
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
                                </div>
                                {/* Mini Legend */}
                                <div className="flex flex-col gap-1 overflow-auto max-h-24 scrollbar-hide">
                                    {allocationData.slice(0, 3).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-1.5 min-w-0">
                                            <div
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                            />
                                            <span className="text-[10px] text-text-muted dark:text-text-muted-dark truncate font-medium">
                                                {item.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-xs text-text-muted">
                                No assets
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </Link>
    );
}
