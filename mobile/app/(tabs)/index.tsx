import { View, Text, TouchableOpacity, RefreshControl, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '../../src/api/api';
import React, { useMemo } from 'react';

export default function Dashboard() {
  const { signOut, user } = useAuth();

  const { data: accounts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  const netWorth = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((sum: number, acc: any) => {
      const balance = parseFloat(acc.balance) || 0;
      return acc.type === 'Liability' || acc.type === 'Credit Card' || acc.type === 'Loan'
        ? sum - balance
        : sum + balance;
    }, 0);
  }, [accounts]);

  // Format currency
  const formattedNetWorth = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(netWorth);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#5D5DFF" />
        }
      >
        <View className="flex-row justify-between items-center mb-8">
          <View>
            <Text className="text-2xl font-bold text-text-primary">Dashboard</Text>
            <Text className="text-text-muted">Welcome back, {user?.name || 'User'}</Text>
          </View>
        </View>

        {/* Net Worth Card */}
        <View className="bg-card p-6 rounded-2xl border border-border shadow-sm mb-6">
          <Text className="text-text-muted uppercase text-xs font-bold mb-2">Net Worth</Text>
          {isLoading ? (
            <View className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          ) : (
            <Text className="text-3xl font-bold text-text-primary">{formattedNetWorth}</Text>
          )}

          <View className="flex-row mt-4 space-x-2">
            <View className="bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              <Text className="text-green-700 dark:text-green-400 text-xs font-bold">+2.4% this month</Text>
            </View>
          </View>
        </View>

        {/* Placeholder for Safe To Spend */}
        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-card p-4 rounded-2xl border border-border">
            <Text className="text-text-muted text-xs font-bold mb-1">Safe to Spend</Text>
            <Text className="text-xl font-bold text-text-primary">$245</Text>
            <Text className="text-text-muted text-xs">/ day</Text>
          </View>
          <View className="flex-1 bg-card p-4 rounded-2xl border border-border">
            <Text className="text-text-muted text-xs font-bold mb-1">Monthly Spend</Text>
            <Text className="text-xl font-bold text-text-primary">$4,250</Text>
          </View>
        </View>

        {/* Recent Transactions Stub */}
        <View>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-text-primary">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-primary font-bold text-sm">See All</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-card p-4 rounded-2xl border border-border items-center py-8">
            <Text className="text-text-muted">No recent activity</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
