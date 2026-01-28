import React from 'react';
import { View } from 'react-native';
import { Text } from '~/components/ui/text';
import { cn } from '~/lib/utils';
import { BudgetBucket } from '~/src/types/budget';

interface BudgetProgressBarProps {
    bucket: BudgetBucket;
}

export function BudgetProgressBar({ bucket }: BudgetProgressBarProps) {
    const { limit, spent } = bucket;
    const percentage = Math.min(100, Math.max(0, (spent / limit) * 100));

    // Determine color based on percentage
    // < 80% = Success/Primary
    // 80-100% = Warning
    // > 100% = Destructive
    let progressColor = "bg-primary";
    if (spent > limit) {
        progressColor = "bg-destructive";
    } else if (percentage > 85) {
        progressColor = "bg-amber-500";
    } else {
        progressColor = "bg-emerald-500";
    }

    const remaining = limit - spent;
    const isOver = remaining < 0;

    return (
        <View className="w-full gap-2">
            <View className="flex-row justify-between items-end">
                <Text className="text-sm font-medium text-foreground">{bucket.name}</Text>
                <View className="items-end">
                    <Text className="text-sm font-semibold">
                        {spent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        <Text className="text-muted-foreground font-normal"> / {limit.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</Text>
                    </Text>
                </View>
            </View>

            <View className="h-2.5 w-full bg-secondary rounded-full overflow-hidden">
                <View
                    className={cn("h-full rounded-full transition-all", progressColor)}
                    style={{ width: `${percentage}%` }}
                />
            </View>

            <View className="flex-row justify-between">
                <Text className="text-xs text-muted-foreground">{Math.round(percentage)}% Used</Text>
                <Text className={cn(
                    "text-xs font-medium",
                    isOver ? "text-destructive" : "text-emerald-500"
                )}>
                    {isOver
                        ? `${Math.abs(remaining).toLocaleString('en-US', { style: 'currency', currency: 'USD' })} over`
                        : `${remaining.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} left`
                    }
                </Text>
            </View>
        </View>
    );
}
