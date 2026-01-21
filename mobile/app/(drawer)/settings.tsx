import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { LogOut, User, ChevronRight, HelpCircle, Shield, FileText } from 'lucide-react-native';

export default function SettingsScreen() {
    const { signOut, user } = useAuth();

    const menuItems = [
        { icon: HelpCircle, label: 'Help & Support', danger: false },
        { icon: Shield, label: 'Privacy Policy', danger: false },
        { icon: FileText, label: 'Terms of Service', danger: false },
    ];

    return (
        <SafeAreaView className="flex-1 bg-surface">
            <ScrollView contentContainerStyle={{ padding: 24 }}>
                <Text className="text-3xl font-bold text-text-primary mb-8">Settings</Text>

                {/* Profile Section */}
                <View className="bg-card rounded-2xl border border-border p-4 mb-6 flex-row items-center">
                    <View className="w-12 h-12 bg-primary/10 rounded-full items-center justify-center mr-4">
                        <Text className="text-primary font-bold text-xl">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-text-primary">{user?.name || 'User'}</Text>
                        <Text className="text-text-muted">{user?.email}</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="bg-card rounded-2xl border border-border overflow-hidden mb-8">
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            className={`flex-row items-center p-4 ${index !== menuItems.length - 1 ? 'border-b border-border' : ''}`}
                        >
                            <item.icon size={20} color="#6B7280" className="mr-3" />
                            <Text className="flex-1 text-text-primary text-base">{item.label}</Text>
                            <ChevronRight size={20} color="#D1D5DB" />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    onPress={() => signOut()}
                    className="flex-row items-center justify-center bg-white border border-accent-error p-4 rounded-xl"
                >
                    <LogOut size={20} color="#EF4444" className="mr-2" />
                    <Text className="text-accent-error font-bold text-lg">Log Out</Text>
                </TouchableOpacity>

                <Text className="text-center text-text-muted mt-8 text-sm">Version 1.0.0</Text>
            </ScrollView>
        </SafeAreaView>
    );
}
