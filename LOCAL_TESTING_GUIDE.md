# Local Testing Guide - Commissioner Mode

## Quick Answer: Yes! Different Browsers Work Perfectly

You can absolutely test as commissioner in Chrome and viewer in Firefox (or vice versa). This is actually the **best way** to test locally since:
- Each browser has separate localStorage
- Each browser has separate session state
- Simulates real multi-user scenario
- Easy to see real-time updates

---

## Testing Setup Options

### Option 1: Different Browsers (Recommended)
- **Chrome**: Commissioner (makes picks)
- **Firefox**: Viewer (watches picks)

### Option 2: Same Browser, Different Profiles
- **Chrome Profile 1**: Commissioner
- **Chrome Profile 2**: Viewer (or Incognito)

### Option 3: Multiple Devices
- **Laptop**: Commissioner
- **Phone/Tablet**: Viewer (on same WiFi)

### Option 4: Incognito Windows
- **Normal Chrome**: Commissioner
- **Incognito Chrome**: Viewer

---

## Step-by-Step Testing Process

### Prerequisites

1. **Start the dev server:**
   ```bash
   cd movie-draft-app
   npm run dev
   ```

2. **Note the local URL:**
   - Usually: `http://localhost:5173`
   - If using `--host` flag: `http://192.168.x.x:5173` (your local IP)

### Test Scenario 1: Basic Host/Join Flow

#### Step 1: Commissioner Setup (Chrome)

1. Open Chrome
2. Navigate to `http://localhost:5173`
3. Complete setup:
   - Add member names
   - Set categories
   - Click **"Host Session"** button
4. **Copy the session link** (or note the session ID)
5. You should see:
   - "Hosting Session" indicator
   - Session ID displayed
   - Shareable link

#### Step 2: Viewer Join (Firefox)

1. Open Firefox
2. Navigate to the **same URL**: `http://localhost:5173`
3. You have two options:

   **Option A: Use the shareable link**
   - Paste the link from Chrome into Firefox address bar
   - Should automatically join as viewer

   **Option B: Manual join**
   - Click "Join Session" button
   - Enter the session ID from Chrome
   - Click "Join"

4. You should see:
   - "Connected as Viewer" indicator
   - Current draft state (if commissioner has started)
   - Draft board view

#### Step 3: Test Real-Time Sync

1. **In Chrome (Commissioner):**
   - Make a pick (select movie, select category, click "Pick Movie")
   - Watch the pick appear in your draft board

2. **In Firefox (Viewer):**
   - Within 1-2 seconds, you should see:
     - The pick appear in the draft board
     - Timer update (if applicable)
     - Current picker indicator update
     - Available movies list update

3. **Verify:**
   - [ ] Pick appears on viewer screen automatically
   - [ ] No refresh needed
   - [ ] State is synchronized

#### Step 4: Test Role-Based Controls

1. **In Firefox (Viewer):**
   - Try to click "Pick Selected Movie" button
   - Should be **disabled** or show error
   - Try to interact with pick controls
   - Should see "View Only" message

2. **In Chrome (Commissioner):**
   - All controls should work normally
   - Can make picks freely

#### Step 5: Test Navigation

1. **In Firefox (Viewer):**
   - Switch to "Grid View"
   - Switch to "Matrix View"
   - Switch to "Category View"
   - Switch to "Member Team View"
   - All should work and show real-time updates

2. **In Chrome (Commissioner):**
   - Make another pick
   - Viewer's current view should update automatically

---

## Complete Testing Checklist

### Setup & Connection
- [ ] Commissioner can start session
- [ ] Session ID is generated and displayed
- [ ] Shareable link is created
- [ ] Link can be copied to clipboard
- [ ] Viewer can join via shareable link
- [ ] Viewer can join via session ID input
- [ ] Connection status shows "Connected" for both
- [ ] Error message shown for invalid session ID

### Real-Time Synchronization
- [ ] Commissioner makes pick → Viewer sees it within 2 seconds
- [ ] Timer updates sync across browsers
- [ ] Current picker indicator updates in real-time
- [ ] Available movies list updates on both screens
- [ ] Draft board updates simultaneously
- [ ] Grid view updates on viewer when commissioner picks
- [ ] Matrix view updates on viewer when commissioner picks
- [ ] Category view updates on viewer when commissioner picks
- [ ] Member team view updates on viewer when commissioner picks

### Role-Based Access Control
- [ ] Commissioner can make picks (all controls enabled)
- [ ] Viewer cannot make picks (controls disabled/grayed out)
- [ ] Viewer sees "View Only" message
- [ ] Viewer gets error if trying to make pick
- [ ] Pick button shows different text for viewer
- [ ] Search bar works for viewer (can search, but can't pick)

### Navigation & Views
- [ ] Commissioner can navigate all views
- [ ] Viewer can navigate all views independently
- [ ] View changes are local (not synchronized between users)
- [ ] All views show real-time draft state
- [ ] Navigation works identically for both roles

### Edge Cases
- [ ] Commissioner refreshes page → Session persists
- [ ] Viewer refreshes page → Reconnects and sees current state
- [ ] Commissioner closes tab → Viewer still connected
- [ ] Viewer closes tab → Can rejoin with same session ID
- [ ] Multiple viewers can join same session
- [ ] Draft completion works correctly
- [ ] Session ends when draft is complete

### Solo Mode (Backward Compatibility)
- [ ] App works without starting/joining session
- [ ] LocalStorage still works for solo drafts
- [ ] No Firebase errors when not in session mode

---

## Advanced Testing Scenarios

### Scenario 1: Multiple Viewers

1. **Commissioner**: Chrome
2. **Viewer 1**: Firefox
3. **Viewer 2**: Safari (or Incognito Chrome)

**Test:**
- All viewers see picks simultaneously
- Each viewer can navigate independently
- All viewers stay in sync

### Scenario 2: Connection Loss

1. **Commissioner**: Make a pick
2. **Viewer**: Disconnect WiFi for 5 seconds
3. **Viewer**: Reconnect WiFi

**Expected:**
- Viewer should reconnect automatically
- Viewer should see latest state after reconnection
- Connection status should update

### Scenario 3: Rapid Picks

1. **Commissioner**: Make 3-4 picks quickly in succession
2. **Viewer**: Watch for state updates

**Expected:**
- All picks should appear on viewer screen
- No picks should be lost
- State should remain consistent

### Scenario 4: View Independence

1. **Commissioner**: On Draft Board view
2. **Viewer 1**: Switch to Grid View
3. **Viewer 2**: Switch to Matrix View
4. **Commissioner**: Make a pick

**Expected:**
- Each viewer's current view updates
- Viewers don't affect each other's navigation
- Commissioner's view doesn't change

---

## Troubleshooting Common Issues

### Issue: Viewer Can't Join Session

**Check:**
1. Is dev server running?
2. Are both browsers on same URL?
3. Is session ID correct? (copy-paste to avoid typos)
4. Check browser console for errors
5. Check Firebase console for session existence

**Solution:**
- Verify session exists in Firebase console
- Try generating new session
- Clear browser cache/localStorage

### Issue: Picks Not Syncing

**Check:**
1. Connection status indicators
2. Browser console for Firebase errors
3. Network tab for Firebase requests
4. Firebase console for writes

**Solution:**
- Check Firebase database rules
- Verify environment variables are set
- Check for CORS errors
- Verify Firebase project is active

### Issue: Viewer Can Make Picks

**Check:**
1. User role is set correctly
2. Role check in `makePick` function
3. Disabled state on buttons

**Solution:**
- Verify `userRole === 'viewer'` check
- Check that controls are properly disabled
- Add console logs to debug role assignment

### Issue: State Out of Sync

**Check:**
1. Firebase listeners are active
2. No conflicting writes
3. State structure matches

**Solution:**
- Check Firebase console for data structure
- Verify listeners are set up correctly
- Check for race conditions in state updates

---

## Testing on Production Build

After testing in dev mode, test the production build:

```bash
cd movie-draft-app

# Build production version
npm run build

# Preview production build
npm run preview
```

Then test with:
- Chrome: `http://localhost:4173` (or port shown)
- Firefox: Same URL

**Why test production build?**
- Dev and production can behave differently
- GitHub Pages serves production build
- Catches build-specific issues

---

## Testing on Deployed Site

Once deployed to GitHub Pages:

1. **Commissioner**: Open `https://jwein.github.io/movie-draft/`
2. **Viewer**: Open same URL on different device/browser
3. Test full flow on live site

**Benefits:**
- Tests real-world network conditions
- Verifies Firebase works in production
- Tests with actual URLs (not localhost)

---

## Quick Test Script

Here's a minimal test you can run in 2 minutes:

```bash
# Terminal 1: Start dev server
cd movie-draft-app
npm run dev

# Then:
# 1. Open Chrome → localhost:5173 → Host Session → Copy link
# 2. Open Firefox → Paste link → Join
# 3. Chrome: Make a pick
# 4. Firefox: Should see pick appear automatically
# 5. Firefox: Try to make pick → Should be blocked
# ✅ If all work, basic functionality is good!
```

---

## Recommended Testing Order

1. **Basic flow** (host/join/pick) - 5 min
2. **Role-based controls** - 2 min
3. **Navigation** - 3 min
4. **Multiple viewers** - 5 min
5. **Edge cases** (refresh, disconnect) - 10 min
6. **Production build** - 5 min

**Total: ~30 minutes for comprehensive test**

---

## What to Look For

### ✅ Good Signs
- Picks appear within 1-2 seconds
- No console errors
- Connection status shows "Connected"
- Smooth UI updates
- No flickering or re-renders

### ⚠️ Warning Signs
- Picks take > 3 seconds to appear
- Console errors (especially Firebase)
- Connection status flickering
- State inconsistencies
- UI freezes or lag

---

## Reporting Issues

If you find bugs, note:
1. **What you did** (steps to reproduce)
2. **What you expected** (expected behavior)
3. **What happened** (actual behavior)
4. **Browser/OS** (Chrome on Mac, Firefox on Windows, etc.)
5. **Console errors** (copy from browser console)
6. **Screenshots** (if visual issue)

---

## Next Steps After Testing

Once testing is complete:
1. ✅ All tests pass → Ready for draft night!
2. ⚠️ Minor issues → Fix before draft night
3. ❌ Major issues → Debug and fix, then retest

Happy testing! 🚀

