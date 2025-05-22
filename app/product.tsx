// app/products.tsx

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { getProducts } from '../lib/helpers/getProducts';
import api from '../lib/api';
import BottomSheetModal from '../components/BottomSheetModal';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [modalType, setModalType] = useState<'add' | 'view'>('add');

  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddStockModal = (product) => {
    setSelectedProduct(product);
    setModalType('add');
    setModalVisible(true);
  };

  const openViewStockModal = (product) => {
    setSelectedProduct(product);
    setModalType('view');
    setModalVisible(true);
  };

  const submitStock = async () => {
    if (!quantity || isNaN(quantity)) {
      Alert.alert('Invalid Quantity', 'Please enter a valid number.');
      return;
    }

    try {
      await api.post(`/api/v1/products/${selectedProduct.id}/stocks`, {
        stock: { quantity: parseInt(quantity) },
      });
      Alert.alert('Success', 'Stock added successfully.');
      setModalVisible(false);
      setQuantity('');
      fetchProducts();
    } catch (error) {
      Alert.alert('Error', 'Failed to add stock.');
    }
  };

  if (loading) {
    return (
      <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Products</Text>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title
              title={item.attributes.name}
              subtitle={`Price: ${item.attributes.price}`}
            />
            <Card.Actions>
              <Button onPress={() => openViewStockModal(item)}>
                View Stock
              </Button>
              <Button onPress={() => openAddStockModal(item)}>
                Add Stock
              </Button>
            </Card.Actions>
          </Card>
        )}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        onPress={() =>
          Alert.alert('Pick a product', 'Tap "Add Stock" inside a product card.')
        }
      />

      <BottomSheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        product={selectedProduct}
        type={modalType}
        quantity={quantity}
        setQuantity={setQuantity}
        onSubmit={submitStock}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 12,
  },
  card: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    width: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});