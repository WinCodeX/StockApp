import React, { useEffect, useState } from 'react'; import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, } from 'react-native'; import { Button, Card } from 'react-native-paper'; import { useRouter } from 'expo-router'; import { SafeAreaView } from 'react-native-safe-area-context'; import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../theme/colors'; import HeaderBar from '../../components/HeaderBar'; import { getProductStats } from '../../lib/helpers/getProductStats'; import { getRecentSales } from '../../lib/helpers/getRecentSales';

export default function Dashboard() { const router = useRouter();

const [stats, setStats] = useState(null); const [recentSales, setRecentSales] = useState([]); const [loading, setLoading] = useState(true);

useEffect(() => { loadDashboardData(); }, []);

const loadDashboardData = async () => { try { const productStats = await getProductStats(); const sales = await getRecentSales();

setStats(productStats);
  setRecentSales(sales);
} catch (error) {
  console.error('Failed to load dashboard data', error);

  // Safe fallback if it's the first time and there's no cache
  setStats({ total_products: 0, low_stock: 0 });
  setRecentSales([]);
} finally {
  setLoading(false);
}

};

return ( <SafeAreaView style={styles.container}> <HeaderBar />

<View style={styles.content}>
    <Text style={styles.title}>Welcome to StockApp</Text>

    {loading ? (
      <ActivityIndicator color={colors.primary} />
    ) : (
      <>
        {/* Product Stats */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Total Products</Text>
            <Text style={styles.statValue}>{stats.total_products}</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Low Stock</Text>
            <Text style={styles.statValue}>{stats.low_stock}</Text>
          </Card>
        </View>

        {/* Recent Sales */}
        <Text style={styles.subtitle}>Recent Sales</Text>

        <FlatList
          data={recentSales}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.saleItem}>
              <Text style={styles.saleText}>{item.product_name}</Text>
              <Text style={styles.saleText}>Qty: {item.quantity}</Text>
              <Text style={styles.saleText}>KES {item.total}</Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No sales recorded.</Text>
          }
        />

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            mode="contained"
            onPress={() => router.push('/(tabs)/product')}
          >
            View Products
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.push('/(tabs)/sales')}
          >
            Record Sale
          </Button>
        </View>
      </>
    )}
  </View>
</SafeAreaView>

); }

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.background, }, content: { flex: 1, padding: 16, }, title: { fontSize: 24, color: colors.primary, textAlign: 'center', marginBottom: 20, }, statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, }, statCard: { flex: 1, padding: 16, backgroundColor: '#2a2a3d', marginHorizontal: 5, }, statLabel: { color: '#ccc', fontSize: 14, }, statValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', }, subtitle: { color: '#bd93f9', fontSize: 18, marginBottom: 8, }, saleItem: { backgroundColor: '#2a2a3d', padding: 12, borderRadius: 8, marginBottom: 8, }, saleText: { color: '#fff', }, emptyText: { color: '#999', textAlign: 'center', marginTop: 20, }, quickActions: { marginTop: 20, gap: 10, }, });

