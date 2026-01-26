import { View } from 'react-native';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/src/api/api';
import { ActivityIndicator } from 'react-native';
import { toLocalISOString } from '@/src/utils/dateUtils';

export function BudgetPulseWidget() {
    // Current Month range
    const now = new Date();
    const start = toLocalISOString(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = toLocalISOString(new Date(now.getFullYear(), now.getMonth() + 1, 0));

    const { data: dashboard, isLoading } = useQuery({
        queryKey: ['dashboard', 'current'],
        queryFn: () => getDashboardData(start, end)
    });

    const buckets = dashboard?.buckets || [];

    // Logic: Find top 5 active buckets (sorted by spend desc)
    // Filter out Income group
    const activeBuckets = buckets
        .filter((b: any) => b.group !== 'Income' && b.spend > 0)
        .sort((a: any, b: any) => b.spend - a.spend)
        .slice(0, 5);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-AU', {
            style: 'currency',
            currency: 'AUD',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <Card className="mb-6">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold uppercase text-muted-foreground tracking-wider">
                    Budget Pulse
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <View className="h-[150px] items-center justify-center">
                        <ActivityIndicator color="#5D5DFF" />
                    </View>
                ) : (
                    <View className="space-y-4">
                        {activeBuckets.length === 0 ? (
                            <Text className="text-muted-foreground text-center py-4">No spending yet this month.</Text>
                        ) : (
                            activeBuckets.map((bucket: any) => {
                                const percent = Math.min((bucket.spend / (bucket.limit || 1)) * 100, 100);
                                const isOver = bucket.limit > 0 && bucket.spend > bucket.limit;

                                return (
                                    <View key={bucket.id} className="space-y-1">
                                        <View className="flex-row justify-between">
                                            <Text className="font-medium text-sm">{bucket.name}</Text>
                                            <Text className="text-sm text-muted-foreground">
                                                <Text className={isOver ? "text-red-500 font-bold" : "text-foreground"}>
                                                    {formatCurrency(bucket.spend)}
                                                </Text>
                                                {bucket.limit > 0 && <Text> / {formatCurrency(bucket.limit)}</Text>}
                                            </Text>
                                        </View>

                                        {/* Progress Bar Container */}
                                        <View className="h-2 bg-muted rounded-full overflow-hidden">
                                            <View
                                                className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-primary'}`}
                                                style={{ width: `${percent}%` }}
                                            />
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}
            </CardContent>
        </Card>
    );
}
