import { useRouter } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Button, Card, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import debounce from 'lodash.debounce';

import colors from '../theme/colors';
import { getProducts } from '../lib/helpers/getProducts';
import api, { BASE_URL } from '../lib/api';
import BottomSheetModal from '../components/BottomSheetModal';
import CreateProductModal from '../components/CreateProductModal';
import { createProduct } from '../lib/helpers/createProduct';
import defaultProductImage from '../assets/images/default_product.png';
import LoaderOverlay from '../components/LoaderOverlay';
import { searchProducts } from '../lib/helpers/searchProducts';

export default function ProductsScreen() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [modalType, setModalType] = useState<'add' | 'view'>('add');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  useEffect(() => {
    fetchProducts(1, false, true);
  }, []);

  const fetchProducts = async (nextPage = 1, isLoadMore = false, forceRefresh = false) => {
    if (isLoadMore && (!hasMore || isFetchingMore)) return;

    if (!isLoadMore) setLoading(true);
    else setIsFetchingMore(true);

    try {
      const { products: newProducts, meta } = await getProducts(nextPage, forceRefresh);

      setProducts(prev =>
        isLoadMore && nextPage > 1
          ? [...prev, ...newProducts.filter(p => !prev.some(pp => pp.id === p.id))]
          : newProducts
      );

      setPage(meta.current_page + 1);
      setHasMore(meta.has_more ?? false);
    } catch (err) {
      Toast.show({
        type: 'warningToast',
        text1: 'Showing offline data or none available.',
      });
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      try {
        const data = await searchProducts(text);
        setProducts(data);
        setHasMore(false);
      } catch (err) {
        Toast.show({ type: 'errorToast', text1: 'Search failed.' });
      }
    }, 300),
    []
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (!text) {
      fetchProducts(1, false, true);
      return;
    }

    debouncedSearch(text);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts(1, false, true);
    setRefreshing(false);
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
      Toast.show({ type: 'errorToast', text1: 'Invalid quantity.' });
      return;
    }

    try {
      await api.post(`/api/v1/products/${selectedProduct.id}/stocks`, {
        stock: { quantity: parseInt(quantity) },
      });

      Toast.show({ type: 'successToast', text1: 'Stock added successfully!' });
      setModalVisible(false);
      setQuantity('');
      await fetchProducts(1, false, true);
    } catch (error) {
      Toast.show({ type: 'errorToast', text1: 'Failed to add stock.' });
    }
  };

  const handleCreateProduct = async (product) => {
    try {
      await createProduct(product);
      Toast.show({ type: 'successToast', text1: 'Product created successfully!' });
      await fetchProducts(1, false, true);
    } catch {
      Toast.show({ type: 'errorToast', text1: 'Failed to create product.' });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LoaderOverlay visible={loading && products.length === 0} />

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.header}>Products</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={colors.primary}
          style={styles.searchIcon}
        />
        <TextInput
          value={searchQuery}
          onChangeText={handleSearch}
          placeholder="Search products by name or price..."
          placeholderTextColor="#999"
          style={styles.searchInput}
        />
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 100 }}
        onEndReached={() => fetchProducts(page, true)}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListFooterComponent={isFetchingMore ? <LoaderOverlay visible /> : null}
        ListEmptyComponent={
          !loading && (
            <Text style={{ color: '#999', textAlign: 'center', marginTop: 20 }}>
              No products found or offline.
            </Text>
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <View style={styles.cardContent}>
              <Image
                source={
                  item.attributes.image_url
                    ? {
                        uri: item.attributes.image_url.startsWith('/')
                          ? `${BASE_URL}${item.attributes.image_url}`
                          : item.attributes.image_url,
                      }
                    : defaultProductImage
                }
                style={styles.image}
                resizeMode="cover"
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.attributes.name}</Text>
                <Text style={styles.subtitle}>Stock: {item.attributes.total_stock}</Text>
                <Text style={styles.subtitle}>KES {item.attributes.price}</Text>
              </View>

              <View style={styles.counterButtons}>
                <TouchableOpacity style={styles.counterButton}>
                  <Text style={styles.counterText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.counterQuantity}>0</Text>
                <TouchableOpacity style={styles.counterButton}>
                  <Text style={styles.counterText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Card.Actions>
              <Button onPress={() => openViewStockModal(item)}>View Stock</Button>
              <Button onPress={() => openAddStockModal(item)}>Add Stock</Button>
            </Card.Actions>
          </Card>
        )}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        color="white"
        onPress={() => setCreateModalVisible(true)}
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

      <CreateProductModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSubmit={handleCreateProduct}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    color: '#fff',
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
  },
  searchIcon: {
    paddingLeft: 4,
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  image: {
    width: 60,
    height: 60,
    marginRight: 12,
    borderRadius: 8,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  subtitle: {
    color: '#ccc',
    fontSize: 14,
  },
  counterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  counterButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  counterText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  counterQuantity: {
    color: '#fff',
    fontSize: 16,
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