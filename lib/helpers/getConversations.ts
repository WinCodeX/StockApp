import api from '../api';
import * as SecureStore from 'expo-secure-store';

const getConversations = async () => {
  try {
    // Retrieve the auth token from SecureStore
    const token = await SecureStore.getItemAsync('auth_token');

    if (!token) {
      throw new Error('No token found. Please login again.');
    }

    // Make API call to get the list of conversations
    const response = await api.get('/api/v1/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Handle response and return data
    return response.data; // assuming the response contains the list of conversations
  } catch (error) {
    console.error('Error fetching conversations:', error.message);
    throw error; // Rethrow the error so the caller can handle it
  }
};

export { getConversations };