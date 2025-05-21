// app/_layout.tsx 
import React, { useEffect, useState } from 'react'; 
import { Slot, useRouter, useSegments } from 'expo-router';
 import * as SecureStore from 'expo-secure-store';
 import { ActivityIndicator, View, StyleSheet } from 'react-native'; 
import Toast from 'react-native-toast-message';
 import { Provider as PaperProvider } from 'react-native-paper'; 
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'; 
import { useColorScheme } from 'react-native'; 
import toastConfig from '../lib/toastConfig';

export default function RootLayout() { const [isAuthChecked, setAuthChecked] = useState(false); const segments = useSegments(); const router = useRouter(); const colorScheme = useColorScheme();

useEffect(() => { const checkSession = async () => { const token = await SecureStore.getItemAsync('auth_token'); const isAuth = !!token; setAuthChecked(true);

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

if (!isAuthChecked) { return ( <View style={styles.loader}> <ActivityIndicator size="large" color="#a78bfa" /> </View> ); }

return ( <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}> <PaperProvider> <Slot /> <Toast config={toastConfig} /> </PaperProvider> </ThemeProvider> ); }

const styles = StyleSheet.create({ loader: { flex: 1, justifyContent: 'center', alignItems: 'center', }, });

