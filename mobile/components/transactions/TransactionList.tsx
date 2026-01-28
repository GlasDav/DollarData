import React from 'react';
import { SectionList, View, TouchableOpacity } from 'react-native';
import { Text } from '~/components/ui/text';
import { Card } from '~/components/ui/card';
import { Transaction, MOCK_TRANSACTIONS } from '~/src/types/transaction';
import { cn } from '~/lib/utils';
import { parseISO, format, isToday, isYesterday } from 'date-fns';
import { MaterialIcons } from '@expo/vector-icons';

interface TransactionListProps {
    onTransactionPress?: (transaction: Transaction) => void;
}

export function TransactionList({ onTransactionPress }: TransactionListProps) {
    // Group transactions by date
    const sections = React.useMemo(() => {
        const groups: Record<string, Transaction[]> = {};

        MOCK_TRANSACTIONS.forEach(tx => {
            if (!groups[tx.date]) {
                groups[tx.date] = [];
            }
            groups[tx.date].push(tx);
        });

        return Object.keys(groups)
            .sort((a, b) => b.localeCompare(a)) // Sort by date descending
            .map(date => ({
                title: date,
                data: groups[date],
            }));
    }, []);

    const formatSectionHeader = (dateStr: string) => {
        const date = parseISO(dateStr);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMM d, yyyy');
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const isIncome = item.type === 'income';

        return (
            <TouchableOpacity onPress={() => onTransactionPress?.(item)}>
                <Card className="mb-3 p-4 flex-row items-center justify-between bg-card border-border/50">
                    <View className="flex-row items-center gap-4 flex-1">
                        {/* Category Icon Placeholder */}
                        <View
                            className="w-10 h-10 rounded-full items-center justify-center opacity-90"
                            style={{ backgroundColor: item.category.color }}
                        >
                            {/* using a generic icon for now if name not mapped */}
                            <MaterialIcons name="shopping-bag" size={20} color="white" />
                        </View>

                        <View className="flex-1">
                            <Text className="font-semibold text-foreground text-base" numberOfLines={1}>
                                {item.merchant?.name || item.description}
                            </Text>
                            <Text className="text-muted-foreground text-sm" numberOfLines={1}>
                                {item.category.name} • {item.account_name}
                            </Text>
                        </View>
                    </View>

                    <View className="items-end">
                        <Text className={cn(
                            "font-bold text-base",
                            isIncome ? "text-emerald-500" : "text-foreground"
                        )}>
                            {isIncome ? '+' : ''}{item.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </Text>
                        {item.status === 'pending' && (
                            <Text className="text-xs text-amber-500 italic">Pending</Text>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={({ section: { title } }) => (
                <View className="py-2 bg-background mb-2">
                    <Text className="text-muted-foreground font-medium text-sm uppercase tracking-wider">
                        {formatSectionHeader(title)}
                    </Text>
                </View>
            )}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-20">
                    <Text className="text-muted-foreground text-center">No transactions found</Text>
                </View>
            }
        />
    );
}
