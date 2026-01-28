import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { BudgetList } from '~/components/budget/BudgetList';

export default function BudgetScreen() {
    return (
        <>
            <Stack.Screen options={{
                title: 'Budget',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { fontSize: 20, fontWeight: 'bold' }
            }} />
            <View className="flex-1 bg-background">
                <BudgetList />
            </View>
        </>
    );
}
