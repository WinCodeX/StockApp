import api from '../api';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const buildPageKey = (page: number, query: string) => {
  const trimmed = query.trim().toLowerCase().replace(/\s+/g, '_');
  return `products_cache_page_${page}_${trimmed || 'default'}`;
};

const buildAllKey = (query: string) => {
  const trimmed = query.trim().toLowerCase().replace(/\s+/g, '_');
  return `products_cache_all_${trimmed || 'default'}`;
};

export const getProducts = async (
  page: number = 1,
  forceRefresh: boolean = false
) => {
  const token = await SecureStore.getItemAsync('auth_token');
  const netState = await NetInfo.fetch();

  const pageKey = buildPageKey(page, '');
  const allKey = buildAllKey('');

  const params = { page };

  const fetchAndCache = async () => {
    const res = await api.get('/api/v1/products', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    const products = res.data.products.data || [];
    const meta = res.data.products.meta || {};

    const validated = products.map((product: any) => ({
      ...product,
      attributes: {
        ...product.attributes,
        image_url: product.attributes.image_url?.startsWith('/')
          ? `${api.defaults.baseURL}${product.attributes.image_url}`
          : product.attributes.image_url,
      },
    }));

    // Store individual page
    await AsyncStorage.setItem(pageKey, JSON.stringify({ products: validated, meta }));

    // Merge into global cache
    const existingAll = await AsyncStorage.getItem(allKey);
    const existingList = existingAll ? JSON.parse(existingAll).products : [];

    // Avoid duplicates by ID
    const allMerged = [
      ...existingList.filter((p: any) => !validated.some((v) => v.id === p.id)),
      ...validated,
    ];

    await AsyncStorage.setItem(allKey, JSON.stringify({ products: allMerged }));

    return { products: validated, meta };
  };

  if (netState.isConnected && forceRefresh) {
    try {
      console.log('🔥 Force-refreshing from live API...');
      return await fetchAndCache();
    } catch {
      console.warn('🔥 Force-refresh failed, using cache...');
    }
  }

  if (netState.isConnected) {
    try {
      console.log('🌐 Fetching from live API...');
      return await fetchAndCache();
    } catch {
      console.warn('❌ Live fetch failed, using cache fallback...');
    }
  }

  // Try cache for specific page
  const cachedPage = await AsyncStorage.getItem(pageKey);
  if (cachedPage) {
    const { products, meta } = JSON.parse(cachedPage);
    console.log(`📦 Loaded page ${page} from cache`);
    return { products, meta };
  }

  // Fallback to global offline cache
  const cachedAll = await AsyncStorage.getItem(allKey);
  if (cachedAll) {
    const { products } = JSON.parse(cachedAll);
    console.log('📦 Loaded from all-pages offline cache');
    return { products, meta: { page: 1, total_pages: 1 } };
  }

  throw new Error('No internet and no cached data available.');
};