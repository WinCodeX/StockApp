import api from '../api';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const buildCacheKey = (page: number, query: string) => {
  const trimmed = query.trim().toLowerCase().replace(/\s+/g, '_');
  return `products_cache_page_${page}_${trimmed || 'default'}`;
};

export const getProducts = async (
  page: number = 1,
  forceRefresh: boolean = false
) => {
  const token = await SecureStore.getItemAsync('auth_token');
  const cacheKey = buildCacheKey(page, '');

  const params = { page };

  const netState = await NetInfo.fetch();

  if (netState.isConnected && forceRefresh) {
    try {
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

      await AsyncStorage.setItem(cacheKey, JSON.stringify({ products: validated, meta }));
      console.log('🔥 Force refresh used live API');
      return { products: validated, meta };
    } catch (error) {
      console.warn('🔥 Force refresh failed, trying cache fallback...');
    }
  }

  if (netState.isConnected) {
    try {
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

      await AsyncStorage.setItem(cacheKey, JSON.stringify({ products: validated, meta }));
      console.log('🌐 Fetched from API');
      return { products: validated, meta };
    } catch (error) {
      console.warn('❌ Live fetch failed, trying cache...');
    }
  }

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    const { products, meta } = JSON.parse(cached);
    console.log('📦 Loaded from cache');
    return { products, meta };
  }

  throw new Error('No internet and no cached data available.');
};