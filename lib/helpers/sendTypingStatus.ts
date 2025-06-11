import api from '../api';

/**
 * Sends a typing status to the backend via HTTP.
 * This can be adapted later for ActionCable websocket integration.
 */
export const sendTypingStatus = async (receiverId: string) => {
  try {
    await api.post('/api/v1/typing_status', {
      receiver_id: receiverId,
    });
  } catch (error) {
    console.error('Failed to send typing status:', error);
  }
};