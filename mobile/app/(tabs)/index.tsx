import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';

export default function Dashboard() {
  const { signOut, user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-surface p-6">
      <View className="flex-row justify-between items-center mb-8">
        <View>
          <Text className="text-2xl font-bold text-text-primary">Dashboard</Text>
          <Text className="text-text-muted">Welcome back, {user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={() => signOut()} className="bg-card p-2 rounded-lg">
          <Text className="text-primary font-bold">Logout</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-card p-6 rounded-2xl border border-border">
        <Text className="text-text-muted uppercase text-xs font-bold mb-2">Net Worth</Text>
        <Text className="text-3xl font-bold text-text-primary">$1,250,420</Text>
        <Text className="text-accent-success mt-1">+2.4% this month</Text>
      </View>
    </SafeAreaView>
  );
}
