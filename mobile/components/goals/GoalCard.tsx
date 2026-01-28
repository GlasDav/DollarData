import React from 'react';
import { View } from 'react-native';
import { Card } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { Goal } from '~/src/types/goals';
import { cn } from '~/lib/utils';
import { MaterialIcons } from '@expo/vector-icons';

interface GoalCardProps {
    goal: Goal;
}

export function GoalCard({ goal }: GoalCardProps) {
    const percentage = Math.min(100, Math.max(0, (goal.current_amount / goal.target_amount) * 100));

    return (
        <Card className="mb-4 bg-card border-border/50 overflow-hidden">
            <View className="p-4">
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full items-center justify-center bg-secondary">
                            {/* Placeholder Icon logic */}
                            <MaterialIcons name="flag" size={20} color={goal.color || '#64748b'} />
                        </View>
                        <View>
                            <Text className="text-base font-semibold text-foreground">{goal.name}</Text>
                            {goal.target_date && (
                                <Text className="text-xs text-muted-foreground">Target: {goal.target_date}</Text>
                            )}
                        </View>
                    </View>
                    <Text className="text-lg font-bold text-primary">
                        {Math.round(percentage)}%
                    </Text>
                </View>

                <View className="h-3 w-full bg-secondary rounded-full overflow-hidden mb-2">
                    <View
                        className="h-full rounded-full"
                        style={{ width: `${percentage}%`, backgroundColor: goal.color || '#5D5DFF' }}
                    />
                </View>

                <View className="flex-row justify-between items-center">
                    <Text className="text-sm font-medium text-foreground">
                        {goal.current_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                        of {goal.target_amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </Text>
                </View>
            </View>
        </Card>
    );
}
