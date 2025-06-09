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

const PAGE_SIZE = 10;
const MAX_RETRIES = 3;
const ITEM_HEIGHT = 140; // Approximate height of each card

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
  const [retryCount, setRetryCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchProducts(1, false, true);
  }, []);

  const fetchProducts = async (
    nextPage = 1,
    isLoadMore = false,
    forceRefresh = false
  ) => {
    if (isLoadMore && (!hasMore || isFetchingMore)) return;

    if (!isLoadMore) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      const { products: newProducts, meta } = await getProducts(
        nextPage,
        forceRefresh,
        PAGE_SIZE
      );

      setProducts(prev =>
        isLoadMore && nextPage > 1
          ? [...prev, ...newProducts.filter(p => !prev.some(pp => pp.id === p.id))]
          : newProducts
      );

      if (typeof meta.current_page === 'number' && !isNaN(meta.current_page)) {
        setPage(meta.current_page + 1);
        setHasMore(meta.has_more ?? false);
      } else {
        console.warn('⚠️ Invalid pagination meta:', meta);
        setHasMore(false);
      }

      // Reset retry count on successful fetch
      setRetryCount(0);

      console.log(
        `📦 Page ${meta.current_page} fetched. ${newProducts.length} products. More: ${meta.has_more}`
      );
    } catch (err) {
      console.error('Failed to fetch products:', err);

      // Retry logic for failed requests
      if (retryCount < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, retryCount); // Exponential backoff
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchProducts(nextPage, isLoadMore, forceRefresh);
        }, delay);
        return;
      }

      // Only show error toast for initial load failures or after max retries
      if (!isLoadMore || retryCount >= MAX_RETRIES) {
        Toast.show({
          type: 'errorToast',
          text1: retryCount >= MAX_RETRIES 
            ? 'Failed to load products after multiple attempts'
            : 'Failed to load products',
          text2: 'Showing offline data if available'
        });
      }

      // Reset retry count after showing error
      setRetryCount(0);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (text: string) => {
      setIsSearching(true);
      try {
        const data = await searchProducts(text);
        setProducts(data);
        setHasMore(false); // Search results don't support pagination
        setPage(1);
      } catch (err) {
        console.error('Search failed:', err);
        Toast.show({
          type: 'errorToast',
          text1: 'Search failed',
          text2: 'Please try again'
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);

    if (!text.trim()) {
      // Reset to normal browsing mode
      setPage(1);
      setHasMore(true);
      setIsSearching(false);
      fetchProducts(1, false, true);
      return;
    }

    // Reset pagination state for search
    setPage(1);
    setHasMore(false);
    debouncedSearch(text.trim());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    setRetryCount(0);
    
    if (searchQuery.trim()) {
      // If we're in search mode, refresh search results
      debouncedSearch(searchQuery.trim());
    } else {
      // Otherwise refresh products list
      await fetchProducts(1, false, true);
    }
    
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
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Toast.show({
        type: 'errorToast',
        text1: 'Invalid quantity',
        text2: 'Please enter a valid positive number'
      });
      return;
    }

    try {
      await api.post(`/api/v1/products/${selectedProduct.id}/stocks`, {
        stock: { quantity: parseInt(quantity) },
      });

      Toast.show({
        type: 'successToast',
        text1: 'Stock added successfully!'
      });
      
      setModalVisible(false);
      setQuantity('');
      
      // Refresh the current view
      if (searchQuery.trim()) {
        debouncedSearch(searchQuery.trim());
      } else {
        await fetchProducts(1, false, true);
      }
    } catch (error) {
      console.error('Failed to add stock:', error);
      Toast.show({
        type: 'errorToast',
        text1: 'Failed to add stock',
        text2: 'Please try again'
      });
    }
  };

  const handleCreateProduct = async (product) => {
    try {
      await createProduct(product);
      Toast.show({
        type: 'successToast',
        text1: 'Product created successfully!'
      });
      
      // Refresh the current view
      if (searchQuery.trim()) {
        debouncedSearch(searchQuery.trim());
      } else {
        await fetchProducts(1, false, true);
      }
    } catch (error) {
      console.error('Failed to create product:', error);
      Toast.show({
        type: 'errorToast',
        text1: 'Failed to create product',
        text2: 'Please try again'
      });
    }
  };

  const handleEndReached = () => {
    // Don't load more if we're searching or already fetching
    if (isSearching || searchQuery.trim()) return;
    
    if (!isFetchingMore && hasMore && !isNaN(page)) {
      console.log(`🔽 Reached end of list. Fetching page ${page}...`);
      fetchProducts(page, true);
    }
  };

  const renderFooter = () => {
    if (isFetchingMore) {
      return <LoaderOverlay visible />;
    }
    
    if (!hasMore && products.length > 0 && !searchQuery.trim()) {
      return (
        <Text style={styles.endText}>
          No more products to load
        </Text>
<Button onPress={() => getProducts(page, true)}>Load More</Button>
      );
    }
    
    return null;
  };

  const renderEmpty = () => {
    if (loading || isSearching) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name="package-variant" 
          size={48} 
          color="#999" 
        />
        <Text style={styles.emptyText}>
          {searchQuery.trim() ? 'No products found' : 'No products available'}
        </Text>
        <Text style={styles.emptySubtext}>
          {searchQuery.trim() 
            ? 'Try adjusting your search terms'
            : 'Add some products to get started'
          }
        </Text>
      </View>
    );
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
        {(isSearching || searchQuery.trim()) && (
          <TouchableOpacity 
            onPress={() => handleSearch('')}
            style={styles.clearButton}
          >
            <MaterialCommunityIcons 
              name="close" 
              size={20} 
              color="#999" 
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 100 }}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={onRefresh}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={false}
          getItemLayout={(data, index) => ({
            length: ITEM_HEIGHT,
            offset: ITEM_HEIGHT * index,
            index,
          })}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
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
                  <Text style={styles.subtitle}>
                    Stock: {item.attributes.total_stock}
                  </Text>
                  <Text style={styles.subtitle}>
                    KES {item.attributes.price}
                  </Text>
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
      </View>

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
  clearButton: {
    padding: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  endText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
    fontSize: 14,
  },
});