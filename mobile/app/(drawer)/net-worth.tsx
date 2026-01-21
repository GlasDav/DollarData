import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NetWorthScreen() {
    return (
        <SafeAreaView className="flex-1 bg-surface p-6">
            <View className="mb-6">
                <Text className="text-2xl font-bold text-text-primary">Net Worth</Text>
            </View>

            <View className="bg-card p-6 rounded-2xl border border-border items-center justify-center flex-1">
                <Text className="text-text-muted">Net Worth tracking coming soon...</Text>
            </View>
        </SafeAreaView>
    );
}
