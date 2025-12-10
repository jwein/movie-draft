# Task 1.2: Session Management System

## Task Objective
Implement the session management system that enables users to create and join draft sessions. This establishes the foundation for multi-user functionality, allowing a commissioner to host a session and viewers to join via a shareable link.

## Project Context

### Current State
- ✅ **Task 1.1 Complete:** Firebase is configured and ready to use
- ✅ **Solo Mode:** App works with localStorage (must continue to work)
- ✅ **Setup Screen:** Users can configure members and start a draft
- ✅ **Draft Flow:** Full drafting functionality exists for single user

### Target State
After this task:
- Users can **host a session** from the setup screen (generates session ID and shareable link)
- Users can **join a session** via session ID or URL parameter
- Session state is stored in Firebase (but draft state sync comes in Task 1.4)
- Session ID persists across page refreshes
- URL-based joining works (e.g., `?session=abc123`)

### How This Fits Into Commissioner Mode
This is **Task 1.2** from the Commissioner Mode sprint plan. It enables:
- Session creation and joining (foundation for multi-user)
- Session persistence in Firebase
- URL-based session sharing
- **Next:** Task 1.3 will add role-based access control
- **Then:** Task 1.4 will sync draft state through Firebase

## Relevant Files & Modules

### Files to Create
1. **`movie-draft-app/src/utils/sessionUtils.js`** - Session ID generation, URL helpers, clipboard
2. **`movie-draft-app/src/hooks/useSession.js`** - Session lifecycle management hook
3. **`movie-draft-app/src/context/SessionContext.jsx`** - React context provider for session state

### Files to Modify
1. **`movie-draft-app/src/components/SetupScreen.jsx`** - Add "Host Session" and "Join Session" UI
2. **`movie-draft-app/src/App.jsx`** - Wrap app with SessionProvider

### Files to Review (For Context Only)
- `movie-draft-app/src/config/firebase.js` - Firebase database instance (Task 1.1)
- `movie-draft-app/src/hooks/useDraftState.js` - Current state management (will be modified in Task 1.4)
- `COMMISSIONER_MODE_TECH_SPEC.md` - Technical specification for session management
- `COMMISSIONER_MODE_SPRINT_PLAN.md` - User stories and acceptance criteria

## Essential Documentation

### Session Management Requirements (From Sprint Plan)
**User Story 1: Commissioner Role Setup**
- Commissioner can start a "Host Session" from the setup screen
- System generates a unique session ID and shareable link
- Link can be copied to clipboard with one click
- Session persists across page refreshes for commissioner
- Clear visual indicator shows "Hosting Session" status

**User Story 2: Viewer Join Experience**
- Viewers can enter session ID or click shared link
- Viewers see a "Joining..." state while connecting
- Viewers are automatically redirected to draft board once connected
- Viewers see current draft state immediately upon joining
- Error message shown if session ID is invalid or expired

### Firebase Database Structure
```
/sessions/{sessionId}/
  - metadata: {
      createdAt: timestamp,
      commissionerId: "user-id",  // Generated unique ID for first user
      isActive: true
    }
  - draftState: { ... }  // Will be added in Task 1.4
```

**Note:** For this task, we only create the `metadata` object. `draftState` will be added in Task 1.4.

## Implementation Details

### 1. Session Utilities (`utils/sessionUtils.js`)

Create helper functions for session management:

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

/**
 * Generate a unique user ID for role tracking
 * Format: 8-character alphanumeric
 */
export function generateUserId() {
  return Math.random().toString(36).substring(2, 10);
}
```

### 2. Session Hook (`hooks/useSession.js`)

Create the core session management hook with this interface:

```typescript
interface UseSessionReturn {
  sessionId: string | null;
  userRole: 'commissioner' | 'viewer' | null;
  isConnected: boolean;
  isHosting: boolean;
  hostSession: () => Promise<string>;  // Returns sessionId
  joinSession: (sessionId: string) => Promise<boolean>;  // Returns success
  leaveSession: () => void;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}
```

**Key Implementation Requirements:**

1. **State Management:**
   - Track `sessionId`, `userRole`, `connectionStatus`
   - Store `sessionId` in localStorage for persistence
   - Generate and store `userId` in localStorage (for role tracking)

2. **Host Session (`hostSession`):**
   - Generate new session ID
   - Generate unique user ID (store in localStorage)
   - Check if Firebase is configured (use `isFirebaseConfigured()` from `firebase.js`)
   - If Firebase available:
     - Create session in Firebase: `/sessions/{sessionId}/metadata`
     - Set `commissionerId` to generated userId
     - Set `createdAt` to current timestamp
     - Set `isActive: true`
   - If Firebase not available:
     - Still create session (store in localStorage only)
     - Show warning that real-time sync won't work
   - Store sessionId in localStorage
   - Set `userRole = 'commissioner'`
   - Set `connectionStatus = 'connected'`
   - Return sessionId

3. **Join Session (`joinSession`):**
   - Set `connectionStatus = 'connecting'`
   - Check if Firebase is configured
   - If Firebase available:
     - Check if session exists in Firebase
     - If exists:
       - Read `metadata.commissionerId`
       - Generate/retrieve userId from localStorage
       - If userId === commissionerId: `userRole = 'commissioner'`
       - Else: `userRole = 'viewer'`
       - Store sessionId in localStorage
       - Set `connectionStatus = 'connected'`
       - Return `true`
     - If not exists:
       - Set `connectionStatus = 'error'`
       - Return `false`
   - If Firebase not available:
     - Check localStorage for session (fallback)
     - If found: join as viewer
     - If not found: return `false`

4. **Leave Session (`leaveSession`):**
   - Clear sessionId from localStorage
   - Reset all session state
   - Set `connectionStatus = 'disconnected'`
   - Clear userId (optional - can keep for rejoin)

5. **URL Parameter Handling:**
   - On mount, check for `?session=xxx` in URL
   - If found, automatically call `joinSession(sessionId)`
   - Clear URL parameter after joining (optional - for cleaner URLs)

6. **Persistence:**
   - On mount, check localStorage for existing sessionId
   - If found and Firebase available, verify session still exists
   - If valid, restore session state
   - If invalid, clear localStorage

**Firebase Operations:**
```javascript
import { ref, set, get } from 'firebase/database';
import { database, isFirebaseConfigured } from '../config/firebase';

// Create session
const sessionRef = ref(database, `sessions/${sessionId}/metadata`);
await set(sessionRef, {
  createdAt: Date.now(),
  commissionerId: userId,
  isActive: true
});

// Check if session exists
const sessionRef = ref(database, `sessions/${sessionId}/metadata`);
const snapshot = await get(sessionRef);
if (snapshot.exists()) {
  const metadata = snapshot.val();
  // Use metadata.commissionerId to determine role
}
```

### 3. Session Context (`context/SessionContext.jsx`)

Create React context to provide session state throughout the app:

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

### 4. Modified SetupScreen (`components/SetupScreen.jsx`)

Add session management UI. The screen should show different states:

**State 1: No Session (Default)**
- Show existing member name inputs
- Show "Randomize Order" button
- Show "Begin Draft" button (existing)
- **NEW:** Add "Host Session" button
- **NEW:** Add "Join Session" section with:
  - Input field for session ID
  - "Join Session" button

**State 2: Hosting Session**
- Show "Session ID: {sessionId}" (prominent display)
- Show shareable link (read-only input or display)
- "Copy Link" button (uses `copyToClipboard` from sessionUtils)
- Show "Hosting Session" indicator/badge
- Show "Leave Session" button
- Keep existing member inputs and "Begin Draft" button

**State 3: Joined as Viewer**
- Show "Connected as Viewer" indicator
- Show session ID
- Show "Leave Session" button
- **Note:** For viewers, setup should still be accessible (they'll see the draft once it starts)

**Implementation Notes:**
- Use `useSessionContext()` to access session state
- Call `hostSession()` when "Host Session" is clicked
- Call `joinSession(sessionId)` when "Join Session" is clicked
- Show loading state while `connectionStatus === 'connecting'`
- Show error message if `connectionStatus === 'error'`
- Handle `copyToClipboard` with user feedback (toast or alert)

**UI Placement:**
- Add session controls above or below the member inputs section
- Use clear visual separation (border, background color)
- Match existing design system (Tailwind classes)

### 5. Modified App.jsx

Wrap the entire app with SessionProvider:

```javascript
import { SessionProvider } from './context/SessionContext';

function App() {
  return (
    <SessionProvider>
      {/* Existing app content */}
    </SessionProvider>
  );
}
```

**Important:** SessionProvider must wrap everything so all components can access session context.

## Acceptance Criteria

1. ✅ `sessionUtils.js` exists with all helper functions (generateSessionId, getSessionIdFromURL, createSessionURL, copyToClipboard, generateUserId)
2. ✅ `useSession.js` hook exists and implements the full interface
3. ✅ `SessionContext.jsx` exists and provides session state to app
4. ✅ `App.jsx` wraps app with SessionProvider
5. ✅ SetupScreen shows "Host Session" button when no session active
6. ✅ Clicking "Host Session" creates session in Firebase (if configured) and shows session ID
7. ✅ Shareable link is displayed and can be copied to clipboard
8. ✅ Session ID persists across page refresh (stored in localStorage)
9. ✅ SetupScreen shows "Join Session" input and button
10. ✅ Joining with valid session ID connects successfully
11. ✅ Joining with invalid session ID shows error message
12. ✅ URL parameter `?session=xxx` automatically joins session on page load
13. ✅ "Leave Session" button clears session and returns to solo mode
14. ✅ Solo mode still works when no session is active
15. ✅ App handles Firebase not being configured gracefully (shows warning, still creates session locally)

## Testing Instructions

### Manual Testing Checklist

1. **Host Session Flow:**
   - [ ] Click "Host Session" button
   - [ ] Session ID is generated and displayed
   - [ ] Shareable link is shown
   - [ ] "Copy Link" button copies link to clipboard
   - [ ] Session persists after page refresh
   - [ ] "Hosting Session" indicator is visible

2. **Join Session Flow:**
   - [ ] Enter valid session ID and click "Join Session"
   - [ ] Connection status shows "connecting" then "connected"
   - [ ] Session ID is stored in localStorage
   - [ ] Can join via URL parameter `?session=abc123`
   - [ ] Invalid session ID shows error message

3. **Leave Session:**
   - [ ] Click "Leave Session" button
   - [ ] Session state is cleared
   - [ ] Returns to solo mode
   - [ ] Can host/join again

4. **Persistence:**
   - [ ] Host session, refresh page → session restored
   - [ ] Join session, refresh page → session restored
   - [ ] Leave session, refresh page → no session

5. **Firebase Integration:**
   - [ ] With Firebase configured: session created in Firebase Console
   - [ ] With Firebase not configured: session still works (localStorage only)
   - [ ] Warning shown when Firebase not available

6. **Solo Mode Compatibility:**
   - [ ] Without session: app works exactly as before
   - [ ] Can complete setup and start draft without session
   - [ ] No breaking changes to existing functionality

### Browser Console Checks
- [ ] No errors when hosting session
- [ ] No errors when joining session
- [ ] No errors when leaving session
- [ ] Firebase operations log appropriately (if configured)

## Expected Output

### Files Created
- `movie-draft-app/src/utils/sessionUtils.js`
- `movie-draft-app/src/hooks/useSession.js`
- `movie-draft-app/src/context/SessionContext.jsx`

### Files Modified
- `movie-draft-app/src/components/SetupScreen.jsx`
- `movie-draft-app/src/App.jsx`

### Deliverables

1. **Summary of Changes:**
   - List all files created/modified
   - Note any deviations from spec and why

2. **Implementation Notes:**
   - How session persistence works
   - How role detection works (for Task 1.3 reference)
   - Any edge cases handled

3. **Testing Results:**
   - Confirmation of all acceptance criteria
   - Any issues encountered
   - Browser compatibility notes

4. **Screenshots (Optional but Helpful):**
   - SetupScreen with "Host Session" button
   - SetupScreen showing session ID and shareable link
   - SetupScreen with "Join Session" input
   - Error state for invalid session ID

## Notes & Considerations

### Important Reminders
- **Do NOT modify `useDraftState.js` yet** - that's Task 1.4
- **Do NOT add role-based UI restrictions yet** - that's Task 1.3
- **Solo mode must continue to work** - session is opt-in
- **Firebase is optional** - app should work without it (with limitations)

### Role Detection Logic (For Task 1.3 Reference)
- First user to create session = commissioner (stored as `commissionerId`)
- All other users = viewers
- User ID is generated and stored in localStorage
- Comparison: `userId === metadata.commissionerId` → commissioner

### Future Tasks (Not This One)
- **Task 1.3:** Role-Based Access Control (will use `userRole` from this task)
- **Task 1.4:** State Synchronization (will use sessionId to sync draft state)
- **Task 1.5:** UI/UX Polish (will enhance session indicators)

### Error Handling
- Invalid session ID: Show user-friendly error message
- Firebase connection failure: Show warning, fall back to localStorage
- Network issues: Set `connectionStatus = 'error'`, allow retry

### Security Notes (MVP)
- Session IDs are 6 characters (guessable but acceptable for MVP)
- No authentication required (anyone with session ID can join)
- Future: Add authentication and longer session IDs

## Questions to Resolve
If you encounter issues or need clarification:
- Session ID collision handling
- Session expiration logic (optional for MVP)
- Multiple tabs with same session
- Firebase quota considerations

## Next Steps (After This Task)
Once this task is complete and reviewed, the next task will be:
**Task 1.3: Role-Based Access Control** - Using the `userRole` from this task to restrict pick controls.

---

**Task Status:** Ready for Assignment  
**Estimated Time:** 4 hours  
**Priority:** High (Foundation for multi-user functionality)  
**Dependencies:** Task 1.1 (Firebase Setup) ✅ Complete

