import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { toastConfig } from '../lib/toastConfig';
import { UserProvider } from '../context/UserContext'; // ✅ Import your context

// Font config
const fontConfig = {
  regular: { fontFamily: 'System', fontWeight: 'normal' },
  medium: { fontFamily: 'System', fontWeight: '500' },
  bold: { fontFamily: 'System', fontWeight: 'bold' },
};

const CustomLightTheme = {
  ...MD3LightTheme,
  fonts: { ...MD3LightTheme.fonts, ...fontConfig },
};

const CustomDarkTheme = {
  ...MD3DarkTheme,
  fonts: { ...MD3DarkTheme.fonts, ...fontConfig },
};

export default function RootLayout() {
  const [isAuthChecked, setAuthChecked] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const checkSession = async () => {
      const token = await SecureStore.getItemAsync('auth_token');
      const isAuth = !!token;

      setAuthChecked(true);

      const inAuthGroup = segments[0] === '(auth)';
      const inTabGroup = segments[0] === '(tabs)';

      if (!isAuth && inTabGroup) {
        router.replace('/login');
      } else if (isAuth && inAuthGroup) {
        router.replace('/');
      }
    };

    checkSession();
  }, [segments, router]);

  if (!isAuthChecked) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#a78bfa" />
      </View>
    );
  }

  return (
    <>
      <PaperProvider theme={colorScheme === 'dark' ? CustomDarkTheme : CustomLightTheme}>
        <UserProvider> {/* ✅ Wrap Slot with UserProvider */}
          <Slot />
        </UserProvider>
      </PaperProvider>
      <Toast config={toastConfig} topOffset={50} />
    </>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});