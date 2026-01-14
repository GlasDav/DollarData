import React, { useMemo } from 'react';
import { toLocalISOString } from '../../utils/dateUtils';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import {
    TrendingUp, TrendingDown, Sparkles, AlertTriangle, Trophy,
    PiggyBank, ArrowRight
} from 'lucide-react';

/**
 * InsightsCardsWidget - "Zen Insights" Sidebar Version
 * Displays concise, vertical list of insights.
 */
export default function InsightsCardsWidget({ currentStart, currentEnd, spenderMode, formatCurrency }) {
    // Calculate previous month dates
    const previousDates = useMemo(() => {
        const start = new Date(currentStart);
        const end = new Date(currentEnd);
        start.setMonth(start.getMonth() - 1);
        end.setMonth(end.getMonth() - 1);
        return {
            start: toLocalISOString(start),
            end: toLocalISOString(end)
        };
    }, [currentStart, currentEnd]);

    // Fetch current and previous period data
    const { data: currentData } = useQuery({
        queryKey: ['insightsCurrent', currentStart, currentEnd, spenderMode],
        enabled: false, // For now, we are relying on mocks or simpler triggers for the demo
        queryFn: async () => (await api.get('/analytics/dashboard', {
            params: { start_date: currentStart, end_date: currentEnd, spender: spenderMode }
        })).data
    });

    const { data: previousData } = useQuery({
        queryKey: ['insightsPrevious', previousDates.start, previousDates.end, spenderMode],
        enabled: false,
        queryFn: async () => (await api.get('/analytics/dashboard', {
            params: { start_date: previousDates.start, end_date: previousDates.end, spender: spenderMode }
        })).data
    });

    // --- MOCK INSIGHTS LOGIC ---
    // Since Basiq isn't fully live, we use realistic "Zen" placeholders to fill the UI
    const insights = useMemo(() => {
        // If we had real logic, we'd process `currentData` here.
        // For the redesign, return fixed "Zen" insights.
        return [
            {
                id: '1',
                title: 'Capital Appreciation',
                message: 'Your portfolio grew by 2.4% this month, outperforming the S&P 500.',
                icon: TrendingUp,
                color: 'emerald'
            },
            {
                id: '2',
                title: 'Operating Margin',
                message: 'You are saving 18% of your income. Try to hit 20% to reach your goal faster.',
                icon: PiggyBank,
                color: 'blue'
            },
            {
                id: '3',
                title: 'Top Outflow Alert',
                message: 'Dining Out is 15% higher than your average. Consider cooking at home this week.',
                icon: AlertTriangle,
                color: 'amber'
            }
        ];
    }, [currentData, previousData]);

    return (
        <div className="bg-card dark:bg-card-dark p-6 rounded-card shadow-sm border border-border dark:border-border-dark">
            <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-primary" size={20} />
                <h2 className="text-lg font-bold text-text-primary dark:text-text-primary-dark">Smart Insights</h2>
            </div>

            <div className="space-y-4">
                {insights.map((insight) => {
                    const Icon = insight.icon;
                    return (
                        <div key={insight.id} className="group flex items-start gap-3 p-3 rounded-xl hover:bg-surface dark:hover:bg-surface-dark transition-colors cursor-pointer">
                            <div className={`mt-0.5 p-2 rounded-lg bg-${insight.color}-50 dark:bg-${insight.color}-900/20 text-${insight.color}-600 dark:text-${insight.color}-400`}>
                                <Icon size={16} />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-text-primary dark:text-text-primary-dark group-hover:text-primary transition-colors">
                                    {insight.title}
                                </h3>
                                <p className="text-xs text-text-muted dark:text-text-muted-dark mt-1 leading-relaxed">
                                    {insight.message}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button className="w-full mt-4 text-xs font-semibold text-primary dark:text-primary-light hover:text-primary-hover dark:hover:text-primary py-2 flex items-center justify-center gap-1 group">
                View All Insights
                <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </button>
        </div>
    );
}
