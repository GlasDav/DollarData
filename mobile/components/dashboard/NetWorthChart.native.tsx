import { View, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react-native';

interface NetWorthChartProps {
    data?: { value: number; label: string }[];
    netWorth?: number;
}

// Mock data if none provided
const MOCK_DATA = [
    { value: 120000, label: 'Jan' },
    { value: 124000, label: 'Feb' },
    { value: 128000, label: 'Mar' },
    { value: 126000, label: 'Apr' },
    { value: 135000, label: 'May' },
    { value: 142000, label: 'Jun' },
];

export function NetWorthChart({ data = MOCK_DATA, netWorth = 0 }: NetWorthChartProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const [availableWidth, setAvailableWidth] = useState(0);

    const chartColor = '#5D5DFF'; // Primary color

    const onLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        if (width > 0) {
            setAvailableWidth(width - 20); // Safety margin
        }
    };

    // --- Portrait View: Summary Widgets ---
    if (!isLandscape) {
        return (
            <View className="flex-row justify-between mt-4 gap-2">
                <View className="flex-1 bg-muted/10 p-4 rounded-xl items-center border border-muted/20">
                    <View className="mb-2 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <Wallet size={20} color={isDark ? '#60A5FA' : '#2563EB'} />
                    </View>
                    <Text className="text-xs text-muted-foreground font-medium uppercase mb-1">Net Worth</Text>
                    <Text className="text-lg font-bold text-foreground">
                        ${new Intl.NumberFormat('en-AU', { notation: 'compact' }).format(netWorth || data[data.length - 1].value)}
                    </Text>
                </View>

                <View className="flex-1 bg-muted/10 p-4 rounded-xl items-center border border-muted/20">
                    <View className="mb-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <TrendingUp size={20} color={isDark ? '#4ADE80' : '#16A34A'} />
                    </View>
                    <Text className="text-xs text-muted-foreground font-medium uppercase mb-1">Income</Text>
                    <Text className="text-lg font-bold text-foreground">$12.5k</Text>
                </View>

                <View className="flex-1 bg-muted/10 p-4 rounded-xl items-center border border-muted/20">
                    <View className="mb-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                        <TrendingDown size={20} color={isDark ? '#F87171' : '#DC2626'} />
                    </View>
                    <Text className="text-xs text-muted-foreground font-medium uppercase mb-1">Expenses</Text>
                    <Text className="text-lg font-bold text-foreground">$4.2k</Text>
                </View>
            </View>
        );
    }

    // --- Landscape View: Detailed Chart ---
    return (
        <View
            className="items-center justify-center mt-4 w-full h-[260px]"
            onLayout={onLayout}
        >
            {/* Hint Text */}
            <Text className="absolute top-0 right-0 text-xs text-muted-foreground mb-2">
                6 Month Trend
            </Text>

            {availableWidth > 0 ? (
                <LineChart
                    areaChart
                    curved
                    data={data}
                    height={220} // Taller chart in landscape
                    width={availableWidth}
                    spacing={availableWidth / (Math.max(data.length - 1, 1))}
                    initialSpacing={20}
                    color={chartColor}
                    thickness={3}
                    startFillColor={chartColor}
                    endFillColor={chartColor}
                    startOpacity={0.2}
                    endOpacity={0.0}
                    noOfSections={4}
                    // Fix Y-Axis formatting
                    yAxisLabelWidth={50}
                    yAxisTextStyle={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                    formatYLabel={(label) => {
                        // Convert label string to number to format safely
                        const value = parseFloat(label);
                        if (isNaN(value)) return label;
                        return new Intl.NumberFormat('en-AU', { notation: 'compact', compactDisplay: 'short' }).format(value);
                    }}
                    xAxisLabelTextStyle={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                    rulesType="solid"
                    rulesColor={isDark ? '#333' : '#F0F0F0'}
                    hideDataPoints
                    pointerConfig={{
                        pointerStripHeight: 200,
                        pointerStripColor: isDark ? '#E5E7EB' : '#1F2937',
                        pointerStripWidth: 2,
                        pointerColor: isDark ? '#E5E7EB' : '#1F2937',
                        radius: 6,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 90,
                        activatePointersOnLongPress: true,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: any) => {
                            return (
                                <View
                                    style={{
                                        height: 90,
                                        width: 100,
                                        justifyContent: 'center',
                                        marginTop: -30,
                                        marginLeft: -40,
                                    }}
                                >
                                    <View className="bg-card border border-border px-3 py-2 rounded-lg shadow-lg">
                                        <Text className="text-xs text-muted-foreground text-center mb-1">
                                            {items[0].label}
                                        </Text>
                                        <Text className="text-sm font-bold text-primary text-center">
                                            ${new Intl.NumberFormat('en-AU').format(items[0].value)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        },
                    }}
                />
            ) : null}
        </View>
    );
}
