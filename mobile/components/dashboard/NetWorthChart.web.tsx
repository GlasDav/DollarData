import { View } from 'react-native';
import { Text } from '@/components/ui/text';

// On Web, we'll show a simplified placeholder for now to avoid compilation issues 
// with react-native-gifted-charts which has some web compatibility quirks.
export function NetWorthChart({ data }: { data?: any }) {
    return (
        <View className="items-center justify-center mt-4 h-[180px] w-full bg-muted/10 rounded-xl border border-dashed border-muted">
            <Text className="text-muted-foreground">Chart available on Mobile Device</Text>
            <Text className="text-xs text-muted-foreground/50 mt-1">(Run on iOS/Android Simulator)</Text>
        </View>
    );
}
