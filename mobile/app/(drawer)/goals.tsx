import React from 'react';
import { ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';
import { GoalCard } from '~/components/goals/GoalCard';
import { MOCK_GOALS } from '~/src/types/goals';
import { Text } from '~/components/ui/text';

export default function GoalsScreen() {
    return (
        <>
            <Stack.Screen options={{
                title: 'Goals',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { fontSize: 20, fontWeight: 'bold' }
            }} />

            <ScrollView
                className="flex-1 bg-background px-4 pt-4"
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <Text className="text-muted-foreground mb-4">You are tracking {MOCK_GOALS.length} active goals.</Text>

                {MOCK_GOALS.map(goal => (
                    <GoalCard key={goal.id} goal={goal} />
                ))}
            </ScrollView>
        </>
    );
}
