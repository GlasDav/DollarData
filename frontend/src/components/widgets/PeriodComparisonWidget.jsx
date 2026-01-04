import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toLocalISOString } from '../../utils/dateUtils';
import api from '../../services/api';
import { TrendingUp, TrendingDown, ArrowRightLeft, ChevronDown } from 'lucide-react';

/**
 * PeriodComparisonWidget - Compare spending between two time periods
 */
export default function PeriodComparisonWidget({
    currentStart,
    currentEnd,
    spenderMode,
    formatCurrency,
    currentData
}) {
    const [comparisonType, setComparisonType] = useState('lastMonth');
    const [isExpanded, setIsExpanded] = useState(true);

    // Calculate comparison period dates
    const getComparisonDates = useMemo(() => {
        const startDate = new Date(currentStart);
        const endDate = new Date(currentEnd);
        const periodLength = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

        if (comparisonType === 'lastMonth') {
            // Previous month
            const compStart = new Date(startDate);
            compStart.setMonth(compStart.getMonth() - 1);
            const compEnd = new Date(endDate);
            compEnd.setMonth(compEnd.getMonth() - 1);
            return {
                start: toLocalISOString(compStart),
                end: toLocalISOString(compEnd),
                label: 'Last Month'
            };
        } else if (comparisonType === 'lastYear') {
            // Same period last year
            const compStart = new Date(startDate);
            compStart.setFullYear(compStart.getFullYear() - 1);
            const compEnd = new Date(endDate);
            compEnd.setFullYear(compEnd.getFullYear() - 1);
            return {
                start: toLocalISOString(compStart),
                end: toLocalISOString(compEnd),
                label: 'Same Period Last Year'
            };
        } else {
            // Previous period (same length)
            const compEnd = new Date(startDate);
            compEnd.setDate(compEnd.getDate() - 1);
            const compStart = new Date(compEnd);
            compStart.setDate(compStart.getDate() - periodLength + 1);
            return {
                start: toLocalISOString(compStart),
                end: toLocalISOString(compEnd),
                label: 'Previous Period'
            };
        }
    }, [currentStart, currentEnd, comparisonType]);

    // Fetch comparison period data
    const { data: comparisonData, isLoading } = useQuery({
        queryKey: ['dashboardComparison', getComparisonDates.start, getComparisonDates.end, spenderMode],
        queryFn: async () => {
            const res = await api.get('/analytics/dashboard', {
                params: {
                    start_date: getComparisonDates.start,
                    end_date: getComparisonDates.end,
                    spender: spenderMode
                }
            });
            return res.data;
        }
    });

    // Fetch current period data


    const calculateChange = (current, previous) => {
        if (!previous || previous === 0) return { amount: current, percent: 0 };
        const change = current - previous;
        const percent = (change / Math.abs(previous)) * 100;
        return { amount: change, percent };
    };

    if (!currentData || isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-700 rounded-lg"></div>
            </div>
        );
    }

    const current = currentData.totals || {};
    const comparison = comparisonData?.totals || {};

    const incomeChange = calculateChange(current.income || 0, comparison.income || 0);
    const expenseChange = calculateChange(current.expenses || 0, comparison.expenses || 0);
    const savingsChange = calculateChange(current.net_savings || 0, comparison.net_savings || 0);

    const MetricRow = ({ label, currentValue, previousValue, change, invertColors = false }) => {
        const isPositive = change.amount >= 0;
        const colorClass = invertColors
            ? (isPositive ? 'text-red-500' : 'text-emerald-500')
            : (isPositive ? 'text-emerald-500' : 'text-red-500');

        return (
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{formatCurrency(currentValue)}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(previousValue)}</p>
                    </div>
                    <div className={`flex items-center gap-1 min-w-[80px] justify-end ${colorClass}`}>
                        {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        <span className="text-sm font-medium">
                            {change.percent >= 0 ? '+' : ''}{change.percent.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white hover:text-indigo-600 transition-colors"
                >
                    <ArrowRightLeft size={20} className="text-indigo-500" />
                    Compare Periods
                    <ChevronDown size={16} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                <select
                    value={comparisonType}
                    onChange={(e) => setComparisonType(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white text-sm rounded-lg p-2 outline-none cursor-pointer"
                >
                    <option value="lastMonth">vs Last Month</option>
                    <option value="lastYear">vs Same Period Last Year</option>
                    <option value="previous">vs Previous Period</option>
                </select>
            </div>

            {isExpanded && (
                <>
                    {/* Period Labels */}
                    <div className="flex justify-between text-xs text-slate-400 mb-2 px-2">
                        <span>Current: {currentStart} to {currentEnd}</span>
                        <span>{getComparisonDates.label}: {getComparisonDates.start} to {getComparisonDates.end}</span>
                    </div>

                    {/* Metrics */}
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                        <MetricRow
                            label="Income"
                            currentValue={current.income || 0}
                            previousValue={comparison.income || 0}
                            change={incomeChange}
                        />
                        <MetricRow
                            label="Expenses"
                            currentValue={current.expenses || 0}
                            previousValue={comparison.expenses || 0}
                            change={expenseChange}
                            invertColors={true}
                        />
                        <MetricRow
                            label="Net Savings"
                            currentValue={current.net_savings || 0}
                            previousValue={comparison.net_savings || 0}
                            change={savingsChange}
                        />
                    </div>
                </>
            )}
        </div>
    );
}
