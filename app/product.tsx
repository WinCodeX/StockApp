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
const ITEM_HEIGHT = 140;

export default function ProductsScreen() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [modalType, setModalType] = useState('add');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Renamed for clarity
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchProducts(1, false, true);
  }, []);

  const fetchProducts = async (
    pageToFetch = 1,
    isLoadMore = false,
    forceRefresh = false
  ) => {
    // Prevent duplicate requests
    if (isLoadMore && (!hasMore || isFetchingMore)) {
      console.log('⛔ Preventing duplicate request - hasMore:', hasMore, 'isFetchingMore:', isFetchingMore);
      return;
    }

    // Set loading states
    if (!isLoadMore) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    try {
      console.log(`🔄 Fetching page ${pageToFetch} (isLoadMore: ${isLoadMore}, forceRefresh: ${forceRefresh})`);
      
      const { products: newProducts, meta } = await getProducts(
        pageToFetch,
        forceRefresh,
        PAGE_SIZE
      );

      console.log(`📥 Received ${newProducts.length} products for page ${pageToFetch}`);
      console.log('📊 Meta:', meta);

      // Update products list
      setProducts(prev => {
        if (isLoadMore && pageToFetch > 1) {
          // Filter out duplicates when loading more
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNewProducts = newProducts.filter(p => !existingIds.has(p.id));
          console.log(`➕ Adding ${uniqueNewProducts.length} new products to existing ${prev.length}`);
          return [...prev, ...uniqueNewProducts];
        } else {
          // Replace all products (refresh or initial load)
          console.log(`🔄 Replacing ${prev.length} products with ${newProducts.length} new products`);
          return newProducts;
        }
      });

      // Update pagination state manually
      if (isLoadMore) {
        // When loading more, increment the current page
        setCurrentPage(pageToFetch + 1);
        console.log(`📄 Next page will be: ${pageToFetch + 1}`);
      } else {
        // When refreshing or initial load, set next page
        setCurrentPage(2);
        console.log('📄 Reset to page 2 for next load');
      }

      // Update hasMore based on meta or products received
      const shouldHaveMore = meta?.has_more ?? (newProducts.length >= PAGE_SIZE);
      setHasMore(shouldHaveMore);
      console.log(`🔄 Has more pages: ${shouldHaveMore}`);

      // Reset retry count on successful fetch
      setRetryCount(0);

    } catch (err) {
      console.error(`❌ Failed to fetch page ${pageToFetch}:`, err);

      // Retry logic with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = 1000 * Math.pow(2, retryCount);
        console.log(`⏳ Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchProducts(pageToFetch, isLoadMore, forceRefresh);
        }, delay);
        return;
      }

      // Show error after max retries
      Toast.show({
        type: 'errorToast',
        text1: retryCount >= MAX_RETRIES 
          ? 'Failed to load products after multiple attempts' 
          : 'Failed to load products',
        text2: 'Showing offline data if available'
      });

      // Reset retry count
      setRetryCount(0);

      // If this was a pagination request that failed, don't increment page
      if (isLoadMore) {
        console.log('📄 Pagination failed, keeping current page state');
      }

    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce(async (text) => {
      setIsSearching(true);
      try {
        console.log(`🔍 Searching for: "${text}"`);
        const data = await searchProducts(text);
        setProducts(data);
        setHasMore(false); // Search results don't support pagination
        setCurrentPage(1);
        console.log(`🔍 Found ${data.length} search results`);
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

  const handleSearch = (text) => {
    setSearchQuery(text);

    if (!text.trim()) {
      // Exit search mode and return to normal pagination
      console.log('🔍 Exiting search mode');
      setCurrentPage(1);
      setHasMore(true);
      setIsSearching(false);
      fetchProducts(1, false, true);
    } else {
      // Enter search mode
      console.log('🔍 Entering search mode');
      setCurrentPage(1);
      setHasMore(false);
      debouncedSearch(text.trim());
    }
  };

  const onRefresh = async () => {
    console.log('🔄 Refreshing...');
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    setRetryCount(0);

    if (searchQuery.trim()) {
      // Refresh search results
      debouncedSearch(searchQuery.trim());
    } else {
      // Refresh products list
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
        text2: 'Enter a valid positive number'
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

      // Refresh current view
      if (searchQuery.trim()) {
        debouncedSearch(searchQuery.trim());
      } else {
        await fetchProducts(1, false, true);
      }
    } catch (err) {
      console.error('Failed to add stock:', err);
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

      // Refresh current view
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
    // Don't load more if we're searching
    if (isSearching || searchQuery.trim()) {
      console.log('⛔ Skip end reached - in search mode');
      return;
    }

    // Don't load more if already fetching or no more pages
    if (!isFetchingMore && hasMore && currentPage > 0) {
      console.log(`🔽 End reached. Fetching page ${currentPage}...`);
      fetchProducts(currentPage, true);
    } else {
      console.log(`⛔ Skip end reached - isFetchingMore: ${isFetchingMore}, hasMore: ${hasMore}, currentPage: ${currentPage}`);
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