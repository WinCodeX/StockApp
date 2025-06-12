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

    const rawData = response.data?.data || [];

    const messages = rawData.map((item) => {
      const attributes = item.attributes || {};
      const userRelationship = item.relationships?.user?.data;

      return {
        id: item.id,
        ...attributes,
        user_id: attributes.user_id || (userRelationship ? userRelationship.id : null),
      };
    });

    console.log('[getMessages] Parsed messages:', messages); // ✅ for debug
    return messages;
  } catch (error: any) {
    console.error('[getMessages] Error:', error?.message || error);
    throw error;
  }
};

export { getMessages };