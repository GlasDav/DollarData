import React, { useState } from 'react';
import { BarChart3, Calendar, Zap, ArrowRightLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { toLocalISOString } from '../utils/dateUtils';

// Import existing page components
import Reports from './Reports';
import FinancialCalendar from './FinancialCalendar';
import Insights from './Insights';
import CashFlowWidget from '../components/widgets/CashFlowWidget';
import DateRangePicker from '../components/ui/DateRangePicker';

/**
 * ReportsHub - Tabbed container for Reports, Calendar, Insights, and Cash Flow
 */
export default function ReportsHub() {
    const [activeTab, setActiveTab] = useState(() => {
        // Allow linking directly to a tab via URL query param ?tab=...
        const params = new URLSearchParams(window.location.search);
        return params.get('tab') || 'reports';
    });

    const tabs = [
        { id: 'reports', label: 'Overview', icon: BarChart3 },
        { id: 'cash-flow', label: 'Cash Flow', icon: ArrowRightLeft },
        { id: 'calendar', label: 'Calendar', icon: Calendar },
        { id: 'insights', label: 'Insights', icon: Zap },
    ];

    const handleTabChange = (id) => {
        setActiveTab(id);
        // Optional: update URL without reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('tab', id);
        window.history.pushState({}, '', newUrl);
    };

    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id)}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                ? 'border-primary text-primary dark:text-primary-light'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[500px]">
                {activeTab === 'reports' && <ReportsContent />}
                {activeTab === 'cash-flow' && <CashFlowContent />}
                {activeTab === 'calendar' && <CalendarContent />}
                {activeTab === 'insights' && <InsightsContent />}
            </div>
        </div>
    );
}

// Content components
function ReportsContent() {
    return <Reports />;
}

function CalendarContent() {
    return <FinancialCalendar />;
}

function InsightsContent() {
    return <Insights />;
}

function CashFlowContent() {
    // State for Cash Flow filters
    const [excludeOneOffs, setExcludeOneOffs] = useState(false);

    // Date Range State
    const [dateRange, setDateRange] = useState(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { start: toLocalISOString(start), end: toLocalISOString(end) };
    });

    const { data: sankeyData, isLoading } = useQuery({
        queryKey: ['sankey', dateRange.start, dateRange.end, 'Combined', excludeOneOffs],
        queryFn: async () => {
            const res = await api.get(`/analytics/sankey`, {
                params: { start_date: dateRange.start, end_date: dateRange.end, spender: 'Combined', exclude_one_offs: excludeOneOffs }
            });
            return res.data;
        }
    });

    const handleDateChange = (start, end) => {
        setDateRange({ start, end });
    };

    if (isLoading) return <div className="p-8 text-center text-slate-500">Loading Cash Flow Diagram...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm gap-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Monthly Cash Flow</h3>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-4">
                    <DateRangePicker
                        startDate={dateRange.start}
                        endDate={dateRange.end}
                        onDateChange={handleDateChange}
                    />

                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={excludeOneOffs}
                            onChange={(e) => setExcludeOneOffs(e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        Exclude One-offs
                    </label>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 min-h-[600px]">
                <CashFlowWidget
                    data={sankeyData}
                    excludeOneOffs={excludeOneOffs}
                    onToggleExcludeOneOffs={setExcludeOneOffs}
                />
            </div>
        </div>
    );
}
