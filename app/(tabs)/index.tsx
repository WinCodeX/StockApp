// app/(tabs)/index.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useRouter } from 'expo-router';

import colors from '../../theme/colors';
import HeaderBar from '../../components/HeaderBar';

export default function Dashboard() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <HeaderBar />

      <View style={styles.content}>
        <Text style={styles.title}>Welcome to StockApp</Text>

        <Button
          mode="contained"
          onPress={() => router.push('/(tabs)/product')}
          style={styles.button}
        >
          View Products
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: colors.primary,
    marginBottom: 30,
  },
  button: {
    width: '100%',
  },
});