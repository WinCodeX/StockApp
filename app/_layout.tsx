import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'; import { useFonts } from 'expo-font'; import { Stack, useRouter } from 'expo-router'; import { StatusBar } from 'expo-status-bar'; import 'react-native-reanimated'; import { useEffect, useState } from 'react'; import { isAuthenticated } from '../lib/auth'; import { useColorScheme } from '@hooks/useColorScheme';

export default function RootLayout() { const colorScheme = useColorScheme(); const [loaded] = useFonts({ SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'), });

const [checkingAuth, setCheckingAuth] = useState(true); const router = useRouter();

useEffect(() => { const check = async () => { const valid = await isAuthenticated(); if (!valid) router.replace('/login'); else setCheckingAuth(false); }; check(); }, []);

if (!loaded || checkingAuth) { return null; }

return ( <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}> <Stack> <Stack.Screen name="(tabs)" options={{ headerShown: false }} /> <Stack.Screen name="+not-found" /> </Stack> <StatusBar style="auto" /> </ThemeProvider> ); }

