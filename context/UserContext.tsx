// context/UserContext.tsx

import React, { createContext, ReactNode, useContext, useState } from 'react';

type UserContextType = {
  refreshUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [_, setRefreshTrigger] = useState(false);

  const refreshUser = () => {
    setRefreshTrigger(prev => !prev);
  };

  return (
    <UserContext.Provider value={{ refreshUser }}>
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