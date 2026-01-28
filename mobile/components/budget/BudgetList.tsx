import React from 'react';
import { ScrollView, View } from 'react-native';
import { Card } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { BudgetProgressBar } from './BudgetProgressBar';
import { MOCK_BUDGETS, BudgetBucket } from '~/src/types/budget';

export function BudgetList() {
    // Group by Type
    const grouped = React.useMemo(() => {
        const groups: Record<string, BudgetBucket[]> = {
            'Needs': [],
            'Wants': [],
            'Savings': [],
            'Income': [],
            'Transfer': []
        };
        MOCK_BUDGETS.forEach(b => {
            if (groups[b.type]) groups[b.type].push(b);
            else groups[b.type] = [b]; // Fallback
        });
        return groups;
    }, []);

    const renderGroup = (type: string, buckets: BudgetBucket[]) => {
        if (buckets.length === 0) return null;
        return (
            <View key={type} className="mb-6">
                <Text className="text-lg font-bold mb-3 pl-1 text-foreground">{type}</Text>
                <Card className="p-4 gap-6 bg-card border-border/50">
                    {buckets.map(bucket => (
                        <BudgetProgressBar key={bucket.id} bucket={bucket} />
                    ))}
                </Card>
            </View>
        );
    };

    return (
        <ScrollView
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
        >
            {renderGroup('Needs', grouped['Needs'])}
            {renderGroup('Wants', grouped['Wants'])}
            {renderGroup('Savings', grouped['Savings'])}
        </ScrollView>
    );
}
