// lib/auth.ts
import * as SecureStore from 'expo-secure-store';
import jwtDecode from 'jwt-decode';

interface DecodedToken {
  exp: number;
  [key: string]: any;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await SecureStore.getItemAsync('auth_token');
  if (!token) return false;

  try {
    const decoded: DecodedToken = jwtDecode(token);
    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
  } catch (e) {
    return false;
  }
}