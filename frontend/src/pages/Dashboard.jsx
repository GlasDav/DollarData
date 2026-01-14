import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api, { getMembers, getUpcomingBills } from '../services/api';
import { LayoutDashboard } from 'lucide-react';

// Widget imports
import { toLocalISOString } from '../utils/dateUtils';
import SummaryCardsWidget from '../components/widgets/SummaryCardsWidget';
import UpcomingBillsWidget from '../components/widgets/UpcomingBillsWidget';
import BudgetSummaryWidget from '../components/widgets/BudgetSummaryWidget';
import GoalsWidget from '../components/widgets/GoalsWidget';
import NetWorthWidget from '../components/widgets/NetWorthWidget';
import RecentTransactionsWidget from '../components/widgets/RecentTransactionsWidget';
import PeriodComparisonWidget from '../components/widgets/PeriodComparisonWidget';
import InsightsCardsWidget from '../components/widgets/InsightsCardsWidget';
import AchievementsWidget from '../components/widgets/AchievementsWidget';
import SafeToSpendWidget from '../components/widgets/SafeToSpendWidget';
import CashFlowTrendWidget from '../components/widgets/CashFlowTrendWidget';

import OnboardingWizard from '../components/OnboardingWizard';
import { AnimatedPage } from '../components/animations/AnimatedComponents';

export default function Dashboard() {
    // Date Range State
    const [rangeType, setRangeType] = useState("This Month");
    const [spenderMode, setSpenderMode] = useState("Combined");
    const [customStart, setCustomStart] = useState(toLocalISOString(new Date()));
    const [customEnd, setCustomEnd] = useState(toLocalISOString(new Date()));
    const [trendOption, setTrendOption] = useState("Total");
    const [selectedBuckets, setSelectedBuckets] = useState([]);
    const [ignoreOneOff, setIgnoreOneOff] = useState(false);

    // Helper to calculate dates
    const getDateRange = (type) => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (type === "Last Month") {
            start.setMonth(now.getMonth() - 1);
            end.setMonth(now.getMonth(), 0); // Last day of previous month
        } else if (type === "Last 3 Months") {
            start.setMonth(now.getMonth() - 2);
        } else if (type === "Last 6 Months") {
            start.setMonth(now.getMonth() - 5);
        } else if (type === "Year to Date") {
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

    // --- Data Queries ---
    const dayDiff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    const interval = dayDiff <= 35 ? 'day' : 'month';

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['dashboard', start, end, spenderMode],
        queryFn: async () => {
            const res = await api.get(`/analytics/dashboard`, {
                params: { start_date: start, end_date: end, spender: spenderMode }
            });
            return res.data;
        }
    });

    const { data: membersRaw = [] } = useQuery({
        queryKey: ['members'],
        queryFn: getMembers
    });
    const members = Array.isArray(membersRaw) ? membersRaw : [];

    // Helper to find "One Off" bucket
    const oneOffBucket = dashboardData?.buckets?.find(b => b.name === "One Off" || b.name === "One-Off");
    const excludeBucketIds = ignoreOneOff && oneOffBucket ? oneOffBucket.id : undefined;

    const { data: netWorthHistoryRaw = [] } = useQuery({
        queryKey: ['netWorthHistory'],
        queryFn: async () => (await api.get('/net-worth/history')).data
    });
    const netWorthHistory = Array.isArray(netWorthHistoryRaw) ? netWorthHistoryRaw : [];

    const { data: trendHistoryRaw = [] } = useQuery({
        queryKey: ['trendHistory', start, end, trendOption, selectedBuckets, interval, spenderMode, excludeBucketIds],
        queryFn: async () => {
            const params = { start_date: start, end_date: end, interval, spender: spenderMode };

            if (excludeBucketIds) {
                params.exclude_bucket_ids = excludeBucketIds;
            }

            if (trendOption === "Non-Discretionary") params.group = "Non-Discretionary";
            else if (trendOption === "Discretionary") params.group = "Discretionary";
            else if (trendOption === "bucket" && selectedBuckets.length > 0) {
                params.bucket_ids = selectedBuckets.join(',');
            }
            // Use existing history endpoint for now, or new one if needed
            return (await api.get('/analytics/history', { params })).data;
        }
    });
    const trendHistory = Array.isArray(trendHistoryRaw) ? trendHistoryRaw : [];

    const { data: upcomingBillsRaw = [] } = useQuery({
        queryKey: ['upcomingBills'],
        queryFn: () => getUpcomingBills(7),
        staleTime: 300000
    });
    const upcomingBills = Array.isArray(upcomingBillsRaw) ? upcomingBillsRaw : [];

    // --- Loading / Error States ---
    if (isLoading) return <div className="p-8 text-center text-text-muted dark:text-text-muted-dark">Loading Dashboard...</div>;
    if (!dashboardData) return <div className="p-8 text-center text-red-500">Error loading data. Please check connection.</div>;

    const { buckets: rawBuckets, totals } = dashboardData;
    const buckets = Array.isArray(rawBuckets) ? rawBuckets : [];
    const netWorth = netWorthHistory.length > 0 ? netWorthHistory[netWorthHistory.length - 1].net_worth : 0;

    // Formatting helper
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    return (
        <AnimatedPage className="max-w-[1600px] mx-auto p-6 lg:p-10 space-y-8">

            {/* 1. Header & Controls */}
            <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-border dark:border-border-dark pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">Dashboard</h1>
                    <p className="text-text-muted dark:text-text-muted-dark text-sm">Welcome back, here's your financial overview.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Spender Mode Toggle (Pill Style) */}
                    <div className="bg-surface dark:bg-surface-dark p-1 rounded-full flex items-center">
                        <button
                            onClick={() => setSpenderMode('Combined')}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${spenderMode === 'Combined'
                                ? 'bg-card dark:bg-card-dark shadow-sm text-primary dark:text-primary-light'
                                : 'text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark'
                                }`}
                        >
                            Household
                        </button>
                        {members.map((member) => (
                            <button
                                key={member.id}
                                onClick={() => setSpenderMode(member.name)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-2 ${spenderMode === member.name
                                    ? 'bg-card dark:bg-card-dark shadow-sm text-primary dark:text-primary-light'
                                    : 'text-text-muted dark:text-text-muted-dark hover:text-text-primary dark:hover:text-text-primary-dark'
                                    }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: member.color }}></span>
                                {member.name}
                            </button>
                        ))}
                    </div>

                    {/* Date Details */}
                    <select
                        value={rangeType}
                        onChange={(e) => setRangeType(e.target.value)}
                        className="bg-card dark:bg-card-dark border border-border dark:border-border-dark text-text-primary dark:text-text-primary-dark text-sm rounded-lg focus:ring-primary focus:border-primary block px-3 py-2 outline-none cursor-pointer hover:bg-surface dark:hover:bg-surface-dark transition"
                    >
                        <option>This Month</option>
                        <option>Last Month</option>
                        <option>Last 3 Months</option>
                        <option>Last 6 Months</option>
                        <option>Year to Date</option>
                        <option>Last Year</option>
                        <option>Custom</option>
                    </select>
                </div>
            </header>

            {/* 2. Main Zen Layout (2-Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Trends & Analysis (Main) - Spans 8 cols */}
                <div className="lg:col-span-8 flex flex-col gap-8">

                    {/* Key Metrics Row */}
                    <SummaryCardsWidget totals={totals} netWorth={netWorth} formatCurrency={formatCurrency} />

                    {/* Primary Chart: Cash Flow Trend */}
                    <CashFlowTrendWidget
                        trendHistory={trendHistory}
                        isLoading={isLoading}
                        formatCurrency={formatCurrency}
                        start={start}
                        end={end}
                        interval={interval}
                        ignoreOneOff={ignoreOneOff}
                        onToggleOneOff={() => setIgnoreOneOff(!ignoreOneOff)}
                    />

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BudgetSummaryWidget buckets={buckets} score={dashboardData.score} formatCurrency={formatCurrency} />
                        <PeriodComparisonWidget currentStart={start} currentEnd={end} spenderMode={spenderMode} formatCurrency={formatCurrency} currentData={dashboardData} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AchievementsWidget dashboardData={dashboardData} netWorth={netWorth} goals={[]} />
                        <NetWorthWidget history={netWorthHistory} formatCurrency={formatCurrency} />
                    </div>

                </div>

                {/* RIGHT COLUMN: Action & Insights (Sidebar) - Spans 4 cols */}
                <div className="lg:col-span-4 flex flex-col gap-6">

                    {/* North Star Widget */}
                    <SafeToSpendWidget
                        start={start}
                        end={end}
                        spenderMode={spenderMode}
                        formatCurrency={formatCurrency}
                    />

                    {/* Insights List */}
                    <InsightsCardsWidget
                        currentStart={start}
                        currentEnd={end}
                        spenderMode={spenderMode}
                        formatCurrency={formatCurrency}
                    />

                    {/* Upcoming Bills List */}
                    <UpcomingBillsWidget bills={upcomingBills || []} formatCurrency={formatCurrency} />

                    {/* Recent Activity List */}
                    <RecentTransactionsWidget formatCurrency={formatCurrency} />

                    {/* Mini Goals (Optional - keep simpler for now) */}
                    {/* <GoalsWidget formatCurrency={formatCurrency} /> */}

                </div>

            </div>

            <OnboardingWizard />
        </AnimatedPage>
    );
}
