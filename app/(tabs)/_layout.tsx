import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
  screenOptions={{
    tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarBackground: TabBarBackground,
    tabBarStyle: {
      position: 'absolute',
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: 70,
      paddingBottom: 10,
      paddingTop: 10,
      left: 0,
      right: 0,
      bottom: 0,
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
  }}
>
  <Tabs.Screen
    name="index"
    options={{
      title: 'Home',
      tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
    }}
  />
  <Tabs.Screen
    name="products"
    options={{
      title: 'Products',
      tabBarIcon: ({ color }) => <IconSymbol size={28} name="cube.box.fill" color={color} />,
    }}
  />
  <Tabs.Screen
    name="sales"
    options={{
      title: 'Sales',
      tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
    }}
  />
</Tabs>
  );
}
