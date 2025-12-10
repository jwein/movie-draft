# Task 1.1: Firebase Setup & Configuration

## Task Objective
Set up Firebase Realtime Database integration for the Movie Draft app. This is the foundation for Commissioner Mode, which will enable real-time multi-user draft sessions.

## Project Context

### Current State
The Movie Draft app is a working single-user application deployed to GitHub Pages. It allows one operator to run a fantasy movie draft for 6 friends, selecting movies into 6 categories from a pool of 100 films. The app uses:
- **React 19** with Vite
- **Tailwind CSS** for styling
- **localStorage** for state persistence (via `useDraftState` hook)
- **Snake draft** logic: 6 members × 6 categories = 36 picks total

### Target State
After this task, the app will have Firebase configured and ready to use, but **solo mode (localStorage) will continue to work unchanged**. Firebase integration will be opt-in via session management (implemented in later tasks).

### How This Fits Into Commissioner Mode
This task is **Task 1.1** from the Commissioner Mode sprint plan. It establishes the infrastructure needed for:
- Real-time state synchronization between commissioner and viewers
- Session management (creating/joining draft sessions)
- Role-based access control (commissioner vs viewer)

## Relevant Files & Modules

### Files to Create
1. **`movie-draft-app/src/config/firebase.js`** - Firebase initialization and configuration
2. **`movie-draft-app/.env.local`** - Environment variables for Firebase config (gitignored)

### Files to Modify
1. **`movie-draft-app/package.json`** - Add Firebase dependency

### Files to Review (For Context Only)
- `movie-draft-app/src/hooks/useDraftState.js` - Current state management (will be modified in Task 1.4)
- `COMMISSIONER_MODE_TECH_SPEC.md` - Technical specification for Firebase setup
- `COMMISSIONER_MODE_SPRINT_PLAN.md` - Overall sprint plan and requirements

## Essential Documentation

### Firebase Setup Steps (From Tech Spec)
1. Create Firebase project at https://console.firebase.google.com/
2. Create Realtime Database (start in test mode)
3. Get Firebase configuration from Project Settings
4. Set up environment variables
5. Configure database security rules

### Database Structure (For Reference)
```
/sessions/{sessionId}/
  - draftState: { ... }
  - metadata: {
      createdAt: timestamp,
      commissionerId: "user-id",
      isActive: true
    }
```

## Implementation Details

### 1. Install Firebase Package
Add Firebase SDK to `package.json`:
```json
{
  "dependencies": {
    "firebase": "^10.7.0"
  }
}
```

Run: `npm install firebase` in `movie-draft-app/` directory

### 2. Create Firebase Configuration File
Create `movie-draft-app/src/config/firebase.js`:

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
```

**Important Notes:**
- Use `import.meta.env` (Vite's environment variable syntax)
- Export `database` for use in other modules
- Handle missing config gracefully (for solo mode)

### 3. Create Environment Variables File
Create `movie-draft-app/.env.local`:

```env
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

**Important Notes:**
- This file should already be in `.gitignore` (check `movie-draft-app/.gitignore`)
- Use placeholder values initially - actual values will come from Firebase Console
- All variables must be prefixed with `VITE_` for Vite to expose them

### 4. Verify .gitignore
Ensure `.env.local` is in `.gitignore`. The existing `.gitignore` should already include:
```
*.local
.env
.env.local
.env.*.local
```

### 5. Firebase Database Security Rules
In Firebase Console → Realtime Database → Rules, set:

**For MVP (Simple - No Auth):**
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

**Note:** This allows anyone with a session ID to read/write. For MVP, this is acceptable. Future tasks will add proper authentication.

### 6. Add Error Handling
Update `firebase.js` to handle missing configuration gracefully:

```javascript
// Check if Firebase config is available
const isFirebaseConfigured = () => {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_DATABASE_URL
  );
};

export { database, isFirebaseConfigured };
```

This allows the app to work in solo mode even if Firebase isn't configured.

## Acceptance Criteria

1. ✅ Firebase package is installed in `package.json` (version ^10.7.0)
2. ✅ `src/config/firebase.js` exists and exports `database` and `isFirebaseConfigured`
3. ✅ `.env.local` file exists with all required `VITE_*` environment variables (can use placeholders)
4. ✅ `.env.local` is in `.gitignore` (verify it's not tracked)
5. ✅ Firebase initialization code uses `import.meta.env` correctly
6. ✅ Code handles missing Firebase config gracefully (no crashes if env vars are missing)
7. ✅ Firebase Realtime Database is created in Firebase Console
8. ✅ Database security rules are set (simple read/write for MVP)
9. ✅ App still runs in solo mode (localStorage) when Firebase is not configured
10. ✅ No console errors when running `npm run dev`

## Testing Instructions

### Manual Testing
1. **Without Firebase Config:**
   - Remove or comment out Firebase env vars in `.env.local`
   - Run `npm run dev`
   - App should load normally (solo mode)
   - No console errors related to Firebase

2. **With Firebase Config:**
   - Add actual Firebase config values to `.env.local`
   - Run `npm run dev`
   - Import `database` in a test component and verify it's not null
   - Check browser console for Firebase initialization messages

3. **Build Test:**
   - Run `npm run build`
   - Verify build succeeds without errors
   - Environment variables should be embedded in build

### Verification Checklist
- [ ] `npm install` completes successfully
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes successfully
- [ ] Firebase database is accessible in Firebase Console
- [ ] Database rules are set correctly
- [ ] `.env.local` is not committed to git

## Expected Output

### Files Created
- `movie-draft-app/src/config/firebase.js`
- `movie-draft-app/.env.local` (gitignored)

### Files Modified
- `movie-draft-app/package.json` (Firebase dependency added)

### Deliverables
1. **Summary of Changes:**
   - List all files created/modified
   - Note any deviations from spec and why

2. **Firebase Setup Notes:**
   - Firebase project name
   - Database URL
   - Any issues encountered during setup

3. **Testing Results:**
   - Confirmation that app runs in solo mode
   - Confirmation that Firebase initializes when configured
   - Any warnings or errors encountered

## Notes & Considerations

### Important Reminders
- **Do NOT modify `useDraftState.js` yet** - that's Task 1.4
- **Do NOT create session management yet** - that's Task 1.2
- **Solo mode must continue to work** - Firebase is opt-in
- **Environment variables must use `VITE_` prefix** for Vite to expose them

### Future Tasks (Not This One)
- Task 1.2: Session Management System
- Task 1.3: Role-Based Access Control
- Task 1.4: State Synchronization (will modify `useDraftState.js`)

### Questions to Resolve
If you encounter issues or need clarification:
- Firebase project setup questions
- Environment variable configuration
- Database rules configuration
- Build/deployment considerations

## Next Steps (After This Task)
Once this task is complete and reviewed, the next task will be:
**Task 1.2: Session Management System** - Creating the `useSession` hook and session lifecycle management.

---

**Task Status:** Ready for Assignment  
**Estimated Time:** 2 hours  
**Priority:** High (Foundation for all subsequent tasks)

