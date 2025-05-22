// lib/helpers/getUser.ts
import api from "../api";
import * as SecureStore from "expo-secure-store";

export const getUser = async () => {
  const token = await SecureStore.getItemAsync("auth_token");
  const res = await api.get("/api/v1/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data.data.attributes;
};
