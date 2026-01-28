import React from 'react';
import { View, Switch, Alert, TouchableOpacity } from 'react-native';
import { Stack, router } from 'expo-router';
import { Card } from '~/components/ui/card';
import { Text } from '~/components/ui/text';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/src/context/AuthContext';
import { User, Bell, Shield, LogOut, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
    const { logout, user } = useAuth();
    const [isDark, setIsDark] = React.useState(false);
    const [notifications, setNotifications] = React.useState(true);

    const handleLogout = async () => {
        try {
            await logout();
            // Router replace is handled by AuthContext usually, but safety check:
            router.replace('/(auth)/login');
        } catch (e) {
            Alert.alert('Error', 'Failed to log out');
        }
    };

    const SettingRow = ({ icon: Icon, label, value, onPress, isDestructive = false }: any) => (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={onPress ? 0.7 : 1}
            className="flex-row items-center justify-between py-3 border-b border-border/40 last:border-0"
        >
            <View className="flex-row items-center gap-3">
                <Icon size={20} color={isDestructive ? '#ef4444' : '#6b7280'} />
                <Text className={isDestructive ? "text-destructive font-medium" : "text-foreground font-medium"}>
                    {label}
                </Text>
            </View>
            {value}
        </TouchableOpacity>
    );

    return (
        <>
            <Stack.Screen options={{
                title: 'Settings',
                headerShadowVisible: false,
                headerStyle: { backgroundColor: 'transparent' },
                headerTitleStyle: { fontSize: 20, fontWeight: 'bold' }
            }} />

            <View className="flex-1 bg-background px-4 pt-2">
                {/* Profile Card */}
                <Card className="p-4 mb-6 bg-card flex-row items-center gap-4">
                    <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center">
                        <Text className="text-2xl font-bold text-primary">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                    </View>
                    <View>
                        <Text className="text-lg font-bold text-foreground">
                            {user?.user_metadata?.first_name || 'User'}
                        </Text>
                        <Text className="text-muted-foreground">{user?.email}</Text>
                    </View>
                </Card>

                <Text className="text-sm font-bold text-muted-foreground uppercase mb-2 ml-1">Preferences</Text>
                <Card className="p-4 mb-6 bg-card">
                    <SettingRow
                        icon={User}
                        label="Account Details"
                        value={<ChevronRight size={20} color="#9ca3af" />}
                        onPress={() => { }}
                    />
                    <SettingRow
                        icon={Bell}
                        label="Notifications"
                        value={
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#767577', true: '#5D5DFF' }} // brand color
                            />
                        }
                    />
                    <SettingRow
                        icon={Shield}
                        label="Security"
                        value={<ChevronRight size={20} color="#9ca3af" />}
                        onPress={() => { }}
                    />
                </Card>

                <Button
                    variant="destructive"
                    className="w-full flex-row items-center justify-center gap-2 mt-4"
                    onPress={handleLogout}
                >
                    <LogOut size={20} color="white" />
                    <Text className="text-white font-bold">Log Out</Text>
                </Button>

                <Text className="text-center text-xs text-muted-foreground mt-8">
                    Version 1.0.0 (Build 142)
                </Text>
            </View>
        </>
    );
}
