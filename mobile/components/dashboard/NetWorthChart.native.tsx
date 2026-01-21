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
            <View className="flex-row justify-between mt-0 gap-2">
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
            className="items-center justify-center mt-0 w-full h-[180px]"
            onLayout={onLayout}
        >


            {availableWidth > 0 ? (() => {
                // 1. Calculate Smart Y-Axis scaling AND Data Transformation
                const rawMaxValue = Math.max(...data.map(d => d.value));
                const rawMinValue = Math.min(...data.map(d => d.value));

                // Determine a nice step value
                const range = rawMaxValue - rawMinValue;
                let stepValue = 5000;
                if (range > 500000) stepValue = 100000;
                else if (range > 100000) stepValue = 25000;
                else if (range > 50000) stepValue = 10000;
                else if (range < 10000) stepValue = 1000;

                // Calculate BASELINE (The value that will essentially be "0" on the chart)
                // We floor the min value to the nearest step
                let baseline = Math.floor(rawMinValue / stepValue) * stepValue;
                // Add breathing room: move baseline down one step if data is too close
                if ((rawMinValue - baseline) < (stepValue * 0.2)) {
                    baseline -= stepValue;
                }

                // TRANSFORM DATA: Subtract baseline from all values
                const transformedData = data.map(d => ({
                    ...d,
                    value: d.value - baseline
                }));

                // Calculate new max value relative to baseline
                // We need the chart to go up to (RawMax - Baseline)
                const relativeMax = rawMaxValue - baseline;
                const noOfSections = Math.ceil(relativeMax / stepValue);
                const finalSections = Math.max(noOfSections, 3);
                const relativeChartMax = finalSections * stepValue;

                // 2. Fix Width/Overflow
                // The 'width' prop in gifted-charts is the width of the *chart area*.
                // The total component width = width + yAxisLabelWidth + margins.
                // We need to subtract the Y-axis width (50) and some padding from availableWidth.
                const yAxisWidth = 50;
                const chartWidth = availableWidth - yAxisWidth - 10;

                return (
                    <LineChart
                        areaChart
                        curved
                        data={transformedData}
                        height={180}
                        width={chartWidth}
                        spacing={(chartWidth - 20) / Math.max(data.length - 1, 1)}
                        initialSpacing={10}
                        endSpacing={10}

                        // Y-Axis Configuration
                        maxValue={relativeChartMax} // This is the relative max (e.g. 25000)
                        noOfSections={finalSections}
                        stepValue={stepValue}

                        color={chartColor}
                        thickness={3}
                        startFillColor={chartColor}
                        endFillColor={chartColor}
                        startOpacity={0.2}
                        endOpacity={0.0}

                        // Styling
                        yAxisLabelWidth={yAxisWidth}
                        yAxisTextStyle={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                        formatYLabel={(label) => {
                            const relativeValue = parseFloat(label);
                            if (isNaN(relativeValue)) return label;

                            // Reconstruction: Add baseline back to get user-facing value
                            const absoluteValue = relativeValue + baseline;

                            if (absoluteValue >= 1000) return `${absoluteValue / 1000}k`;
                            return absoluteValue.toString();
                        }}
                        xAxisLabelTextStyle={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                        rulesType="solid"
                        rulesColor={isDark ? '#333' : '#F0F0F0'}
                        hideDataPoints

                        // Interaction
                        pointerConfig={{
                            pointerStripHeight: 160,
                            pointerStripColor: isDark ? '#E5E7EB' : '#1F2937',
                            pointerStripWidth: 2,
                            pointerColor: isDark ? '#E5E7EB' : '#1F2937',
                            radius: 6,
                            pointerLabelWidth: 100,
                            pointerLabelHeight: 90,
                            activatePointersOnLongPress: true,
                            autoAdjustPointerLabelPosition: true,
                            pointerLabelComponent: (items: any) => {
                                const item = items[0];
                                const absoluteValue = item.value + baseline;
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
                                                {item.label}
                                            </Text>
                                            <Text className="text-sm font-bold text-primary text-center">
                                                ${new Intl.NumberFormat('en-AU').format(absoluteValue)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            },
                        }}
                    />
                );
            })() : null}
        </View>
    );
}
