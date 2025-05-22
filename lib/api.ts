// lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

const api = axios.create({
  baseURL: 'http://192.168.100.155:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject token into every request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired token globally
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');

      Toast.show({
        type: 'error',
        text1: 'Session expired',
        text2: 'Please log in to continue.',
      });

      setTimeout(() => {
        router.replace('/login');
      }, 2000); // small delay for the toast to show

      return;
    }

    return Promise.reject(error);
  }
);

export default api;