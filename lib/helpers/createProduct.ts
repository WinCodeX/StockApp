import api from '../api';

export const createProduct = async (product: {
  name: string;
  sku: string;
  price: number;
  quantity: number;
}) => {
  try {
    const response = await api.post('/api/v1/products', { product });
    return response.data;
  } catch (error: any) {
    console.error('Failed to create product:', error.response?.data || error.message);
    throw error;
  }
};