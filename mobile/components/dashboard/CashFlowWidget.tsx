import { View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useColorScheme } from 'nativewind';
import { Text } from '@/components/ui/text';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getTrendHistory } from '@/src/api/api';
import { ActivityIndicator } from 'react-native';
import { toLocalISOString } from '@/src/utils/dateUtils';

export function CashFlowWidget() {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { width } = useWindowDimensions();

    // Calculate dates for last 6 months
    // Calculate dates for last 6 months
    const now = new Date();
    const end = toLocalISOString(new Date(now.getFullYear(), now.getMonth() + 1, 0)); // End of current month
    const start = toLocalISOString(new Date(now.getFullYear(), now.getMonth() - 5, 1)); // 6 months ago

    const { data: history = [], isLoading, error, isError } = useQuery({
        queryKey: ['trendHistory', '6months'],
        queryFn: () => getTrendHistory({
            start_date: start,
            end_date: end,
            interval: 'month'
        })
    });

    // Transform data for Gifted Charts
    // We want a grouped bar chart: Income (Green) vs Expenses (Red)
    const chartData: any[] = [];

    if (Array.isArray(history)) {
        history.forEach(item => {
            const label = new Date(item.date).toLocaleDateString('en-US', { month: 'short' });

            // Income Bar
            chartData.push({
                value: item.income,
                label: label,
                spacing: 2,
                labelWidth: 30,
                labelTextStyle: { color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 },
                frontColor: '#34D399', // Success/Green
            });

            // Expense Bar
            chartData.push({
                value: item.expenses,
                frontColor: '#EF4444', // Error/Red
            });
        });
    }

    const maxValue = Math.max(...(chartData.map(d => d.value) || [0])) * 1.2;

    return (
        <Card className="mb-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
                    Cash Flow Trends
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <View className="h-[200px] items-center justify-center">
                        <ActivityIndicator color="#5D5DFF" />
                    </View>
                ) : error ? (
                    <View className="h-[200px] items-center justify-center p-4">
                        <Text className="text-red-500 text-center">Error: {(error as Error).message}</Text>
                        <Text className="text-xs text-muted-foreground text-center mt-2">Check console for details</Text>
                    </View>
                ) : (
                    <View className="items-center -ml-4">
                        <BarChart
                            data={chartData}
                            barWidth={12}
                            spacing={24}
                            roundedTop
                            roundedBottom
                            hideRules
                            xAxisThickness={0}
                            yAxisThickness={0}
                            yAxisTextStyle={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 10 }}
                            noOfSections={3}
                            maxValue={maxValue > 0 ? maxValue : 1000}
                            height={180}
                            width={width - 80} // Adjust for padding/margins
                            isAnimated
                        />
                    </View>
                )}
            </CardContent>
        </Card>
    );
}
