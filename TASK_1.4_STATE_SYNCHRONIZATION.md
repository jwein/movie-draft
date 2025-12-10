# Task 1.4: State Synchronization

## Task Objective
Implement real-time state synchronization through Firebase so that when the commissioner makes picks, all viewers see the updates automatically within 2 seconds. This is the core functionality that enables the multi-user draft experience.

## Project Context

### Current State
- ✅ **Task 1.1 Complete:** Firebase configured
- ✅ **Task 1.2 Complete:** Session management system implemented
- ✅ **Task 1.3 Complete:** Role-based access control implemented
- ✅ **Draft State:** Currently uses localStorage only (via `useDraftState` hook)
- ✅ **Solo Mode:** Works perfectly with localStorage

### Target State
After this task:
- **Commissioner:** Makes picks → State updates locally → Writes to Firebase → Viewers receive updates
- **Viewers:** Receive Firebase updates → State updates automatically → UI refreshes in real-time
- **Solo Mode:** Continues to use localStorage (unchanged behavior)
- **Hybrid:** App detects session presence and switches sync mechanism automatically

### How This Fits Into Commissioner Mode
This is **Task 1.4** from the Commissioner Mode sprint plan. It enables:
- Real-time state synchronization (picks appear on all screens within 2 seconds)
- Automatic UI updates for viewers (no manual refresh)
- **Next:** Task 1.5 will polish UI/UX (connection status indicators, etc.)

## Relevant Files & Modules

### Files to Modify
1. **`movie-draft-app/src/hooks/useDraftState.js`** - Add Firebase sync logic (MAJOR CHANGES)
2. **`movie-draft-app/src/components/Navigation.jsx`** - Add connection status indicator (optional but recommended)
3. **`movie-draft-app/src/components/DraftBoard.jsx`** - May need minor adjustments for connection status

### Files to Review (For Context Only)
- `movie-draft-app/src/config/firebase.js` - Firebase database instance
- `movie-draft-app/src/context/SessionContext.jsx` - Provides `sessionId`, `userRole`, `connectionStatus`
- `movie-draft-app/src/hooks/useSession.js` - Session management (already implemented)
- `COMMISSIONER_MODE_TECH_SPEC.md` - Technical specification for state sync
- `COMMISSIONER_MODE_SPRINT_PLAN.md` - User Story 4 requirements

## Essential Documentation

### User Story 4: Real-Time State Synchronization (From Sprint Plan)

**As a** viewer  
**I want to** see picks update automatically on my screen  
**So that** I don't need to refresh to see the latest draft state

**Acceptance Criteria:**
- [ ] Picks made by commissioner appear on all viewer screens within 2 seconds
- [ ] Timer updates synchronize across all clients (optional - timer is local)
- [ ] Current picker indicator updates in real-time
- [ ] All views (Draft Board, Grid, Matrix, etc.) update simultaneously
- [ ] No manual refresh required for viewers

### Firebase Database Structure

```
/sessions/{sessionId}/
  - metadata: {
      createdAt: timestamp,
      commissionerId: "user-id",
      isActive: true
    }
  - draftState: {
      members: [...],
      picks: {...},
      currentPickIndex: 0,
      isSetupComplete: true,
      draftOrder: [...],
      picksOrder: [...],
      availableMovieIds: [...],
      currentCategoryIndex: 0,
      selectedCategoryId: null,
      isDraftComplete: false,
      // ... all other draft state except 'movies' (static data)
    }
```

**Important:** Do NOT sync the `movies` array (it's large and static). Always use the imported `moviesData` from `movies.json`.

## Implementation Details

### Critical Requirements

1. **Prevent Infinite Loops:**
   - Commissioner writes to Firebase → Firebase broadcasts → Viewers receive update
   - Viewers should NOT write to Firebase (they're read-only)
   - Commissioner should NOT update local state from Firebase (they're the source of truth)
   - Use flags or checks to prevent circular updates

2. **Maintain Solo Mode:**
   - If `sessionId === null`, use localStorage (existing behavior)
   - If `sessionId !== null`, use Firebase for sync
   - Solo mode must continue to work exactly as before

3. **State Structure:**
   - Sync all draft state except `movies` array
   - Always use local `moviesData` import for movie data
   - Preserve existing state structure

### 1. Modified useDraftState.js

**Key Changes:**

1. **Import Dependencies:**
```javascript
import { useReducer, useEffect, useCallback, useRef } from 'react';
import { ref, set, get, onValue, off } from 'firebase/database';
import { database, isFirebaseConfigured } from '../config/firebase';
import { useSessionContext } from '../context/SessionContext';
// ... existing imports
```

2. **Add Session Awareness:**
```javascript
export function useDraftState() {
  const { sessionId, userRole, isConnected } = useSessionContext();
  const isSessionMode = sessionId !== null && isFirebaseConfigured() && database;
  
  // ... existing reducer setup
  const [state, dispatch] = useReducer(draftReducer, null, loadState);
  
  // Ref to track if we're currently syncing from Firebase (prevent loops)
  const isSyncingFromFirebase = useRef(false);
  const isWritingToFirebase = useRef(false);
```

3. **Firebase Listener for Viewers (Read Updates):**
```javascript
// Subscribe to Firebase updates when in session mode as viewer
useEffect(() => {
  if (!isSessionMode || userRole !== 'viewer') {
    return;
  }
  
  const sessionRef = ref(database, `sessions/${sessionId}/draftState`);
  
  // Listen for remote changes
  const unsubscribe = onValue(sessionRef, (snapshot) => {
    if (!snapshot.exists()) {
      return;
    }
    
    const remoteState = snapshot.val();
    
    // Prevent infinite loops - don't update if we're writing
    if (isWritingToFirebase.current) {
      return;
    }
    
    // Set flag to prevent local updates from triggering Firebase writes
    isSyncingFromFirebase.current = true;
    
    try {
      // Merge remote state with local movies data
      const syncedState = {
        ...remoteState,
        movies: moviesData, // Always use local movies data
      };
      
      // Dispatch action to update state
      dispatch({ type: 'SYNC_FROM_FIREBASE', payload: syncedState });
    } catch (error) {
      console.error('Error syncing state from Firebase:', error);
    } finally {
      // Reset flag after a short delay to allow state to settle
      setTimeout(() => {
        isSyncingFromFirebase.current = false;
      }, 100);
    }
  }, (error) => {
    console.error('Firebase listener error:', error);
  });
  
  return () => {
    off(sessionRef);
  };
}, [sessionId, isSessionMode, userRole]);
```

4. **Firebase Writer for Commissioner (Write Updates):**
```javascript
// Write state to Firebase when commissioner makes changes
useEffect(() => {
  // Only write if:
  // - In session mode
  // - User is commissioner
  // - Not currently syncing from Firebase (prevent loops)
  // - Firebase is configured
  if (!isSessionMode || userRole !== 'commissioner' || isSyncingFromFirebase.current) {
    return;
  }
  
  // Don't write initial load (only write on changes)
  // Use a ref to track if this is the first render
  const isFirstRender = useRef(true);
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  
  const sessionRef = ref(database, `sessions/${sessionId}/draftState`);
  
  // Prepare state for Firebase (exclude movies array)
  const { movies, ...stateToSync } = state;
  
  // Set flag to prevent Firebase listener from updating local state
  isWritingToFirebase.current = true;
  
  set(sessionRef, stateToSync)
    .then(() => {
      // Reset flag after write completes
      setTimeout(() => {
        isWritingToFirebase.current = false;
      }, 100);
    })
    .catch((error) => {
      console.error('Error writing state to Firebase:', error);
      isWritingToFirebase.current = false;
    });
}, [state, sessionId, isSessionMode, userRole]);
```

**Important:** The above approach uses refs to prevent infinite loops. Alternative approach: debounce writes or use a more sophisticated sync mechanism.

5. **Initial State Load from Firebase:**
```javascript
// Load initial state from Firebase when joining session
useEffect(() => {
  if (!isSessionMode || !isConnected) {
    return;
  }
  
  const loadInitialState = async () => {
    try {
      const sessionRef = ref(database, `sessions/${sessionId}/draftState`);
      const snapshot = await get(sessionRef);
      
      if (snapshot.exists()) {
        const remoteState = snapshot.val();
        const syncedState = {
          ...remoteState,
          movies: moviesData, // Always use local movies data
        };
        
        // Only update if we don't have local state or if remote is more recent
        // For viewers, always use remote state
        // For commissioner, merge carefully (or use remote if joining existing session)
        if (userRole === 'viewer' || !state.isSetupComplete) {
          dispatch({ type: 'SYNC_FROM_FIREBASE', payload: syncedState });
        }
      }
    } catch (error) {
      console.error('Error loading initial state from Firebase:', error);
    }
  };
  
  loadInitialState();
}, [sessionId, isSessionMode, isConnected, userRole]);
```

6. **Modify saveState Function:**
```javascript
// Update saveState to conditionally use Firebase or localStorage
function saveState(state, sessionId, userRole, isSessionMode) {
  try {
    const { movies, ...stateToSave } = state;
    
    if (isSessionMode && userRole === 'commissioner') {
      // Write to Firebase (handled by useEffect above)
      // Don't write here to avoid duplicate writes
      return;
    }
    
    // Use localStorage for solo mode or if Firebase not available
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Failed to save draft state:', e);
  }
}
```

7. **Add SYNC_FROM_FIREBASE Action:**
```javascript
// Add to ACTIONS constant
const ACTIONS = {
  // ... existing actions
  SYNC_FROM_FIREBASE: 'SYNC_FROM_FIREBASE',
};

// Add to reducer
function draftReducer(state, action) {
  switch (action.type) {
    // ... existing cases
    
    case ACTIONS.SYNC_FROM_FIREBASE: {
      const remoteState = action.payload;
      // Merge with local movies data
      return {
        ...remoteState,
        movies: moviesData, // Always use local movies
      };
    }
    
    // ... rest of cases
  }
}
```

8. **Update saveState Call:**
```javascript
// In useDraftState hook, update the saveState call
useEffect(() => {
  // Only save to localStorage if not in session mode
  // Firebase writes are handled by separate useEffect
  if (!isSessionMode) {
    saveState(state, sessionId, userRole, isSessionMode);
  }
}, [state, isSessionMode]);
```

### 2. Connection Status Indicator (Optional but Recommended)

**In Navigation.jsx:**
```javascript
import { useSessionContext } from '../context/SessionContext';

// Inside component:
const { connectionStatus, sessionId } = useSessionContext();

// Add connection status indicator
{sessionId && (
  <div className="flex items-center gap-2">
    {connectionStatus === 'connected' && (
      <span className="text-xs text-forest">🟢 Connected</span>
    )}
    {connectionStatus === 'connecting' && (
      <span className="text-xs text-gold">🟡 Connecting...</span>
    )}
    {connectionStatus === 'error' && (
      <span className="text-xs text-burgundy">🔴 Connection Error</span>
    )}
  </div>
)}
```

## Acceptance Criteria

1. ✅ Commissioner makes pick → State updates locally → Writes to Firebase
2. ✅ Viewer receives Firebase update → State updates automatically → UI refreshes
3. ✅ Picks appear on viewer screens within 2 seconds
4. ✅ Current picker indicator updates in real-time for all users
5. ✅ All views (Draft Board, Grid, Matrix, etc.) update simultaneously
6. ✅ No manual refresh required for viewers
7. ✅ Solo mode continues to work (localStorage, no Firebase)
8. ✅ Initial state loads from Firebase when joining session
9. ✅ No infinite loops (commissioner writes, viewers read)
10. ✅ Connection status indicator visible (optional but recommended)
11. ✅ Error handling for Firebase connection failures
12. ✅ State structure preserved (all fields except movies array)

## Testing Instructions

### Manual Testing Checklist

1. **Commissioner Flow:**
   - [ ] Host a session
   - [ ] Start draft (setup complete)
   - [ ] Make a pick
   - [ ] Verify state writes to Firebase (check Firebase Console)
   - [ ] Verify local state updates correctly

2. **Viewer Flow:**
   - [ ] Join session as viewer
   - [ ] Verify initial state loads from Firebase
   - [ ] Watch commissioner make a pick
   - [ ] Verify pick appears on viewer screen within 2 seconds
   - [ ] Verify current picker indicator updates
   - [ ] Verify all views update (Draft Board, Grid, Matrix, etc.)
   - [ ] Verify no manual refresh needed

3. **Real-Time Sync:**
   - [ ] Commissioner makes multiple picks rapidly
   - [ ] Verify all picks appear on viewer screens
   - [ ] Verify no duplicate picks
   - [ ] Verify state remains consistent

4. **Solo Mode:**
   - [ ] No session active
   - [ ] Make picks
   - [ ] Verify localStorage saves correctly
   - [ ] Verify no Firebase writes
   - [ ] Verify app works exactly as before

5. **Error Handling:**
   - [ ] Disconnect Firebase (disable network)
   - [ ] Verify error handling (connection status shows error)
   - [ ] Reconnect
   - [ ] Verify state syncs correctly

6. **Edge Cases:**
   - [ ] Commissioner and viewer join simultaneously
   - [ ] Viewer joins mid-draft
   - [ ] Multiple viewers join
   - [ ] Commissioner refreshes page (state should persist)

### Browser Console Checks
- [ ] No infinite loop warnings
- [ ] No Firebase permission errors
- [ ] No state corruption errors
- [ ] Connection status updates correctly

### Firebase Console Checks
- [ ] `/sessions/{sessionId}/draftState` updates when commissioner makes picks
- [ ] State structure is correct (no movies array)
- [ ] No duplicate writes

## Expected Output

### Files Modified
- `movie-draft-app/src/hooks/useDraftState.js` (MAJOR CHANGES)
- `movie-draft-app/src/components/Navigation.jsx` (connection status indicator)

### Deliverables

1. **Summary of Changes:**
   - List all files modified
   - Describe Firebase sync logic
   - Note any deviations from spec and why

2. **Implementation Notes:**
   - How infinite loops are prevented
   - How initial state loading works
   - How solo mode is preserved
   - Any edge cases handled

3. **Testing Results:**
   - Confirmation of all acceptance criteria
   - Real-time sync timing (should be < 2 seconds)
   - Any issues encountered

4. **Screenshots/Videos (Optional but Helpful):**
   - Commissioner making pick
   - Viewer screen updating automatically
   - Connection status indicator

## Notes & Considerations

### Critical Implementation Notes

1. **Infinite Loop Prevention:**
   - Use refs (`isSyncingFromFirebase`, `isWritingToFirebase`) to track sync state
   - Commissioner writes → Set flag → Firebase broadcasts → Viewers read (flag prevents write back)
   - Viewers read → Set flag → Update local state (flag prevents triggering write)

2. **State Merging:**
   - Always use local `moviesData` import (never sync movies array)
   - Merge remote state with local movies data
   - Preserve all other state fields

3. **Initial Load:**
   - When viewer joins, load state from Firebase
   - When commissioner joins existing session, may need to load or merge
   - Handle case where Firebase state doesn't exist yet

4. **Debouncing (Optional):**
   - Consider debouncing rapid state changes (e.g., typing in search)
   - Only sync significant state changes (picks, setup completion)
   - Firebase Realtime Database handles rapid updates well, but debouncing can help

### Important Reminders
- **Do NOT sync movies array** - It's large and static
- **Solo mode must continue to work** - localStorage fallback
- **Prevent infinite loops** - Use flags/refs
- **Handle errors gracefully** - Firebase connection failures

### Future Tasks (Not This One)
- **Task 1.5:** UI/UX Polish (may enhance connection status indicator)

### Performance Considerations
- Firebase Realtime Database is efficient for this use case
- State updates are small (excluding movies array)
- 6 concurrent users is well within Firebase free tier limits

## Questions to Resolve
If you encounter issues or need clarification:
- How to handle state conflicts? (Recommendation: Last write wins, commissioner is source of truth)
- Should timer sync? (Recommendation: No, timer is local to each client)
- How to handle rapid state changes? (Recommendation: Firebase handles well, but can debounce if needed)

## Next Steps (After This Task)
Once this task is complete and reviewed, the next task will be:
**Task 1.5: UI/UX Polish** - Final polish for session indicators and connection status.

---

**Task Status:** Ready for Assignment  
**Estimated Time:** 6 hours (Most complex task)  
**Priority:** Critical (Core functionality)  
**Dependencies:** Task 1.1 ✅, Task 1.2 ✅, Task 1.3 ✅ Complete

