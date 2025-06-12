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
          Accept: 'application/json',
        },
      }
    );

    // FastJsonapi format: { data: [ { id, attributes: {...}, relationships: {...} } ] }
    const rawData = response.data?.data || [];

    const messages = rawData.map((item) => ({
      id: item.id,
      ...item.attributes,
      user: item.relationships?.user?.data || null, // optional: include user ref if needed
    }));

    return messages;
  } catch (error: any) {
    console.error('Error fetching messages:', error?.message || error);
    throw error;
  }
};

export { getMessages };