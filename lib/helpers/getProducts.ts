import api from '../api';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generate a consistent key for offline cache
const buildCacheKey = (page: number, query: string) => {
  const trimmed = query.trim().toLowerCase().replace(/\s+/g, '_');
  return `products_cache_page_${page}_${trimmed || 'default'}`;
};

export const getProducts = async (
  page: number = 1,
  perPage: number = 10,
  query: string = ''
) => {
  const token = await SecureStore.getItemAsync('auth_token');
  const cacheKey = buildCacheKey(page, query);

  const params: Record<string, any> = {
    page,
    per_page: perPage,
  };

  if (query.trim()) {
    params.query = query.trim();
  }

  try {
    const res = await api.get('/api/v1/products', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    const products = res.data.products.data;
    const meta = res.data.meta;

    // Cache response for offline use
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ products, meta }));

    return { products, meta };
  } catch (error) {
    const cached = await AsyncStorage.getItem(cacheKey);

    if (cached) {
      const { products, meta } = JSON.parse(cached);
      return { products, meta };
    }

    throw error; // No cache and request failed
  }
};