import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { MOCK_GOALS } from '@/src/types/goals';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';

export function GoalsSnapshotWidget() {
    // Take top 3 goals (mock logic: just first 3)
    const topGoals = MOCK_GOALS.slice(0, 3);

    return (
        <Card className="mb-6">
            <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
                    Goals Snapshot
                </CardTitle>
                <TouchableOpacity onPress={() => router.push('/(drawer)/goals')}>
                    <View className="flex-row items-center">
                        <Text className="text-xs text-primary font-medium mr-1">View All</Text>
                        <ChevronRight size={14} color="#5D5DFF" />
                    </View>
                </TouchableOpacity>
            </CardHeader>
            <CardContent>
                <View className="gap-4">
                    {topGoals.map(goal => {
                        const percent = Math.min(100, Math.max(0, (goal.current_amount / goal.target_amount) * 100));
                        return (
                            <View key={goal.id} className="gap-1">
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-sm font-medium">{goal.name}</Text>
                                    <Text className="text-xs text-muted-foreground font-medium">{Math.round(percent)}%</Text>
                                </View>
                                <View className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <View
                                        className="h-full rounded-full"
                                        style={{ width: `${percent}%`, backgroundColor: goal.color || '#5D5DFF' }}
                                    />
                                </View>
                            </View>
                        );
                    })}
                </View>
            </CardContent>
        </Card>
    );
}
