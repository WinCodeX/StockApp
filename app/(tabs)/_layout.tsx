import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import colors from '../../theme/colors';
import NetworkBanner from '../../components/NetworkBanner';

export default function TabLayout() {
  const [netStatus, setNetStatus] = useState<'online' | 'offline' | 'server_error'>('online');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setNetStatus(state.isConnected ? 'online' : 'offline');
    });
    return () => unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 12,
            paddingBottom: 4,
            color: '#fff',
          },
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: '#1e1e2e',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            height: 60,
            paddingTop: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            borderTopWidth: 0,
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
            switch (route.name) {
              case 'index': iconName = focused ? 'home' : 'home-outline'; break;
              case 'product': iconName = focused ? 'cube' : 'cube-outline'; break;
              case 'sales': iconName = focused ? 'trending-up' : 'trending-up-outline'; break;
              case 'search': iconName = focused ? 'search' : 'search-outline'; break;
              case 'account': iconName = focused ? 'person' : 'person-outline'; break;
            }
            return (
              <Ionicons name={iconName} size={24} color={focused ? colors.primary : '#6772d4'} />
            );
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#6772d4',
        })}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarLabel: 'Home' }} />
        <Tabs.Screen name="product" options={{ title: 'Products', tabBarLabel: 'Products' }} />
        <Tabs.Screen name="sales" options={{ title: 'Sales', tabBarLabel: 'Sales' }} />
        <Tabs.Screen name="search" options={{ title: 'Search', tabBarLabel: 'Search' }} />
        <Tabs.Screen name="account" options={{ title: 'Account', tabBarLabel: 'Account' }} />
      </Tabs>

      {/* Floating Banner above tab bar */}
      <NetworkBanner status={netStatus} />
    </View>
  );
}