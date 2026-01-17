import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { getMembers, getBucketsTree } from '../services/api';
import { toLocalISOString } from '../utils/dateUtils';
import { Download, RefreshCw, Filter, Calendar as CalendarIcon, PieChart, BarChart2, X, ChevronDown, FileText, FileSpreadsheet } from 'lucide-react';
import { ComposedChart, Bar, BarChart, Line, LineChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, PieChart as RePieChart, Pie, Cell, ReferenceLine } from 'recharts';
import MultiSelectCategoryFilter from '../components/MultiSelectCategoryFilter';
import TransactionTable from '../components/TransactionTable';
import { CHART_COLORS, INCOME_COLORS } from '../constants/chartColors';

export default function Reports() {
    // State
    const [rangeType, setRangeType] = useState("This Month");
    const [customStart, setCustomStart] = useState(toLocalISOString(new Date()));
    const [customEnd, setCustomEnd] = useState(toLocalISOString(new Date()));
    const [spenderFilter, setSpenderFilter] = useState("Combined");
    const [categoryFilters, setCategoryFilters] = useState([]);
    const [accountFilter, setAccountFilter] = useState("All Accounts"); // New: Account Filter
    const [tagFilters, setTagFilters] = useState([]); // New: Tag Filters
    const [drilldownMonth, setDrilldownMonth] = useState(null); // New: Monthly Drill-down
    const [showExportMenu, setShowExportMenu] = useState(false); // Export dropdown
    const exportMenuRef = useRef(null);

    // Close export menu on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Helper to calculate dates
    const getDateRange = (type) => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        let end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (type === "Last Month") {
            start.setMonth(now.getMonth() - 1, 1);
            end = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
        } else if (type === "Last 3 Months") {
            start.setMonth(now.getMonth() - 2);
        } else if (type === "Last 6 Months") {
            start.setMonth(now.getMonth() - 5);
        } else if (type === "This Year") {
            start.setMonth(0);
        } else if (type === "Last Year") {
            start.setFullYear(now.getFullYear() - 1, 0, 1);
            end.setFullYear(now.getFullYear() - 1, 11, 31);
        } else if (type === "Custom") {
            return { start: customStart, end: customEnd };
        }

        return {
            start: toLocalISOString(start),
            end: toLocalISOString(end)
        };
    };

    const { start, end } = getDateRange(rangeType);

    // Fetch User Settings
    const { data: userSettings } = useQuery({
        queryKey: ['userSettings'],
        queryFn: async () => (await api.get('/settings/user')).data
    });

    // Fetch Categories Tree for Filter
    const bucketsQuery = useQuery({
        queryKey: ['buckets'],
        queryFn: getBucketsTree,
        staleTime: 30 * 60 * 1000,
    });

    const categoriesData = bucketsQuery.data;
    const categoriesLoading = bucketsQuery.isLoading;
    const categories = Array.isArray(categoriesData) ? categoriesData : [];

    // Fetch Household Members
    const { data: members = [] } = useQuery({
        queryKey: ['members'],
        queryFn: getMembers
    });

    // Fetch Accounts for Filter
    const { data: accounts = [], isLoading: loadingAccounts } = useQuery({
        queryKey: ['accounts'],
        queryFn: async () => (await api.get('/net-worth/accounts')).data
    });

    // Fetch Tags for Filter
    const { data: availableTags = [], isLoading: loadingTags } = useQuery({
        queryKey: ['tags'],
        queryFn: async () => (await api.get('/settings/tags')).data
    });

    // Fetch Dashboard Data (Summary Cards)
    const { data: dashboardData, isLoading: loadingSummary } = useQuery({
        queryKey: ['reports_summary', start, end, spenderFilter, accountFilter, tagFilters],
        queryFn: async () => {
            const params = {
                start_date: start,
                end_date: end,
                spender: spenderFilter
            };
            if (accountFilter !== "All Accounts") {
                params.account_id = accountFilter;
            }
            if (tagFilters.length > 0) {
                params.tags = tagFilters.join(',');
            }
            const res = await api.get(`/analytics/dashboard`, { params });
            return res.data;
        }
    });

    // Fetch History Data (Chart)
    const { data: historyData = [], isLoading: loadingHistory } = useQuery({
        queryKey: ['reports_history', start, end, spenderFilter, categoryFilters, accountFilter, tagFilters],
        queryFn: async () => {
            const params = {
                start_date: start,
                end_date: end,
                spender: spenderFilter,
            };
            if (categoryFilters.length > 0) {
                params.bucket_ids = categoryFilters.join(',');
                params.exact_bucket_ids = true; // Respect exact selection, don't auto-expand
            }
            if (accountFilter !== "All Accounts") {
                params.account_id = accountFilter;
            }
            if (tagFilters.length > 0) {
                params.tags = tagFilters.join(',');
            }
            const res = await api.get(`/analytics/history`, { params });
            return res.data;
        }
    });

    // Cash Flow Projection
    const { data: forecastResult } = useQuery({
        queryKey: ['cashFlowForecast'],
        queryFn: async () => (await api.get('/analytics/forecast?days=90')).data
    });
    const cashFlowData = forecastResult?.forecast || [];

    // Fetch Transactions for Export (Raw Data)
    const handleExport = async () => {
        try {
            const params = {
                limit: 10000,
                start_date: start,
                end_date: end,
                spender: spenderFilter !== 'Combined' ? spenderFilter : undefined
            };
            if (accountFilter !== "All Accounts") {
                params.account_id = accountFilter;
            }
            if (tagFilters.length > 0) {
                params.tags = tagFilters.join(',');
            }

            const res = await api.get('/transactions/', { params });

            const transactions = res.data.items;
            if (!transactions || transactions.length === 0) {
                alert("No transactions to export for this period.");
                return;
            }

            // Convert to CSV
            const headers = ["Date", "Description", "Amount", "Category", "Spender", "Verified"];
            const csvRows = [headers.join(',')];

            transactions.forEach(t => {
                const row = [
                    t.date,
                    `"${t.description.replace(/"/g, '""')}"`, // Escape quotes
                    t.amount,
                    t.bucket?.name || "Uncategorized",
                    t.spender,
                    t.is_verified ? "Yes" : "No"
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${start}_to_${end}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            console.error("Export failed", err);
            alert("Failed to export transactions");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    if (loadingSummary) return <div className="p-8 text-center text-slate-500">Loading Reports...</div>;

    const { totals, buckets } = dashboardData || { totals: { income: 0, expenses: 0, net_savings: 0 }, buckets: [] };

    // Prepare Pie Chart Data (Expenses by Group)
    const groupData = buckets.reduce((acc, bucket) => {
        const group = bucket.group || "Uncategorized";
        if (group === "Income" || group === "Transfer") return acc;
        if (!acc[group]) acc[group] = 0;
        acc[group] += bucket.spent;
        return acc;
    }, {});

    const pieChartData = Object.keys(groupData).map(key => ({ name: key, value: groupData[key] }));

    // Prepare Income Chart Data - Show child categories of Income group
    const incomeBucketIds = buckets.filter(b => b.group === "Income").map(b => b.id);
    const incomeChartData = buckets
        .filter(b => b.parent_id && incomeBucketIds.includes(b.parent_id))
        .map(b => ({ name: b.name, value: b.income }))
        .filter(b => b.value > 0);

    const handleChartClick = (data) => {
        if (data && data.activePayload && data.activePayload.length > 0) {
            const entry = data.activePayload[0].payload;
            // Entry.date is the raw date string from historyData
            setDrilldownMonth(entry.date);
        }
    };

    const DrilldownModal = () => {
        if (!drilldownMonth) return null;

        const d = new Date(drilldownMonth);
        const monthStart = toLocalISOString(new Date(d.getFullYear(), d.getMonth(), 1));
        const monthEnd = toLocalISOString(new Date(d.getFullYear(), d.getMonth() + 1, 0));

        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Transactions for {new Date(drilldownMonth).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                            </h3>
                            <p className="text-sm text-slate-500">
                                {spenderFilter !== "Combined" ? `Filtered by ${spenderFilter}` : "All Spenders"}
                                {accountFilter !== "All Accounts" ? ` • Account Filtered` : ""}
                            </p>
                        </div>
                        <button
                            onClick={() => setDrilldownMonth(null)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                        >
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-4">
                        <TransactionTable
                            params={{
                                start_date: monthStart,
                                end_date: monthEnd,
                                spender: spenderFilter !== 'Combined' ? spenderFilter : undefined,
                                account_id: accountFilter !== "All Accounts" ? accountFilter : undefined,
                                tags: tagFilters.length > 0 ? tagFilters.join(',') : undefined,
                                bucket_ids: categoryFilters.length > 0 ? categoryFilters.join(',') : undefined
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports & Analysis</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Deep dive into your spending habits and financial health.</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Export Dropdown */}
                    <div className="relative" ref={exportMenuRef}>
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition shadow-sm"
                        >
                            <Download size={18} />
                            <span>Export</span>
                            <ChevronDown size={16} className={`transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>

                        {showExportMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                                <button
                                    onClick={async () => {
                                        try {
                                            // PDF Export with auth
                                            const response = await api.get('/export/report/pdf', {
                                                params: { start_date: start, end_date: end, spender: spenderFilter },
                                                responseType: 'blob'
                                            });
                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `DollarData_Report_${start}_to_${end}.pdf`;
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                            window.URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error('PDF export failed:', err);
                                            alert('Failed to export PDF');
                                        }
                                        setShowExportMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                >
                                    <FileText size={16} className="text-red-500" />
                                    <span>Download PDF</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            // Excel Export with auth
                                            const response = await api.get('/export/report/excel', {
                                                params: { start_date: start, end_date: end, spender: spenderFilter },
                                                responseType: 'blob'
                                            });
                                            const url = window.URL.createObjectURL(new Blob([response.data]));
                                            const link = document.createElement('a');
                                            link.href = url;
                                            link.download = `DollarData_Report_${start}_to_${end}.xlsx`;
                                            document.body.appendChild(link);
                                            link.click();
                                            link.remove();
                                            window.URL.revokeObjectURL(url);
                                        } catch (err) {
                                            console.error('Excel export failed:', err);
                                            alert('Failed to export Excel');
                                        }
                                        setShowExportMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                >
                                    <FileSpreadsheet size={16} className="text-emerald-500" />
                                    <span>Download Excel</span>
                                </button>
                                <div className="border-t border-slate-200 dark:border-slate-700 my-1" />
                                <button
                                    onClick={() => {
                                        handleExport();
                                        setShowExportMenu(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                                >
                                    <Download size={16} className="text-slate-500" />
                                    <span>Download CSV</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Filters:</span>
                </div>

                {/* Date Range */}
                <select
                    value={rangeType}
                    onChange={(e) => setRangeType(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    <option>This Month</option>
                    <option>Last Month</option>
                    <option>Last 3 Months</option>
                    <option>Last 6 Months</option>
                    <option>This Year</option>
                    <option>Last Year</option>
                    <option>Custom</option>
                </select>

                {rangeType === "Custom" && (
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm dark:text-white outline-none"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="px-2 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm dark:text-white outline-none"
                        />
                    </div>
                )}

                {/* Spender Filter */}
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                    <button
                        onClick={() => setSpenderFilter('Combined')}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${spenderFilter === 'Combined' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Combined
                    </button>
                    {members.map(member => (
                        <button
                            key={member.id}
                            onClick={() => setSpenderFilter(member.name)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1.5 ${spenderFilter === member.name ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: member.color }}></span>
                            {member.name}
                        </button>
                    ))}
                </div>

                {/* Category Filter */}
                <div className="w-64">
                    {categoriesLoading ? (
                        <div className="h-10 w-full bg-slate-100 dark:bg-slate-700 animate-pulse rounded-lg"></div>
                    ) : (
                        <MultiSelectCategoryFilter
                            categories={categories}
                            selectedIds={categoryFilters}
                            onChange={setCategoryFilters}
                            placeholder="Filter by categories..."
                        />
                    )}
                </div>

                {/* Tag Filter - Only show if tags exist */}
                {availableTags.length > 0 && (
                    <div className="relative group">
                        <select
                            multiple
                            value={tagFilters}
                            onChange={(e) => {
                                const values = Array.from(e.target.selectedOptions, option => option.value);
                                setTagFilters(values);
                            }}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 min-w-[120px] max-h-24"
                            title="Hold Ctrl/Cmd to select multiple tags"
                        >
                            {availableTags.map(tag => (
                                <option key={tag.id} value={tag.name}>{tag.name}</option>
                            ))}
                        </select>
                        {tagFilters.length > 0 && (
                            <button
                                onClick={() => setTagFilters([])}
                                className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-0.5 hover:bg-red-200 shadow-sm"
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                )}

                {/* Account Filter */}
                {accounts.length > 0 && (
                    <select
                        value={accountFilter}
                        onChange={(e) => setAccountFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="All Accounts">All Accounts</option>
                        {accounts.map(account => (
                            <option key={account.id} value={account.id}>
                                {account.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* Clear Filters */}
                {(spenderFilter !== "Combined" || accountFilter !== "All Accounts" || categoryFilters.length > 0 || tagFilters.length > 0) && (
                    <button
                        onClick={() => {
                            setSpenderFilter("Combined");
                            setAccountFilter("All Accounts");
                            setCategoryFilters([]);
                            setTagFilters([]);
                        }}
                        className="text-xs font-medium text-red-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 transition"
                    >
                        <X size={14} />
                        Clear All
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Income</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-2">{formatCurrency(totals.income)}</p>
                    <p className="text-xs text-slate-400 mt-1">For selected period</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Expenses</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{formatCurrency(totals.expenses)}</p>
                    <p className="text-xs text-slate-400 mt-1">Excludes transfers</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Net Savings</p>
                    <p className={`text-3xl font-bold mt-2 ${totals.net_savings >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {formatCurrency(totals.net_savings)}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        Savings Rate: {totals.income > 0 ? Math.round((totals.net_savings / totals.income) * 100) : 0}%
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Trend Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
                        <BarChart2 size={20} className="text-indigo-500" />
                        Spending History
                    </h2>
                    <p className="text-xs text-slate-500 mb-6">Click on a bar to view monthly transactions</p>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                                data={historyData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                onClick={handleChartClick}
                                style={{ cursor: 'pointer' }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="label" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(val) => [`$${val.toLocaleString()}`, ""]}
                                />
                                <Legend />
                                <Bar dataKey="spent" name="Spent" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Line type="monotone" dataKey="limit" name="Budget Limit" stroke={CHART_COLORS[3]} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution Pie Chart */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <PieChart size={20} className="text-indigo-500" />
                            Distribution
                        </h2>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Expenses by Group</p>
                            <div className="h-48 w-full flex justify-center overflow-hidden">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={35}
                                            outerRadius={55}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(val) => formatCurrency(val)}
                                            contentStyle={{ borderRadius: '8px', border: 'none' }}
                                        />
                                        <Legend
                                            layout="vertical"
                                            align="right"
                                            verticalAlign="middle"
                                            wrapperStyle={{ fontSize: '10px', lineHeight: '16px' }}
                                            formatter={(value, entry) => {
                                                const item = pieChartData.find(d => d.name === value);
                                                const total = pieChartData.reduce((sum, d) => sum + d.value, 0);
                                                const pct = total > 0 ? Math.round((item?.value / total) * 100) : 0;
                                                return `${value} ${pct}%`;
                                            }}
                                        />
                                    </RePieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {incomeChartData.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Income by Type</p>
                                <div className="h-48 w-full flex justify-center overflow-hidden">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RePieChart>
                                            <Pie
                                                data={incomeChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={35}
                                                outerRadius={55}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {incomeChartData.map((entry, index) => (
                                                    <Cell key={`cell-income-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(val) => formatCurrency(val)}
                                                contentStyle={{ borderRadius: '8px', border: 'none' }}
                                            />
                                            <Legend
                                                layout="vertical"
                                                align="right"
                                                verticalAlign="middle"
                                                wrapperStyle={{ fontSize: '10px', lineHeight: '16px' }}
                                                formatter={(value, entry) => {
                                                    const item = incomeChartData.find(d => d.name === value);
                                                    const total = incomeChartData.reduce((sum, d) => sum + d.value, 0);
                                                    const pct = total > 0 ? Math.round((item?.value / total) * 100) : 0;
                                                    return `${value} ${pct}%`;
                                                }}
                                            />
                                        </RePieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DrilldownModal />

            {/* Cash Flow Forecast - 12 Month Budget-Based */}
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-text-primary mb-1">12-Month Cash Flow Forecast</h2>
                            <p className="text-sm text-text-secondary">
                                Projected balance based on budgeted income minus budgeted expenses
                            </p>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-xs text-text-secondary uppercase tracking-wider">Available Cash</p>
                                <p className="text-2xl font-bold text-text-primary">
                                    {formatCurrency(forecastResult?.current_balance || 0)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-text-secondary uppercase tracking-wider">Net Monthly</p>
                                <p className={`text-xl font-bold ${(forecastResult?.net_monthly || 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {(forecastResult?.net_monthly || 0) >= 0 ? '+' : ''}{formatCurrency(forecastResult?.net_monthly || 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Budget Summary */}
                <div className="grid grid-cols-3 gap-4 p-6 border-b border-border bg-surface">
                    <div className="text-center">
                        <p className="text-xs text-text-secondary uppercase tracking-wide">Monthly Income</p>
                        <p className="text-lg font-bold text-emerald-600 mt-1">
                            +{formatCurrency(forecastResult?.monthly_income || 0)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-text-secondary uppercase tracking-wide">Monthly Expenses</p>
                        <p className="text-lg font-bold text-text-primary mt-1">
                            {formatCurrency(forecastResult?.monthly_expenses || 0)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-xs text-text-secondary uppercase tracking-wide">12-Month End</p>
                        <p className="text-lg font-bold text-text-primary mt-1">
                            {formatCurrency(forecastResult?.insights?.projected_end_balance || 0)}
                        </p>
                    </div>
                </div>

                {/* Warning if going negative */}
                {forecastResult?.insights?.months_until_negative !== null && forecastResult?.insights?.months_until_negative !== undefined && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-800/50 flex items-center justify-center">
                            <span className="text-red-500">⚠️</span>
                        </div>
                        <p className="text-sm text-red-700 dark:text-red-300">
                            <strong>Warning:</strong> Balance goes negative in {forecastResult.insights.months_until_negative} months
                        </p>
                    </div>
                )}

                {/* Chart - Bar Chart for Monthly Balances */}
                <div className="p-6">
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="label"
                                    stroke="#94A3B8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#94A3B8"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => {
                                        if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                                        return `$${val}`;
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '12px',
                                        border: 'none',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                        backgroundColor: 'rgba(30, 41, 59, 0.95)'
                                    }}
                                    labelStyle={{ color: '#94A3B8' }}
                                    formatter={(val, name) => {
                                        if (name === 'balance') return [formatCurrency(val), "Balance"];
                                        return [formatCurrency(val), name];
                                    }}
                                />
                                <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
                                <Bar dataKey="balance" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Income & Expense Breakdown */}
                <div className="grid md:grid-cols-2 gap-6 px-6 pb-6">
                    {/* Income Sources */}
                    {forecastResult?.income_breakdown && forecastResult.income_breakdown.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Income Sources</p>
                            <div className="space-y-2">
                                {forecastResult.income_breakdown.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50">
                                        <p className="text-sm text-text-primary">{item.name}</p>
                                        <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(item.monthly_budget)}/mo</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Top Expense Categories */}
                    {forecastResult?.expense_breakdown && forecastResult.expense_breakdown.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Top Expense Categories</p>
                            <div className="space-y-2">
                                {forecastResult.expense_breakdown.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center py-2 border-b border-border/50">
                                        <div>
                                            <p className="text-sm text-text-primary">{item.name}</p>
                                            <p className="text-xs text-text-secondary">{item.group}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(item.monthly_budget)}/mo</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
