import api from '../api'; // adjust path if needed

export const searchUsers = async (query: string) => {
  try {
    const response = await api.get('/users/search', {
      params: { q: query },
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Failed to search users:', error);
    return [];
  }
};