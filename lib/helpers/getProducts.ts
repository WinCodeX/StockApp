// lib/helpers/getProducts.ts
import api from "../api";
import * as SecureStore from "expo-secure-store";

export const getProducts = async () => {
  const token = await SecureStore.getItemAsync("auth_token");
  const res = await api.get("/api/v1/products", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.products;
};