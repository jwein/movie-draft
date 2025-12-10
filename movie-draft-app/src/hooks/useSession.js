import { useState, useEffect, useCallback } from 'react';
import { ref, set, get } from 'firebase/database';
import { database, isFirebaseConfigured } from '../config/firebase';
import { generateSessionId, getSessionIdFromURL, generateUserId } from '../utils/sessionUtils';

const STORAGE_KEYS = {
  SESSION_ID: 'movie-draft-session-id',
  USER_ID: 'movie-draft-user-id',
};

export function useSession() {
  const [sessionId, setSessionId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [userId, setUserId] = useState(null);

  const joinSession = useCallback(async (sessionIdToJoin) => {
    setConnectionStatus('connecting');

    if (isFirebaseConfigured() && database) {
      try {
        // Trim and validate session ID
        const trimmedSessionId = sessionIdToJoin.trim();
        if (!trimmedSessionId) {
          console.error('Empty session ID provided');
          setConnectionStatus('error');
          return false;
        }

        console.log('Attempting to join session:', trimmedSessionId);
        const sessionRef = ref(database, `sessions/${trimmedSessionId}/metadata`);
        const snapshot = await get(sessionRef);

        console.log('Session snapshot exists:', snapshot.exists());
        
        if (snapshot.exists()) {
          const metadata = snapshot.val();
          console.log('Session metadata:', metadata);
          
          // Get or generate userId
          let currentUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
          if (!currentUserId) {
            currentUserId = generateUserId();
            localStorage.setItem(STORAGE_KEYS.USER_ID, currentUserId);
          }
          
          setUserId(currentUserId);
          
          // Determine role
          if (currentUserId === metadata.commissionerId) {
            setUserRole('commissioner');
          } else {
            setUserRole('viewer');
          }
          
          setSessionId(trimmedSessionId);
          setConnectionStatus('connected');
          localStorage.setItem(STORAGE_KEYS.SESSION_ID, trimmedSessionId);
          
          // Clear URL parameter
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('session');
            window.history.replaceState({}, '', url);
          } catch (urlError) {
            // Ignore URL errors (might be Firefox-specific)
            console.warn('Could not update URL:', urlError);
          }
          
          return true;
        } else {
          console.error('Session not found in Firebase:', trimmedSessionId);
          setConnectionStatus('error');
          return false;
        }
      } catch (error) {
        console.error('Error joining session:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          stack: error.stack
        });
        setConnectionStatus('error');
        return false;
      }
    } else {
      console.warn('Firebase not configured, using localStorage fallback');
      // Firebase not configured - check localStorage fallback
      const storedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
      if (storedSessionId === sessionIdToJoin.trim()) {
        setSessionId(sessionIdToJoin.trim());
        setUserRole('viewer');
        setConnectionStatus('connected');
        return true;
      }
      
      setConnectionStatus('error');
      return false;
    }
  }, []);

  // Load persisted session on mount
  useEffect(() => {
    const loadPersistedSession = async () => {
      const storedSessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
      const storedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);

      if (storedSessionId) {
        // Verify session still exists in Firebase (if configured)
        if (isFirebaseConfigured() && database) {
          try {
            const sessionRef = ref(database, `sessions/${storedSessionId}/metadata`);
            const snapshot = await get(sessionRef);
            
            if (snapshot.exists()) {
              const metadata = snapshot.val();
              setSessionId(storedSessionId);
              setUserId(storedUserId);
              
              // Determine role based on userId and commissionerId
              if (storedUserId === metadata.commissionerId) {
                setUserRole('commissioner');
              } else {
                setUserRole('viewer');
              }
              
              setConnectionStatus('connected');
            } else {
              // Session no longer exists, clear storage
              localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
              localStorage.removeItem(STORAGE_KEYS.USER_ID);
            }
          } catch (error) {
            console.error('Error verifying persisted session:', error);
            // Clear invalid session
            localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
            localStorage.removeItem(STORAGE_KEYS.USER_ID);
          }
        } else {
          // Firebase not configured, restore from localStorage only
          setSessionId(storedSessionId);
          setUserId(storedUserId);
          setUserRole('commissioner'); // Assume commissioner if no Firebase
          setConnectionStatus('connected');
        }
      }
    };

    loadPersistedSession();
  }, []);

  // Handle URL-based session joining
  useEffect(() => {
    if (!sessionId) {
      const urlSessionId = getSessionIdFromURL();
      if (urlSessionId) {
        joinSession(urlSessionId);
      }
    }
  }, [sessionId, joinSession]);

  const hostSession = useCallback(async () => {
    const newSessionId = generateSessionId();
    let newUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    
    // Generate userId if not exists
    if (!newUserId) {
      newUserId = generateUserId();
      localStorage.setItem(STORAGE_KEYS.USER_ID, newUserId);
    }
    
    setUserId(newUserId);
    setConnectionStatus('connecting');

    if (isFirebaseConfigured() && database) {
      try {
        // Create session in Firebase
        const sessionRef = ref(database, `sessions/${newSessionId}/metadata`);
        await set(sessionRef, {
          createdAt: Date.now(),
          commissionerId: newUserId,
          isActive: true,
        });

        setSessionId(newSessionId);
        setUserRole('commissioner');
        setConnectionStatus('connected');
        localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
        
        return newSessionId;
      } catch (error) {
        console.error('Error creating session in Firebase:', error);
        setConnectionStatus('error');
        // Fall through to localStorage-only mode
      }
    }

    // Firebase not configured or error occurred - use localStorage only
    console.warn('Firebase not configured. Session will work locally only (no real-time sync).');
    setSessionId(newSessionId);
    setUserRole('commissioner');
    setConnectionStatus('connected');
    localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
    
    return newSessionId;
  }, []);

  const leaveSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.SESSION_ID);
    // Keep userId for potential rejoin
    setSessionId(null);
    setUserRole(null);
    setConnectionStatus('disconnected');
    
    // Clear URL parameter if present
    const url = new URL(window.location.href);
    url.searchParams.delete('session');
    window.history.replaceState({}, '', url);
  }, []);

  const isConnected = connectionStatus === 'connected';
  const isHosting = userRole === 'commissioner' && isConnected;

  return {
    sessionId,
    userRole,
    isConnected,
    isHosting,
    hostSession,
    joinSession,
    leaveSession,
    connectionStatus,
  };
}

