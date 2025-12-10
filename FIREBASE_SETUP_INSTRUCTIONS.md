# Firebase Setup Instructions

## Quick Setup Guide

### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** (or "Create a project")
3. Enter project name: `movie-draft` (or your preference)
4. Click **Continue**
5. **Disable Google Analytics** (optional - not needed for MVP)
6. Click **Create project**
7. Wait for project to be created, then click **Continue**

### Step 2: Create Realtime Database

1. In the Firebase Console, click **"Realtime Database"** in the left sidebar
2. Click **"Create Database"**
3. Choose a location (pick closest to you):
   - `us-central1` (Iowa, USA)
   - `us-east1` (South Carolina, USA)
   - Or any other region
4. Click **Next**
5. **Start in test mode** (we'll update rules later)
6. Click **Enable**

### Step 3: Get Configuration Values

1. Click the **gear icon** (⚙️) next to "Project Overview" in the left sidebar
2. Click **"Project settings"**
3. Scroll down to **"Your apps"** section
4. Click the **web icon** (`</>`)
5. Register app:
   - App nickname: `Movie Draft Web`
   - Firebase Hosting: **Don't set up** (we're using GitHub Pages)
   - Click **"Register app"**
6. **Copy the `firebaseConfig` object** - it looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "movie-draft-xxxxx.firebaseapp.com",
  databaseURL: "https://movie-draft-xxxxx-default-rtdb.firebaseio.com",
  projectId: "movie-draft-xxxxx",
  storageBucket: "movie-draft-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
};
```

### Step 4: Update .env.local File

1. Open `/movie-draft-app/.env.local`
2. Replace the placeholder values with your actual Firebase config:

```env
VITE_FIREBASE_API_KEY=AIzaSyC... (your actual apiKey)
VITE_FIREBASE_AUTH_DOMAIN=movie-draft-xxxxx.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://movie-draft-xxxxx-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=movie-draft-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=movie-draft-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

**Important:** 
- Copy the values EXACTLY as they appear in Firebase Console
- Don't include quotes around the values
- The `databaseURL` should start with `https://` and end with `.firebaseio.com`

### Step 5: Update Database Security Rules

1. In Firebase Console, go to **Realtime Database**
2. Click the **"Rules"** tab
3. Replace the rules with:

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

4. Click **"Publish"**

**Note:** These rules allow anyone to read/write sessions. For MVP this is fine since session IDs are random. For production, you'd want to add authentication.

### Step 6: Restart Dev Server

After updating `.env.local`, you MUST restart the dev server:

1. Stop the current dev server (Ctrl+C)
2. Start it again:
   ```bash
   cd movie-draft-app
   npm run dev
   ```

**Why?** Vite only reads environment variables when the server starts.

### Step 7: Test

1. Open `http://localhost:5173`
2. Complete setup
3. Click **"Host Session"**
4. Should work without errors!

---

## Troubleshooting

### "Firebase error. Please ensure that you have the URL..."

**Problem:** Environment variables not loaded or incorrect

**Solutions:**
1. Check `.env.local` has correct values (no quotes, correct format)
2. Restart dev server after changing `.env.local`
3. Check that file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
4. Verify `databaseURL` matches what's in Firebase Console

### "Permission denied"

**Problem:** Database rules not set correctly

**Solutions:**
1. Go to Firebase Console > Realtime Database > Rules
2. Make sure rules allow read/write to `/sessions`
3. Click "Publish" after updating rules

### Environment variables not working

**Check:**
1. File is in `movie-draft-app/` directory (not parent directory)
2. File is named `.env.local` (not `.env`)
3. Variables start with `VITE_`
4. No spaces around `=` sign
5. Restarted dev server after changes

---

## Quick Reference

**Firebase Console:** https://console.firebase.google.com/

**Your Database URL format:**
```
https://[project-id]-default-rtdb.[region].firebaseio.com
```

**Example:**
```
https://movie-draft-abc123-default-rtdb.us-central1.firebaseio.com
```

---

## Next Steps After Setup

Once Firebase is configured:
1. ✅ Test "Host Session" button
2. ✅ Test joining a session
3. ✅ Test real-time synchronization
4. ✅ Deploy to GitHub Pages (env vars need to be set there too)

