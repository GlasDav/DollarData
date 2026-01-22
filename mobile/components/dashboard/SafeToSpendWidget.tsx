import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, AlertCircle } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/src/api/api';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function SafeToSpendWidget() {
    // Default to current month
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['safeToSpend', start, end],
        queryFn: () => getDashboardData(start, end)
    });

    const { safeToSpend, isDemoMode } = useMemo(() => {
        if (!dashboardData?.totals) return { safeToSpend: 0, isDemoMode: false };

        const { income, expenses } = dashboardData.totals;

        // Mock Data Trigger
        if (income === 0 && expenses === 0) {
            return {
                safeToSpend: 425.50,
                isDemoMode: true
            };
        }

        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysRemaining = Math.max(1, daysInMonth - today.getDate());

        const netResult = income - expenses;
        const dailySafe = netResult / daysRemaining;

        return {
            safeToSpend: dailySafe,
            isDemoMode: false
        };
    }, [dashboardData]);

    const isPositive = safeToSpend > 0;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0,
        }).format(value);
    };

    if (isLoading) {
        return (
            <Card className="h-48 justify-center items-center bg-card">
                <ActivityIndicator size="small" color="#5D5DFF" />
            </Card>
        );
    }

    return (
        <View className="rounded-xl overflow-hidden shadow-sm h-48">
            <LinearGradient
                colors={isPositive ? ['#4F46E5', '#7C3AED'] : ['#EF4444', '#EA580C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="flex-1 p-5 justify-between"
            >
                {/* Background Icon (Watermark) */}
                <View className="absolute top-0 right-0 p-4 opacity-10">
                    <Target size={100} color="white" />
                </View>

                <View>
                    <View className="flex-row items-center gap-2 mb-2 opacity-90">
                        <Target size={16} color="white" />
                        <Text className="text-white text-xs font-bold uppercase tracking-wider">
                            Daily Safe-to-Spend
                        </Text>
                    </View>

                    <View className="flex-row items-baseline gap-1">
                        <Text className="text-white text-4xl font-bold tracking-tight">
                            {formatCurrency(safeToSpend)}
                        </Text>
                        <Text className="text-white text-lg opacity-80">/ day</Text>
                    </View>

                    {isDemoMode && (
                        <View className="mt-2 flex-row self-start items-center gap-1.5 px-2 py-1 rounded-md bg-white/20">
                            <AlertCircle size={10} color="white" />
                            <Text className="text-white text-[10px] font-medium">
                                Demo Mode
                            </Text>
                        </View>
                    )}
                </View>

                <View>
                    <Text className="text-white text-sm opacity-90 font-light leading-5">
                        {isPositive
                            ? "You're on track! This is your discretionary allowance for the rest of the month."
                            : "Budget exceeded. Try to limit discretionary spending for the next few days."
                        }
                    </Text>
                </View>
            </LinearGradient>
        </View>
    );
}
