// lib/helpers/getProducts.ts

import api from "../api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper to generate a consistent cache key based on page number and query
const buildCacheKey = (page: number, query: string) => {
  const trimmed = query.trim().toLowerCase().replace(/\s+/g, "_");
  return `products_cache_page_${page}_${trimmed || "default"}`;
};

export const getProducts = async (
  page: number = 1,
  perPage: number = 10,
  query: string = ""
) => {
  const token = await SecureStore.getItemAsync("auth_token");

  const params: any = {
    page,
    per_page: perPage,
  };

  if (query.trim() !== "") {
    params.query = query;
  }

  const cacheKey = buildCacheKey(page, query);

  try {
    // Try to fetch from the server
    const res = await api.get("/api/v1/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params,
    });

    const data = res.data.products.data;
    const meta = res.data.meta;

    // Save the result to local storage for offline use
    await AsyncStorage.setItem(cacheKey, JSON.stringify({ data, meta }));

    return { products: data, meta };
  } catch (error) {
    // Fallback: Try to read from cache
    const cached = await AsyncStorage.getItem(cacheKey);

    if (cached) {
      const { data, meta } = JSON.parse(cached);
      return { products: data, meta };
    }

    // If no cache available, rethrow the error
    throw error;
  }
};