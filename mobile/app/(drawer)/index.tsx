import { View, RefreshControl, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { getAccounts } from '../../src/api/api';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { NetWorthChart } from '@/components/dashboard/NetWorthChart';
import { SafeToSpendWidget } from '@/components/dashboard/SafeToSpendWidget';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { CashFlowWidget } from '@/components/dashboard/CashFlowWidget';
import { BudgetPulseWidget } from '@/components/dashboard/BudgetPulseWidget';

export default function Dashboard() {
  const { signOut, user } = useAuth();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const { data: accounts, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['accounts'],
    queryFn: getAccounts,
  });

  // ... (keeping existing netWorth calc)

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
            <Text variant="h2" className="font-bold">Dashboard</Text>
            <Text className="text-muted-foreground mt-1">Welcome back, {user?.name || 'User'}</Text>
          </View>
        </View>

        {/* Net Worth Card */}
        <Card className="mb-6">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
              {isLandscape ? 'Net Worth' : 'Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <View className="h-10 w-40 bg-muted/20 rounded animate-pulse" />
            ) : null}
            <NetWorthChart netWorth={netWorth} />
          </CardContent>
        </Card>

        {/* Cash Flow Widget (New) */}
        <CashFlowWidget />

        {/* Safe To Spend Widget */}
        <View className="mb-6">
          <SafeToSpendWidget />
        </View>

        {/* Budget Pulse Widget (New) */}
        <BudgetPulseWidget />

        {/* Recent Transactions Widget */}
        <RecentTransactions />
      </ScrollView>
    </SafeAreaView>
  );
}
