// lib/helpers/stockHistory.ts

import api from '../api';

export const getStockHistory = async (productId: number) => {
  try {
    const res = await api.get(`/api/v1/products/${productId}/stocks`);
    return res.data.data; // adjust if your response structure is different
  } catch (error: any) {
    console.error('Error fetching stock history:', error.response?.data || error.message);
    throw error;
  }
};