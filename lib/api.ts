import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import NetInfo from '@react-native-community/netinfo';

const LOCAL_BASE = 'http://192.168.100.73:3000';
const PROD_BASE = 'https://stockx-3vvh.onrender.com';

// Async function to determine which base URL to use
let resolvedBaseUrl: string | null = null;

const getBaseUrl = async (): Promise<string> => {
  if (resolvedBaseUrl) return resolvedBaseUrl;

  try {
    await axios.get(`${LOCAL_BASE}/api/v1/ping`, { timeout: 2000 });
    resolvedBaseUrl = LOCAL_BASE;
  } catch {
    resolvedBaseUrl = PROD_BASE;
  }

  return resolvedBaseUrl;
};

// Create an Axios instance
const api = axios.create({
  baseURL: PROD_BASE, // temporary, will be replaced on first request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject token and base URL before each request
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');

  if (!resolvedBaseUrl) {
    const url = await getBaseUrl();
    config.baseURL = url;
  } else {
    config.baseURL = resolvedBaseUrl;
  }

  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle responses and errors
api.interceptors.response.use(
  response => response,
  async error => {
    // 1. Session expired
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

    // 2. Offline handling
    const net = await NetInfo.fetch();
    const isOffline = !net.isConnected || error.message === 'Network Error';

    if (isOffline) {
      Toast.show({
        type: 'errorToast',
        text1: 'You are offline',
        text2: 'Some features may not work until you’re back online.',
      });
    }

    return Promise.reject(error);
  }
);

export default api;