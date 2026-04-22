import { createContext, useContext } from 'react';
import { useSession } from '../hooks/useSession';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const session = useSession();
  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within SessionProvider');
  }
  return context;
}

