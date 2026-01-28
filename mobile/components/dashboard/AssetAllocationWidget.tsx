import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useColorScheme } from 'nativewind';

// Mock Data for Assets
const DATA = [
    { value: 45, color: '#10b981', text: '45%', label: 'Stocks' },
    { value: 25, color: '#3b82f6', text: '25%', label: 'Property' },
    { value: 20, color: '#8b5cf6', text: '20%', label: 'Super' },
    { value: 10, color: '#f59e0b', text: '10%', label: 'Cash' },
];

export function AssetAllocationWidget() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { width } = useWindowDimensions();

    const renderLegend = () => {
        return (
            <View className="flex-row flex-wrap justify-center gap-4 mt-6">
                {DATA.map((item, index) => (
                    <View key={index} className="flex-row items-center">
                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 6 }} />
                        <Text className="text-xs text-muted-foreground font-medium">{item.label}</Text>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <Card className="mb-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
                    Asset Allocation
                </CardTitle>
            </CardHeader>
            <CardContent>
                <View className="items-center justify-center py-2">
                    <PieChart
                        data={DATA}
                        donut
                        showText
                        textColor={isDark ? "white" : "black"}
                        radius={80}
                        innerRadius={55}
                        textSize={12}
                        showTextBackground={false}
                        centerLabelComponent={() => {
                            return (
                                <View className="items-center justify-center">
                                    <Text className="text-xs text-muted-foreground font-medium">Total</Text>
                                    <Text className="text-lg font-bold text-foreground">$1.4M</Text>
                                </View>
                            );
                        }}
                    />
                    {renderLegend()}
                </View>
            </CardContent>
        </Card>
    );
}
