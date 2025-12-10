# Commissioner Mode - Technical Specification

## Overview

This document provides technical implementation details for the Commissioner Mode feature. It should be read alongside `COMMISSIONER_MODE_SPRINT_PLAN.md` which contains product requirements and user stories.

---

## Architecture

### High-Level Flow

```
Commissioner                    Firebase                    Viewers
     |                              |                          |
     |-- Create Session ----------->|                          |
     |<-- Session ID --------------|                          |
     |                              |                          |
     |-- Make Pick ---------------->|                          |
     |                              |-- Broadcast Update ----->|
     |                              |                          |
```

### State Synchronization Strategy

- **Solo Mode (Default)**: Uses localStorage (existing behavior)
- **Session Mode**: Uses Firebase Realtime Database
- **Hybrid**: App detects session presence and switches sync mechanism

---

## Dependencies

### New Packages Required

```json
{
  "dependencies": {
    "firebase": "^10.7.0"
  }
}
```

**Installation:**
```bash
cd movie-draft-app
npm install firebase
```

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: "Movie Draft" (or your preference)
4. Disable Google Analytics (optional)
5. Create project

### 2. Create Realtime Database

1. In Firebase Console, go to "Realtime Database"
2. Click "Create Database"
3. Choose location (closest to users)
4. Start in **test mode** (we'll update rules)

### 3. Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click web icon (`</>`)
4. Register app: "Movie Draft Web"
5. Copy the `firebaseConfig` object

### 4. Environment Variables

Create `.env.local` in `movie-draft-app/`:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Note:** These are safe to commit - Firebase security is handled by database rules, not API keys.

### 5. Database Security Rules

Update Firebase Realtime Database rules:

```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": "!data.exists() || data.child('metadata/commissionerId').val() === auth.uid || newData.child('metadata/commissionerId').val() === auth.uid"
      }
    }
  }
}
```

**Simpler version (for MVP - no auth):**
```json
{
  "rules": {
    "sessions": {
      "$sessionId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

**Note:** For production, implement proper authentication. For MVP, we'll use session-based access control (first to create = commissioner).

---

## Code Structure

### New Files to Create

```
movie-draft-app/src/
├── config/
│   └── firebase.js              # Firebase initialization
├── hooks/
│   └── useSession.js            # Session management hook
├── context/
│   └── SessionContext.jsx      # Session context provider
└── utils/
    └── sessionUtils.js          # Session ID generation, URL helpers
```

### Files to Modify

```
movie-draft-app/src/
├── hooks/
│   └── useDraftState.js         # Add Firebase sync logic
├── components/
│   ├── SetupScreen.jsx          # Add host/join UI
│   ├── DraftBoard.jsx           # Add role-based controls
│   └── App.jsx                  # Add SessionContext provider
└── .env.local                    # Add Firebase config (gitignored)
```

---

## Implementation Details

### 1. Firebase Configuration (`config/firebase.js`)

```javascript
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

### 2. Session Utilities (`utils/sessionUtils.js`)

```javascript
/**
 * Generate a unique session ID
 * Format: 6-character alphanumeric (e.g., "a3f9k2")
 */
export function generateSessionId() {
  return Math.random().toString(36).substring(2, 8);
}

/**
 * Get session ID from URL query parameter
 */
export function getSessionIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('session');
}

/**
 * Create shareable session URL
 */
export function createSessionURL(sessionId) {
  const baseURL = window.location.origin + window.location.pathname;
  return `${baseURL}?session=${sessionId}`;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}
```

### 3. Session Hook (`hooks/useSession.js`)

**Interface:**
```typescript
interface UseSessionReturn {
  sessionId: string | null;
  userRole: 'commissioner' | 'viewer' | null;
  isConnected: boolean;
  isHosting: boolean;
  hostSession: () => Promise<string>;
  joinSession: (sessionId: string) => Promise<boolean>;
  leaveSession: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}
```

**Key Responsibilities:**
- Generate session IDs
- Manage session lifecycle (create/join/leave)
- Determine user role (first to join = commissioner)
- Track connection status
- Handle reconnection logic

**Implementation Notes:**
- Use Firebase `onValue` listener for real-time updates
- Store session ID in localStorage for persistence
- Check URL params on mount for join flow
- Generate unique user ID for role tracking

### 4. Session Context (`context/SessionContext.jsx`)

```javascript
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
```

### 5. Modified `useDraftState` Hook

**Changes Required:**

1. **Add session awareness:**
   ```javascript
   const { sessionId, userRole, isConnected } = useSessionContext();
   const isSessionMode = sessionId !== null;
   ```

2. **Conditional persistence:**
   - If `isSessionMode`: Write to Firebase, read from Firebase
   - Else: Use localStorage (existing behavior)

3. **Firebase sync logic:**
   ```javascript
   // On mount, if in session mode, subscribe to Firebase
   useEffect(() => {
     if (!isSessionMode) return;
     
     const sessionRef = ref(database, `sessions/${sessionId}/draftState`);
     
     // Listen for remote changes
     const unsubscribe = onValue(sessionRef, (snapshot) => {
       const remoteState = snapshot.val();
       if (remoteState && userRole === 'viewer') {
         // Update local state from Firebase
         dispatch({ type: 'SYNC_FROM_FIREBASE', payload: remoteState });
       }
     });
     
     return () => unsubscribe();
   }, [sessionId, isSessionMode, userRole]);
   
   // On state changes, if commissioner, write to Firebase
   useEffect(() => {
     if (!isSessionMode || userRole !== 'commissioner') return;
     
     const sessionRef = ref(database, `sessions/${sessionId}/draftState`);
     set(sessionRef, draftState);
   }, [draftState, sessionId, isSessionMode, userRole]);
   ```

4. **Add `userRole` to state:**
   ```javascript
   const draftState = {
     // ... existing state
     userRole: 'commissioner' | 'viewer' | null,
     sessionId: string | null,
   };
   ```

**Important:** Prevent infinite loops by:
- Only writing to Firebase when commissioner makes changes
- Only reading from Firebase when viewer receives updates
- Use debouncing for rapid state changes

### 6. Modified `SetupScreen.jsx`

**New UI Elements:**

```jsx
// Add to SetupScreen component
{session.isHosting ? (
  <div className="session-host-panel">
    <p>Session ID: <strong>{session.sessionId}</strong></p>
    <button onClick={handleCopyLink}>
      Copy Shareable Link
    </button>
  </div>
) : session.sessionId ? (
  <div className="session-viewer-panel">
    <p>Connected as Viewer</p>
    <button onClick={session.leaveSession}>Leave Session</button>
  </div>
) : (
  <div className="session-options">
    <button onClick={handleHostSession}>
      Host Session
    </button>
    <div className="join-session">
      <input 
        type="text" 
        placeholder="Enter Session ID"
        value={joinSessionId}
        onChange={(e) => setJoinSessionId(e.target.value)}
      />
      <button onClick={handleJoinSession}>
        Join Session
      </button>
    </div>
  </div>
)}
```

**Flow:**
1. User completes setup (members, categories)
2. User clicks "Host Session" → Creates session, shows link
3. OR user enters session ID → Joins as viewer
4. On join, redirect to draft board with session active

### 7. Modified `DraftBoard.jsx`

**Role-Based UI:**

```jsx
const { userRole } = useSessionContext();
const isViewer = userRole === 'viewer';

// Disable pick controls for viewers
<button 
  onClick={handlePick}
  disabled={isViewer}
  className={isViewer ? 'opacity-50 cursor-not-allowed' : ''}
>
  {isViewer ? 'View Only' : 'Pick Selected Movie'}
</button>

{isViewer && (
  <div className="viewer-notice">
    View Only - Commissioner makes picks
  </div>
)}
```

**Prevent Pick Actions:**
```javascript
const handlePick = () => {
  if (userRole === 'viewer') {
    // Show friendly message, don't allow pick
    alert('Viewers cannot make picks. Only the commissioner can make selections.');
    return;
  }
  // Existing pick logic
  makePick(selectedMovieId, selectedCategoryId);
};
```

### 8. Modified `App.jsx`

**Add Session Provider:**

```jsx
import { SessionProvider } from './context/SessionContext';

function App() {
  return (
    <SessionProvider>
      {/* Existing app content */}
    </SessionProvider>
  );
}
```

**Add Connection Status Indicator:**

```jsx
const { connectionStatus, sessionId } = useSessionContext();

{sessionId && (
  <div className="connection-status">
    {connectionStatus === 'connected' && '🟢 Connected'}
    {connectionStatus === 'connecting' && '🟡 Connecting...'}
    {connectionStatus === 'error' && '🔴 Connection Error'}
  </div>
)}
```

---

## Data Flow

### Session Creation Flow

```
1. User clicks "Host Session"
2. Generate session ID
3. Create Firebase entry: /sessions/{sessionId}/
4. Set metadata.commissionerId = generatedUserId
5. Set metadata.createdAt = timestamp
6. Store sessionId in localStorage
7. Show shareable link
```

### Join Session Flow

```
1. User enters session ID (or clicks link)
2. Check if session exists in Firebase
3. If exists:
   - Set userRole = 'viewer'
   - Subscribe to Firebase updates
   - Load current draft state
   - Redirect to draft board
4. If not exists:
   - Show error: "Session not found"
```

### Pick Flow (Commissioner)

```
1. Commissioner selects movie and category
2. Call makePick() (existing function)
3. Update local state (existing logic)
4. Write updated state to Firebase: /sessions/{sessionId}/draftState
5. Firebase broadcasts to all listeners
6. Viewers receive update and refresh UI
```

### Pick Flow (Viewer - Blocked)

```
1. Viewer attempts to interact with pick controls
2. Check userRole === 'viewer'
3. Show disabled UI / error message
4. Prevent state changes
```

---

## Error Handling

### Connection Errors

```javascript
// In useSession hook
try {
  const sessionRef = ref(database, `sessions/${sessionId}`);
  const unsubscribe = onValue(sessionRef, handleUpdate, (error) => {
    if (error) {
      setConnectionStatus('error');
      // Show user-friendly error message
      // Attempt reconnection after delay
    }
  });
} catch (error) {
  console.error('Firebase connection error:', error);
  setConnectionStatus('error');
}
```

### Reconnection Logic

```javascript
// Auto-reconnect on connection loss
useEffect(() => {
  if (connectionStatus === 'error' && sessionId) {
    const timeout = setTimeout(() => {
      joinSession(sessionId); // Retry connection
    }, 3000);
    return () => clearTimeout(timeout);
  }
}, [connectionStatus, sessionId]);
```

### Session Not Found

```javascript
// When joining session
const sessionRef = ref(database, `sessions/${sessionId}`);
const snapshot = await get(sessionRef);
if (!snapshot.exists()) {
  throw new Error('Session not found. Please check the session ID.');
}
```

---

## Testing Strategy

### Unit Tests

- `sessionUtils.js`: Session ID generation, URL parsing
- `useSession` hook: Session lifecycle, role assignment

### Integration Tests

- Session creation and joining
- State synchronization between commissioner and viewer
- Role-based access control

### Manual Testing Checklist

- [ ] Commissioner can create session
- [ ] Session link is shareable
- [ ] Viewer can join via link
- [ ] Viewer can join via session ID input
- [ ] Commissioner can make picks
- [ ] Viewers see picks in real-time (< 2 seconds)
- [ ] Viewers cannot make picks (controls disabled)
- [ ] Viewers can navigate all views
- [ ] Connection status shows correctly
- [ ] Reconnection works after connection loss
- [ ] Solo mode still works (no session)
- [ ] Session persists across page refresh

---

## Performance Considerations

### Firebase Read/Write Optimization

- **Debounce writes**: Don't write on every state change, batch updates
- **Selective sync**: Only sync draftState, not entire app state
- **Minimize listeners**: One listener per session, not per component

### State Update Optimization

- Use React.memo for components that don't need frequent updates
- Only update components when relevant state changes
- Avoid unnecessary re-renders from Firebase updates

---

## Security Considerations

### MVP (Current)

- Session IDs are guessable (6-char alphanumeric)
- No authentication required
- Anyone with session ID can join
- First to create session = commissioner

### Future Enhancements

- Add authentication (Firebase Auth)
- Use longer, more secure session IDs
- Implement proper role-based access control
- Add session expiration
- Add viewer limit

---

## Migration Path

### Backward Compatibility

- Solo mode (no session) must continue to work
- Existing localStorage-based drafts must not break
- Feature is opt-in (user chooses to host/join)

### Rollout Strategy

1. Deploy feature behind feature flag (optional)
2. Test with small group
3. Enable for all users
4. Monitor Firebase usage/quota

---

## Firebase Quota Limits (Free Tier)

- **Storage**: 1 GB
- **Bandwidth**: 10 GB/month
- **Simultaneous connections**: 100

**For 6 users drafting 36 picks:**
- Estimated data: ~50-100 KB per session
- Estimated bandwidth: ~1-2 MB per session
- Well within free tier limits

---

## Troubleshooting

### Common Issues

1. **"Firebase not initialized"**
   - Check environment variables are set
   - Verify firebase.js is imported correctly

2. **"Permission denied"**
   - Check database security rules
   - Verify session ID is correct

3. **"State not syncing"**
   - Check connection status
   - Verify userRole is set correctly
   - Check Firebase console for writes

4. **"Session not found"**
   - Verify session ID is correct
   - Check session hasn't expired
   - Verify Firebase database has the session

---

## Next Steps for Engineering

1. **Review this spec** and sprint plan
2. **Set up Firebase project** (follow Firebase Setup section)
3. **Create feature branch**: `feature/commissioner-mode`
4. **Implement in order:**
   - Firebase config
   - Session utilities
   - useSession hook
   - Session context
   - Modify useDraftState
   - Update UI components
5. **Test thoroughly** with multiple browsers/devices
6. **Deploy and test** on GitHub Pages

---

## Questions or Clarifications?

If anything is unclear, refer to:
- `COMMISSIONER_MODE_SPRINT_PLAN.md` for product requirements
- Firebase documentation: https://firebase.google.com/docs/database/web/start
- Existing codebase patterns in `useDraftState.js`

