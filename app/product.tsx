// app/products.tsx
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Button, Card, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../lib/api';
import colors from '../theme/colors';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    setLoading(true);
    api.get('/api/v1/products')
      .then((res) => setProducts(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const openAddStockModal = (product) => {
    setSelectedProduct(product);
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
      fetchProducts(); // optional: refresh product list
    } catch (error) {
      Alert.alert('Error', 'Failed to add stock.');
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color={colors.primary} />;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Products</Text>
      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title title={item.attributes.name} subtitle={`Price: ${item.attributes.price}`} />
            <Card.Actions>
              <Button onPress={() => router.push(`/stocks?id=${item.id}`)}>View Stock</Button>
              <Button onPress={() => openAddStockModal(item)}>Add Stock</Button>
            </Card.Actions>
          </Card>
        )}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        onPress={() => {
          Alert.alert('Pick a product', 'Tap "Add Stock" inside a product card.');
        }}
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Stock</Text>
            <Text style={styles.modalLabel}>Product: {selectedProduct?.attributes.name}</Text>
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
              placeholder="Enter quantity"
              style={styles.input}
            />
            <View style={styles.modalActions}>
              <Button mode="contained" onPress={submitStock}>Submit</Button>
              <Button onPress={() => setModalVisible(false)}>Cancel</Button>
            </View>
          </View>
        </View>
      </Modal>
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
  bottom: 90, // <-- lifted above the tab bar
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 10,
    width: '80%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 14,
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});