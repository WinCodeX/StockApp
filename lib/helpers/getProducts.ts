// lib/helpers/getProducts.ts

import api from "../api";
import * as SecureStore from "expo-secure-store";

export const getProducts = async (
  page: number = 1,
  perPage: number = 10,
  query: string = ""
) => {
  const token = await SecureStore.getItemAsync("auth_token");

  const res = await api.get("/api/v1/products", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page,
      per_page: perPage,
      query,
    },
  });

  return {
    products: res.data.products.data,
    meta: res.data.meta,
  };
};