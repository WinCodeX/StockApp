// lib/api.ts

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';

const BASE_URLS = [
  'http://192.168.100.73:3000',  // Laptop on Wifi,   
'https://stockx-3vvh.onrender.com',// (Optional) fallback via virtual bridge
];
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

// Handle responses and errors
api.interceptors.response.use(
  response => response,
  async error => {
    // Session expired
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync('auth_token');

      Toast.show({
        type: 'warningToast',
        text1: 'Session expired',
      });

      setTimeout(() => {
        router.replace('/login');
      }, 2000);

      return;
    }

    // Check network status for offline handling
    const net = await NetInfo.fetch();
    const offline = !net.isConnected || error.message === 'Network Error';

    if (offline) {
      Toast.show({
        type: 'errorToast',
        text1: 'You are offline',
        text2: 'Some features may not work until connection is restored.',
      });
    }

    return Promise.reject(error);
  }
);

export default api;