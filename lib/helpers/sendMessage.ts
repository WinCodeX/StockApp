// sendMessage.ts
import api from '../api';
import * as SecureStore from 'expo-secure-store';

const sendMessage = async (conversationId: string, content: string) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (!token) {
      throw new Error('No token found. Please login again.');
    }

    const response = await api.post(
      `/api/v1/conversations/${conversationId}/messages`,
      {
        message: { body: content }, // ✅ Must match Rails expected param
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Error sending message:', error?.message || error);
    throw error;
  }
};

export { sendMessage };