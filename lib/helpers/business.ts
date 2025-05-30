import api from '../api';

// Create a new business
export const createBusiness = async (name: string) => {
  const response = await api.post('/api/v1/business', { name });
  return response.data;
};

// Generate an invite code for a business
export const createInvite = async (businessId: number) => {
  const response = await api.post('/api/v1/invites', { business_id: businessId });
  return response.data;
};

// Join a business via invite code
export const joinBusiness = async (code: string) => {
  const response = await api.post('/api/v1/invites/accept', { code });
  return response.data;
};

// Fetch both owned and joined businesses
export const getBusinesses = async () => {
  const response = await api.get('/api/v1/businesses');
  return response.data; // expected: { owned: [...], joined: [...] }
};