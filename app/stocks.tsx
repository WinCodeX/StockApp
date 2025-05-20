// app/stocks.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { useSearchParams } from 'expo-router';
import api from '../lib/api';
import colors from '../theme/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function StocksScreen() {
  const { id } = useSearchParams();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/products/${id}/stocks`)
        .then((res) => setStocks(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Stock Entries</Text>
      <FlatList
        data={stocks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>Date: {new Date(item.created_at).toLocaleDateString()}</Text>
            <Text>Quantity: {item.quantity}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    fontSize: 20,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
});