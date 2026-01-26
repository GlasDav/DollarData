import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, YAxis } from 'recharts';
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

        // Limit to top 5 categories for the widget to ensuring it fits
        if (data.length > 6) {
            const top5 = data.slice(0, 5);
            const others = data.slice(5).reduce((sum, item) => sum + item.value, 0);
            return [...top5, { name: 'Others', value: others }];
        }
        return data;
    }, [safeAccounts]);

    const totalAssets = allocationData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Link
            to="/net-worth"
            className="bg-card dark:bg-card-dark rounded-2xl shadow-sm border border-border dark:border-border-dark hover:shadow-md transition-all relative overflow-hidden group block flex flex-col h-full min-h-[460px]"
        >
            {/* TOP SECTION: Net Worth Trend */}
            <div className="p-6 pb-2 flex-1 flex flex-col">
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
                <div className="h-28 w-full mt-1">
                    {chartData.length >= 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.length === 1 ? [chartData[0], chartData[0]] : chartData}>
                                <defs>
                                    <linearGradient id="netWorthWidgetGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={isPositive ? ASSET_COLOR : LIABILITY_COLOR} stopOpacity={0.2} />
                                        <stop offset="95%" stopColor={isPositive ? ASSET_COLOR : LIABILITY_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <YAxis domain={['dataMin', 'dataMax']} hide />
                                <Tooltip
                                    trigger="hover"
                                    cursor={{ stroke: 'var(--color-text-muted)', strokeWidth: 1, strokeDasharray: '3 3' }}
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-card dark:bg-card-dark p-3 border border-border dark:border-border-dark shadow-xl rounded-xl">
                                                    <p className="text-xs text-text-muted mb-1">{new Date(label).toLocaleDateString()}</p>
                                                    <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                                                        {formatCurrency(payload[0].value)}
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke={isPositive ? ASSET_COLOR : LIABILITY_COLOR}
                                    strokeWidth={3}
                                    fill="url(#netWorthWidgetGradient)"
                                    isAnimationActive={false}
                                    baseValue="dataMin"
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
            <div className="p-5 h-48 bg-surface/30 dark:bg-surface-dark/30">
                <p className="text-[10px] font-bold text-text-muted dark:text-text-muted-dark uppercase tracking-wider mb-3">Asset Allocation</p>
                <div className="h-full flex items-center">
                    {allocationData.length > 0 ? (
                        <div className="w-full h-full flex items-center justify-between gap-4">
                            {/* Donut Chart */}
                            <div className="h-32 w-32 shrink-0 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={allocationData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={55}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {allocationData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-card dark:bg-card-dark p-2.5 border border-border dark:border-border-dark shadow-xl rounded-lg z-50">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></div>
                                                                <p className="text-xs font-semibold text-text-primary dark:text-text-primary-dark">{data.name}</p>
                                                            </div>
                                                            <p className="text-sm font-bold text-text-primary dark:text-text-primary-dark">
                                                                {formatCurrency(data.value)}
                                                            </p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Detailed Legend - Expanded Width */}
                            <div className="flex-1 flex flex-col gap-2 overflow-auto max-h-36 scrollbar-hide py-1">
                                {allocationData.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-xs group/item w-full">
                                        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                            <div
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                            />
                                            <span className="text-text-primary dark:text-text-primary-dark truncate font-medium text-sm" title={item.name}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className="text-text-muted dark:text-text-muted-dark font-mono text-xs font-bold group-hover/item:text-text-primary dark:group-hover/item:text-text-primary-dark transition-colors ml-2">
                                            {totalAssets > 0 ? Math.round((item.value / totalAssets) * 100) : 0}%
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
