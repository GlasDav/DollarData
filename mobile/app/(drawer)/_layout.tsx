import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LayoutDashboard, List, PlusCircle, PieChart, Settings } from 'lucide-react-native';
import { View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';

// Custom Drawer Content
function CustomDrawerContent(props: any) {
  const { top } = useSafeAreaInsets();

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: top + 20, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 bg-primary rounded-lg items-center justify-center">
            <Text className="text-white font-bold text-xl">D</Text>
          </View>
          <Text className="text-xl font-bold">DollarData</Text>
        </View>
      </View>
      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 10 }}>
        <DrawerItemList {...props} />

        {/* Helper Actions */}
        <View className="mt-4 border-t border-border pt-4 px-4">
          <TouchableOpacity
            className="flex-row items-center gap-4 py-3"
            onPress={() => router.push('/modal')}
          >
            <PlusCircle size={24} color="#5D5DFF" />
            <Text className="font-medium text-primary">Quick Add</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      <View className="p-4 border-t border-border">
        <Text className="text-xs text-muted-foreground text-center">Version 1.0.0</Text>
      </View>
    </View>
  );
}

export default function DrawerLayout() {
  const colorScheme = useColorScheme();
  const activeColor = Colors[colorScheme ?? 'light'].tint;
  const inactiveColor = '#9CA3AF'; // text-muted
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: true, // Show header (for hamburger)
        headerTransparent: isLandscape, // Overlay in landscape
        headerTitle: isLandscape ? () => null : undefined, // Hide title in landscape
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        headerStyle: {
          // Transparent in landscape, themed in portrait
          backgroundColor: isLandscape ? 'transparent' : (colorScheme === 'dark' ? '#1a1a2e' : '#ffffff'),
          shadowColor: 'transparent', // remove shadow
          elevation: 0,
          height: isLandscape ? 45 : undefined,
        },
        drawerActiveTintColor: activeColor,
        drawerInactiveTintColor: inactiveColor,
        drawerLabelStyle: {
          fontWeight: '600',
          // marginLeft removed to fix overlap
        },
        drawerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#1a1a2e' : '#ffffff',
          width: 280,
        }
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerLabel: 'Dashboard',
          title: 'Dashboard',
          drawerIcon: ({ color, size }) => <LayoutDashboard size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="transactions"
        options={{
          drawerLabel: 'Transactions',
          title: 'Transactions',
          drawerIcon: ({ color, size }) => <List size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="net-worth"
        options={{
          drawerLabel: 'Net Worth',
          title: 'Net Worth',
          drawerIcon: ({ color, size }) => <PieChart size={size} color={color} />,
        }}
      />

      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
          drawerIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />

      {/* Hidden Routes */}
      <Drawer.Screen
        name="add"
        options={{
          drawerItemStyle: { display: 'none' } // Hide from drawer
        }}
      />
      <Drawer.Screen
        name="two"
        options={{
          drawerItemStyle: { display: 'none' }
        }}
      />
    </Drawer>
  );
}
