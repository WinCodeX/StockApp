// lib/helpers/getUser.ts
import api from "../api";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const getUser = async () => {
  const token = await SecureStore.getItemAsync("auth_token");

  try {
    const res = await api.get("/api/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const user = res.data.data.attributes;

    // Cache the fetched user
    await AsyncStorage.setItem("cached_user", JSON.stringify(user));

    return user;
  } catch (error) {
    // Fallback to cached user if offline
    const cached = await AsyncStorage.getItem("cached_user");
    if (cached) {
      return JSON.parse(cached);
    }

    throw error;
  }
};