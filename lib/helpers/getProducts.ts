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
  const params = { page, per_page: 10 };

  const fetchAndCache = async () => {
    const res = await api.get('/api/v1/products', {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });

    const response = res.data || {};
    const productBlock = response.products || {};
    const products = productBlock.data || [];
    const meta = productBlock.meta || {};

    console.log(`✅ Meta from API (page ${page}):`, meta);

    const validated = products.map((product: any) => ({
      ...product,
      attributes: {
        ...product.attributes,
        image_url: product.attributes.image_url?.startsWith('/')
          ? `${api.defaults.baseURL}${product.attributes.image_url}`
          : product.attributes.image_url,
      },
    }));

    // Save individual page
    await AsyncStorage.setItem(pageKey, JSON.stringify({ products: validated, meta }));

    // Merge into offline global cache
    const existingAll = await AsyncStorage.getItem(allKey);
    const existingList = existingAll ? JSON.parse(existingAll).products : [];

    const validatedIds = new Set(validated.map(p => p.id));
    const allMerged = [
      ...existingList.filter(p => !validatedIds.has(p.id)),
      ...validated,
    ];

    await AsyncStorage.setItem(allKey, JSON.stringify({ products: allMerged }));

    return { products: validated, meta };
  };

  if (netState.isConnected && forceRefresh) {
    try {
      console.log('🔥 Force-refreshing from live API...');
      return await fetchAndCache();
    } catch (err) {
      console.warn('🔥 Force-refresh failed, using cache fallback...');
    }
  }

  if (netState.isConnected) {
    try {
      console.log('🌐 Fetching from live API...');
      return await fetchAndCache();
    } catch (err) {
      console.warn('❌ Live fetch failed, using cache fallback...');
    }
  }

  // Fallback: Try individual page cache
  const cachedPage = await AsyncStorage.getItem(pageKey);
  if (cachedPage) {
    const { products, meta } = JSON.parse(cachedPage);
    console.log(`📦 Loaded page ${page} from cache`);
    console.log(`📊 Meta from cache (page ${page}):`, meta);
    return { products, meta };
  }

  // Fallback: Use global offline merged cache
  const cachedAll = await AsyncStorage.getItem(allKey);
  if (cachedAll) {
    const { products } = JSON.parse(cachedAll);
    console.log('📦 Loaded from all-pages offline cache');
    return {
      products,
      meta: {
        current_page: 1,
        total_pages: 1,
        has_more: false,
        total_count: products.length,
      },
    };
  }

  throw new Error('No internet and no cached data available.');
};