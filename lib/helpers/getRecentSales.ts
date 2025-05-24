import api from '../api';
import * as SecureStore from 'expo-secure-store';

export const getRecentSales = async () => {
  const token = await SecureStore.getItemAsync('auth_token');
  const res = await api.get('/api/v1/sales/recent', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.sales;
};