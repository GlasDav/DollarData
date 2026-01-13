import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Target, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';

/**
 * SafeToSpendWidget - The "North Star" widget for the dashboard.
 * 
 * Logic: (Income - Fixed Expenses - Savings Goal) / Days Remaining
 * 
 * Includes "Demo Mode" fallback if no data is available (since Basiq is not live).
 */
export default function SafeToSpendWidget({ start, end, spenderMode = 'Combined', formatCurrency }) {

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['safeToSpend', start, end, spenderMode],
        queryFn: async () => {
            const res = await api.get(`/analytics/dashboard`, {
                params: { start_date: start, end_date: end, spender: spenderMode }
            });
            return res.data;
        }
    });

    // --- Calculation Logic ---
    const { safeToSpend, isDemoMode, calculations } = useMemo(() => {
        if (!dashboardData?.totals) return { safeToSpend: 0, isDemoMode: false, calculations: {} };

        const { income, expenses } = dashboardData.totals;

        // --- MOCK DATA TRIGGER ---
        // If we have effectively zero data, trigger demo mode for the design review
        if (income === 0 && expenses === 0) {
            return {
                safeToSpend: 425.50,
                isDemoMode: true,
                calculations: {
                    dailyIncome: 1200,
                    dailyFixed: 650,
                    dailyGoal: 124.50
                }
            };
        }

        // Real Logic (Simplistic for now - effectively just "Available" from budget)
        // In a real app, we'd distinguish "Fixed" vs "Variable" more strictly
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const daysRemaining = Math.max(1, daysInMonth - new Date().getDate());

        const netResult = income - expenses;
        const dailySafe = netResult / daysRemaining;

        return {
            safeToSpend: dailySafe,
            isDemoMode: false,
            calculations: {
                net: netResult,
                days: daysRemaining
            }
        };

    }, [dashboardData]);

    const isPositive = safeToSpend > 0;

    if (isLoading) return <div className="h-48 bg-card dark:bg-card-dark rounded-3xl animate-pulse"></div>;

    return (
        <div className={`relative overflow-hidden rounded-card p-6 ${isPositive ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white' : 'bg-gradient-to-br from-red-500 to-orange-600 text-white'} shadow-xl`}>

            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Target size={120} />
            </div>

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <Target size={18} />
                        <span className="text-sm font-medium uppercase tracking-wider">Daily Safe-to-Spend</span>
                    </div>

                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight">
                            {formatCurrency(safeToSpend)}
                        </span>
                        <span className="text-lg opacity-80">/ day</span>
                    </div>

                    {isDemoMode && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/20 text-xs font-medium backdrop-blur-sm">
                            <AlertCircle size={12} />
                            <span>Demo Mode (Connect Bank to Enable)</span>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <p className="text-sm opacity-90 mb-4 font-light">
                        {isPositive
                            ? "You're on track! This is your discretionary allowance for the rest of the month."
                            : "Budget exceeded. Try to limit discretionary spending for the next few days."
                        }
                    </p>

                    <button className="flex items-center justify-center gap-2 w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-medium py-2.5 rounded-xl transition-all active:scale-95">
                        <TrendingUp size={16} />
                        Optimize Cash Flow
                    </button>

                </div>
            </div>
        </div>
    );
}
