import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { refreshHoldingPrices, getInvestmentHistory, downloadNetWorthTemplate } from '../services/api';
import {
    TrendingUp, TrendingDown, Plus, DollarSign,
    Landmark, CreditCard, Wallet, LineChart, RefreshCw, X, Home, PiggyBank, Download, Upload
} from 'lucide-react';
import { AreaChart, Area, Line, PieChart, Pie, Cell, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import AccountDetailsModal from '../components/AccountDetailsModal';
import AddTradeModal from '../components/AddTradeModal';
import InvestmentsTab from '../components/InvestmentsTab';
import ImportNetWorthModal from '../components/ImportNetWorthModal';
import AccountsHistoryTab from '../components/AccountsHistoryTab';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, NET_WORTH_COLOR, ASSET_COLOR, LIABILITY_COLOR } from '../constants/chartColors';

const getCategoryIcon = (category, type) => {
    const c = (category || '').toLowerCase();
    if (c.includes('property') || c.includes('real estate') || c.includes('mortgage')) return Home;
    if (c.includes('investment')) return TrendingUp;
    if (c.includes('super')) return Landmark;
    if (c.includes('loan')) return Landmark;
    if (c.includes('credit card')) return CreditCard;
    if (c.includes('savings')) return PiggyBank;
    return type === 'Asset' ? Wallet : CreditCard;
};

export default function NetWorth() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('overview');

    const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [chartMode, setChartMode] = useState('net_worth');
    const [showProjection, setShowProjection] = useState(false);
    const [isInvestmentModalOpen, setIsInvestmentModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState(null); // null = all categories

    // Helper
    const formatCurrency = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    // --- Data Fetching ---
    const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => (await api.get('/net-worth/accounts')).data
    });

    const { data: history = [], isLoading: loadingHistory } = useQuery({
        queryKey: ['netWorthHistory'],
        queryFn: async () => (await api.get('/net-worth/history')).data
    });

    const { data: investmentHistory = [], isLoading: loadingInvHistory } = useQuery({
        queryKey: ['investmentHistory'],
        queryFn: getInvestmentHistory
    });

    // Accounts History for Stacked Breakdown Chart
    const { data: accountsHistory = { months: [], dates: [], accounts: [], totals: {} } } = useQuery({
        queryKey: ['accountsHistory'],
        queryFn: async () => (await api.get('/net-worth/accounts-history')).data
    });

    // Projection Data
    const { data: projectionData = [] } = useQuery({
        queryKey: ['netWorthProjection'],
        queryFn: async () => (await api.get('/analytics/networth-projection?months=12')).data,
        enabled: showProjection
    });

    // --- Mutations ---
    const createAccountMutation = useMutation({
        mutationFn: async (newAccount) => {
            await api.post('/net-worth/accounts', newAccount);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['accounts']);
            setIsAddAccountOpen(false);
        }
    });

    const refreshPricesMutation = useMutation({
        mutationFn: refreshHoldingPrices,
        onSuccess: (data) => {
            queryClient.invalidateQueries(['netWorthHistory']);
            queryClient.invalidateQueries(['investmentHistory']);
            queryClient.invalidateQueries(['holdings']);
        },
        onError: (err) => {
            console.error("Failed to refresh prices:", err);
        }
    });

    // --- Auto-Refresh on Load ---
    React.useEffect(() => {
        refreshPricesMutation.mutate();
    }, []);

    // --- Derived State ---
    const latestSnapshot = history.length > 0 ? history[history.length - 1] : null;
    const currentNetWorth = latestSnapshot ? latestSnapshot.net_worth : 0;
    const prevNetWorth = history.length > 1 ? history[history.length - 2].net_worth : 0;
    const change = currentNetWorth - prevNetWorth;
    const changePercent = prevNetWorth !== 0 ? (change / Math.abs(prevNetWorth)) * 100 : 0;

    // --- Add Account Form (Inline) ---
    const [newAccountName, setNewAccountName] = useState("");
    const [newAccountType, setNewAccountType] = useState("Asset");
    const [newAccountCategory, setNewAccountCategory] = useState("Cash");

    const handleAddAccount = (e) => {
        e.preventDefault();
        const defaultCategory = newAccountType === 'Asset' ? 'Cash' : 'Loan';
        createAccountMutation.mutate({
            name: newAccountName,
            type: newAccountType,
            category: defaultCategory
        });
        setNewAccountName("");
    };

    // --- Allocation Data ---
    const accountBalances = useMemo(() => {
        const balMap = {};
        if (latestSnapshot?.balances) {
            latestSnapshot.balances.forEach(b => {
                balMap[b.account_id] = b.balance;
            });
        }
        accounts.forEach(acc => {
            if (acc.balance !== undefined && acc.balance !== null) {
                balMap[acc.id] = acc.balance;
            }
        });
        return balMap;
    }, [latestSnapshot, accounts]);

    const allocationData = useMemo(() => {
        const map = {};
        accounts.forEach(acc => {
            if (acc.type === 'Asset') {
                const bal = accountBalances[acc.id] || 0;
                if (bal > 0) {
                    map[acc.category] = (map[acc.category] || 0) + bal;
                }
            }
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [accounts, accountBalances]);

    // Chart Data Config
    const chartData = useMemo(() => {
        if (chartMode === 'investments') return investmentHistory;

        let data = [...history];
        if (showProjection && projectionData.length > 0 && data.length > 0) {
            const lastHistory = data[data.length - 1];
            const projectedPoints = projectionData.map(p => ({
                ...p,
                net_worth: undefined,
                projected_net_worth: p.net_worth
            }));

            projectedPoints.unshift({
                date: lastHistory.date,
                projected_net_worth: lastHistory.net_worth
            });

            return [...data, ...projectedPoints.slice(1)];
        }
        return history;
    }, [chartMode, history, investmentHistory, showProjection, projectionData]);

    const unifiedData = useMemo(() => {
        if (chartMode !== 'net_worth' || !showProjection) return chartData;

        const base = history.map(h => ({ ...h, is_projected: false }));
        if (projectionData.length === 0) return base;

        const proj = projectionData.map(p => ({ ...p, is_projected: true, projected_net_worth: p.net_worth, net_worth: undefined }));

        if (base.length > 0) {
            const last = base[base.length - 1];
            const connection = {
                ...last,
                projected_net_worth: last.net_worth,
            };
            base[base.length - 1] = connection;
        }

        return [...base, ...proj];
    }, [chartMode, chartData, showProjection, history, projectionData]);

    const activeData = (chartMode === 'net_worth' && showProjection) ? unifiedData : chartData;
    const chartDataKey = chartMode === 'net_worth' ? 'net_worth' : 'value';
    const chartColor = chartMode === 'net_worth' ? NET_WORTH_COLOR : CHART_COLORS[4]; // Violet for investments

    // Stacked Breakdown Chart Data (simplified categories)
    const { breakdownData, displayCategories } = useMemo(() => {
        if (!accountsHistory.accounts?.length || !accountsHistory.dates?.length) {
            return { breakdownData: [], displayCategories: [] };
        }

        // Get unique asset categories (excluding Property which will be netted)
        const assetCatSet = new Set();
        accountsHistory.accounts.forEach(acc => {
            if (acc.type === 'Asset' && acc.category && acc.category !== 'Property') {
                assetCatSet.add(acc.category);
            }
        });
        const otherAssetCats = Array.from(assetCatSet).sort();

        // Build data points for each date
        const data = accountsHistory.dates.map((date, idx) => {
            const point = { date: date };
            let totalAssets = 0;
            let totalLiabilities = 0;
            let propertyAssets = 0;
            let mortgageLiabilities = 0;
            let otherLiabilities = 0;

            // Aggregate balances
            accountsHistory.accounts.forEach(acc => {
                const balance = acc.balances_by_month[idx] || 0;
                if (acc.type === 'Asset') {
                    totalAssets += balance;
                    if (acc.category === 'Property') {
                        propertyAssets += balance;
                    } else {
                        // Other asset categories
                        point[acc.category] = (point[acc.category] || 0) + balance;
                    }
                } else if (acc.type === 'Liability') {
                    totalLiabilities += balance;
                    if (acc.category === 'Mortgage') {
                        mortgageLiabilities += balance;
                    } else {
                        otherLiabilities += balance;
                    }
                }
            });

            // Net Property = Property assets - Mortgage liabilities
            point['Net Property'] = propertyAssets - mortgageLiabilities;

            // Combined Liabilities (negative for display below zero, excluding mortgage which is netted)
            if (otherLiabilities > 0) {
                point['Liabilities'] = -otherLiabilities;
            }

            point['Net Worth'] = totalAssets - totalLiabilities;
            return point;
        });

        // Build display categories: other assets + Net Property + Liabilities (if exists)
        const cats = [...otherAssetCats, 'Net Property'];
        // Only add Liabilities if there are any
        const hasLiabilities = data.some(d => d['Liabilities'] && d['Liabilities'] < 0);
        if (hasLiabilities) {
            cats.push('Liabilities');
        }

        return { breakdownData: data, displayCategories: cats };
    }, [accountsHistory]);

    // Create color map for categories based on donut chart ordering (by value descending)
    const categoryColorMap = useMemo(() => {
        const map = {};
        // Match donut chart ordering - allocationData is sorted by value descending
        allocationData.forEach((item, idx) => {
            map[item.name] = CHART_COLORS[idx % CHART_COLORS.length];
        });
        // Net Property uses Property's color from donut
        map['Net Property'] = map['Property'] || '#6366f1';
        // Liabilities is always red
        map['Liabilities'] = '#ef4444';
        return map;
    }, [allocationData]);

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8">
            {/* Header - Only Show in Overview */}
            {activeTab === 'overview' && (
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">Net Worth</h1>
                        <p className="text-text-muted dark:text-text-muted-dark mt-1">Track your assets and liabilities over time.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={downloadNetWorthTemplate}
                            className="border border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark text-text-secondary hover:text-text-primary px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition text-sm"
                            title="Download a CSV template with example data"
                        >
                            <Download size={18} />
                            Template
                        </button>
                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="border border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark text-text-secondary hover:text-text-primary px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition text-sm"
                            title="Import net worth history from CSV"
                        >
                            <Upload size={18} />
                            Import
                        </button>

                    </div>
                </header>
            )}

            {/* Tabs */}
            <div className="flex border-b border-border dark:border-border-dark mb-6">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary dark:text-text-muted-dark dark:hover:text-text-primary-dark'}`}
                >
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('accounts')}
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'accounts' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary dark:text-text-muted-dark dark:hover:text-text-primary-dark'}`}
                >
                    Accounts
                </button>
                <button
                    onClick={() => setActiveTab('investments')}
                    className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'investments' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-text-primary dark:text-text-muted-dark dark:hover:text-text-primary-dark'}`}
                >
                    Investments
                </button>
            </div>

            {activeTab === 'overview' ? (
                <>
                    {/* Overview Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark">
                            <p className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Net Worth</p>
                            <div className="flex items-end gap-3 mt-1">
                                <span className="text-3xl font-bold text-text-primary dark:text-text-primary-dark">
                                    {formatCurrency(currentNetWorth)}
                                </span>
                                {history.length > 1 && (
                                    <span className={`text-sm font-medium mb-1 px-2 py-0.5 rounded-full flex items-center gap-1 ${change >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                        {Math.abs(changePercent).toFixed(1)}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark">
                            <p className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Total Assets</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-1">
                                {formatCurrency(latestSnapshot?.total_assets || 0)}
                            </p>
                        </div>
                        <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark">
                            <p className="text-sm font-medium text-text-muted dark:text-text-muted-dark">Total Liabilities</p>
                            <p className="text-3xl font-bold text-red-600 mt-1">
                                {formatCurrency(latestSnapshot?.total_liabilities || 0)}
                            </p>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Net Worth History Chart */}

                        <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark h-96 flex flex-col">
                            <div className="flex justify-between items-center mb-6 shrink-0">
                                <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
                                    <LineChart size={20} className="text-primary" />
                                    History
                                </h3>
                                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                                    <button
                                        onClick={() => setChartMode('net_worth')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${chartMode === 'net_worth' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                                    >
                                        Net Worth
                                    </button>
                                    <button
                                        onClick={() => setChartMode('breakdown')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${chartMode === 'breakdown' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                                    >
                                        Breakdown
                                    </button>
                                    <button
                                        onClick={() => setChartMode('investments')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${chartMode === 'investments' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                                    >
                                        Investments
                                    </button>
                                </div>
                                {chartMode === 'net_worth' && (
                                    <div className="flex items-center gap-2 ml-4">
                                        <label className="flex items-center cursor-pointer relative">
                                            <input type="checkbox" checked={showProjection} onChange={(e) => setShowProjection(e.target.checked)} className="sr-only peer" />
                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                            <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">Projection</span>
                                        </label>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-h-0 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartMode === 'breakdown' ? breakdownData : activeData}
                                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                        stackOffset={chartMode === 'breakdown' ? 'none' : undefined}
                                    >
                                        <defs>
                                            <linearGradient id="colorNw" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                                                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                        <XAxis
                                            dataKey="date"
                                            tickFormatter={(str) => new Date(str).toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })}
                                            stroke="#94A3B8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#94A3B8"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(val) => `$${val / 1000}k`}
                                        />
                                        <Tooltip
                                            content={({ active, payload, label }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-card dark:bg-card-dark p-4 border border-border dark:border-border-dark shadow-xl rounded-xl">
                                                            <p className="text-sm font-medium text-text-muted mb-2">{new Date(label).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</p>
                                                            <div className="space-y-1">
                                                                {chartMode === 'breakdown' ? (
                                                                    <>
                                                                        {/* Net Worth at top */}
                                                                        <p className="text-lg font-bold flex justify-between gap-8" style={{ color: '#1e293b' }}>
                                                                            <span>Net Worth</span>
                                                                            <span>{formatCurrency(data['Net Worth'])}</span>
                                                                        </p>
                                                                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
                                                                        {/* All categories */}
                                                                        {payload.filter(p => p.dataKey !== 'Net Worth').map((entry, idx) => (
                                                                            <p key={idx} className="text-sm flex justify-between gap-4" style={{ color: entry.color }}>
                                                                                <span>{entry.name}</span>
                                                                                <span className="font-medium">{formatCurrency(entry.dataKey === 'Liabilities' ? Math.abs(entry.value) : entry.value)}</span>
                                                                            </p>
                                                                        ))}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-lg font-bold text-indigo-600 flex justify-between gap-8">
                                                                            <span>{chartMode === 'net_worth' ? 'Net Worth' : 'Value'}</span>
                                                                            <span>{formatCurrency(data[chartDataKey])}</span>
                                                                        </p>
                                                                        {chartMode === 'net_worth' && (
                                                                            <>
                                                                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-2" />
                                                                                <p className="text-sm text-emerald-600 flex justify-between gap-8">
                                                                                    <span>Assets</span>
                                                                                    <span>+{formatCurrency(data.total_assets)}</span>
                                                                                </p>
                                                                                <p className="text-sm text-red-500 flex justify-between gap-8">
                                                                                    <span>Liabilities</span>
                                                                                    <span>-{formatCurrency(data.total_liabilities)}</span>
                                                                                </p>
                                                                            </>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        {chartMode === 'breakdown' ? (
                                            <>
                                                {/* Zero reference line - black for emphasis */}
                                                <ReferenceLine y={0} stroke="#000000" strokeWidth={2} />
                                                {/* All category areas */}
                                                {displayCategories.map((cat) => (
                                                    <Area
                                                        key={cat}
                                                        name={cat}
                                                        type="monotone"
                                                        dataKey={cat}
                                                        stackId={cat === 'Liabilities' ? 'liabilities' : 'assets'}
                                                        stroke={categoryColorMap[cat] || CHART_COLORS[0]}
                                                        strokeWidth={1}
                                                        fill={categoryColorMap[cat] || CHART_COLORS[0]}
                                                        fillOpacity={0.85}
                                                    />
                                                ))}
                                                {/* Net worth line overlay */}
                                                <Line
                                                    name="Net Worth"
                                                    type="monotone"
                                                    dataKey="Net Worth"
                                                    stroke="#64748b"
                                                    strokeWidth={3}
                                                    strokeDasharray="8 4"
                                                    dot={false}
                                                    activeDot={{ r: 5, fill: '#64748b', stroke: '#fff', strokeWidth: 2 }}
                                                />
                                                <Legend
                                                    verticalAlign="bottom"
                                                    height={48}
                                                    content={({ payload }) => {
                                                        // Sort payload to put Net Worth at the end
                                                        const sortedPayload = payload ? [...payload].sort((a, b) => {
                                                            if (a.dataKey === 'Net Worth') return 1;
                                                            if (b.dataKey === 'Net Worth') return -1;
                                                            return 0;
                                                        }) : [];
                                                        return (
                                                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2 px-3 py-2 bg-white/80 dark:bg-slate-800/90 rounded-lg">
                                                                {sortedPayload.map((entry, idx) => (
                                                                    <div key={idx} className="flex items-center gap-1.5 text-xs">
                                                                        {entry.dataKey === 'Net Worth' ? (
                                                                            // Dashed line for Net Worth - slate gray visible in both modes
                                                                            <svg width="20" height="12">
                                                                                <line x1="0" y1="6" x2="20" y2="6" stroke="#64748b" strokeWidth="3" strokeDasharray="4 2" />
                                                                            </svg>
                                                                        ) : (
                                                                            // Filled rectangle for areas
                                                                            <div
                                                                                className="w-3 h-3 rounded-sm"
                                                                                style={{ backgroundColor: entry.color }}
                                                                            />
                                                                        )}
                                                                        <span className="text-text-primary dark:text-text-primary-dark">{entry.value}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    }}
                                                />
                                            </>
                                        ) : (
                                            <>
                                                <Area
                                                    type="monotone"
                                                    dataKey={chartMode === 'net_worth' ? 'net_worth' : 'value'}
                                                    stroke={chartColor}
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorNw)"
                                                />
                                                {showProjection && chartMode === 'net_worth' && (
                                                    <Area
                                                        type="monotone"
                                                        dataKey="projected_net_worth"
                                                        stroke={chartColor}
                                                        strokeWidth={3}
                                                        strokeDasharray="5 5"
                                                        fillOpacity={0.1}
                                                        fill={chartColor}
                                                        connectNulls={true}
                                                        activeDot={{ r: 6, fill: chartColor, stroke: "#fff", strokeWidth: 2 }}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Asset Allocation Chart */}
                        <div className="bg-card dark:bg-card-dark p-6 rounded-2xl shadow-sm border border-border dark:border-border-dark h-96 flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-text-primary dark:text-text-primary-dark flex items-center gap-2">
                                    <Wallet size={20} className="text-emerald-500" />
                                    Asset Allocation
                                </h3>
                            </div>
                            {
                                allocationData.length > 0 ? (
                                    <div className="h-64 w-full flex flex-col items-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={allocationData}
                                                    cx="50%"
                                                    cy="45%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {allocationData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(val) => formatCurrency(val)}
                                                    contentStyle={CHART_TOOLTIP_STYLE}
                                                />
                                                <Legend
                                                    layout="horizontal"
                                                    align="center"
                                                    verticalAlign="bottom"
                                                    wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                                                    formatter={(value) => {
                                                        const item = allocationData.find(d => d.name === value);
                                                        const total = allocationData.reduce((sum, d) => sum + d.value, 0);
                                                        const pct = total > 0 ? Math.round((item?.value / total) * 100) : 0;
                                                        return `${value} ${pct}%`;
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-48 text-text-muted dark:text-text-muted-dark">
                                        No asset data available
                                    </div>
                                )
                            }
                        </div>
                    </div>



                    <AccountDetailsModal
                        isOpen={isDetailsOpen}
                        onClose={() => { setIsDetailsOpen(false); setSelectedAccount(null); }}
                        account={selectedAccount}
                    />

                    <AddTradeModal
                        isOpen={isInvestmentModalOpen}
                        onClose={() => setIsInvestmentModalOpen(false)}
                    />

                    <ImportNetWorthModal
                        isOpen={isImportModalOpen}
                        onClose={() => setIsImportModalOpen(false)}
                    />
                </>
            ) : activeTab === 'accounts' ? (
                <AccountsHistoryTab onAddAccount={() => setIsAddAccountOpen(true)} />
            ) : (
                <InvestmentsTab />
            )
            }
        </div >
    );
}
