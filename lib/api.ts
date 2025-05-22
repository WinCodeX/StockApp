// lib/api.ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const api = axios.create({
  baseURL: 'http://192.168.100.155:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;