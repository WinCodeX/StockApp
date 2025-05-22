import api from '../api';

export const searchProducts = async (query: string) => {
  const response = await api.get(`/api/v1/products?search=${query}`);
  return response.data;
};