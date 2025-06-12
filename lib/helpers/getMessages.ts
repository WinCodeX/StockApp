// getMessages.ts
import api from '../api';
import * as SecureStore from 'expo-secure-store';

const getMessages = async (conversationId: string) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      throw new Error('No token found. Please login again.');
    }

    const response = await api.get(
      `/api/v1/conversations/${conversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json', // ✅ Important
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error fetching messages:', error?.message || error);
    throw error;
  }
};

export { getMessages };