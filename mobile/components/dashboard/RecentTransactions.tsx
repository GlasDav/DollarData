import React from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Text } from '@/components/ui/text';
import { getTransactions } from '@/src/api/api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ArrowRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export function RecentTransactions() {
    const router = useRouter();
    const { data, isLoading } = useQuery({
        queryKey: ['recentTransactions'],
        queryFn: () => getTransactions({ limit: 5, sort_by: 'date', sort_dir: 'desc' })
    });

    const transactions = data?.items || [];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
        }).format(Math.abs(value));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
        });
    };

    if (isLoading) {
        return (
            <View className="h-40 justify-center items-center">
                <ActivityIndicator size="small" color="#5D5DFF" />
            </View>
        );
    }

    return (
        <View>
            <View className="flex-row justify-between items-center mb-4 px-1">
                <Text variant="h3" className="font-semibold text-lg">Recent Activity</Text>
                <TouchableOpacity onPress={() => router.push('/(drawer)/transactions')}>
                    <Text className="text-primary font-bold text-sm">See All</Text>
                </TouchableOpacity>
            </View>

            <Card>
                <CardContent className="p-0">
                    {transactions.length === 0 ? (
                        <View className="p-8 items-center">
                            <Text className="text-muted-foreground">No recent activity</Text>
                        </View>
                    ) : (
                        <View className="divide-y divide-border">
                            {transactions.map((tx: any) => (
                                <View key={tx.id} className="flex-row justify-between items-center p-4">
                                    <View className="flex-1 mr-4">
                                        <Text className="font-medium text-text-primary truncate" numberOfLines={1}>
                                            {tx.description}
                                        </Text>
                                        <Text className="text-xs text-muted-foreground mt-0.5">
                                            {formatDate(tx.date)}
                                        </Text>
                                    </View>
                                    <View className="items-end">
                                        <Text
                                            className={cn(
                                                "font-bold",
                                                tx.amount > 0 ? "text-emerald-600" : "text-text-primary"
                                            )}
                                        >
                                            {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </CardContent>
            </Card>
        </View>
    );
}
