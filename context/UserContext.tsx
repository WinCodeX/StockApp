import React, {
  createContext,
  ReactNode,
  useContext,
  useState,
  useEffect,
} from 'react';
import { getUser } from '../lib/helpers/getUser';

type User = {
  username: string;
  avatar_url: string | null;
  // Add more fields as needed
};

type UserContextType = {
  user: User | null;
  refreshUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    try {
      const fetchedUser = await getUser();
      setUser(fetchedUser || null);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
    }
  };

  // Initial load
  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <UserContext.Provider value={{ user, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};