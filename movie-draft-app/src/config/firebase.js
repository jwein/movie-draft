import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

/**
 * Check if Firebase configuration is available
 * This allows the app to work in solo mode even if Firebase isn't configured
 */
export const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_DATABASE_URL
  );
};

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase only if configuration is available
let app = null;
let database = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('Firebase initialized successfully');
    console.log('Database URL:', firebaseConfig.databaseURL);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // App will continue to work in solo mode
  }
} else {
  console.warn('Firebase not configured - missing environment variables');
  console.log('Available env vars:', {
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasDatabaseURL: !!import.meta.env.VITE_FIREBASE_DATABASE_URL,
  });
}

export { database };

