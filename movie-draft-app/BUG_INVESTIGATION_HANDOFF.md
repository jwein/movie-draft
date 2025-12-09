# Draft Board Freeze Bug - Investigation Handoff

## ✅ RESOLVED - December 9, 2025

### Root Cause
The bug was caused by **shallow copy mutation** in the `MAKE_PICK` reducer. When updating the `picks` object:

```javascript
// OLD CODE (buggy)
const newPicks = { ...state.picks };
if (!newPicks[currentMemberId]) {
  newPicks[currentMemberId] = {};
}
newPicks[currentMemberId][selectedCategoryId] = movieId;
```

The spread operator `{ ...state.picks }` only creates a shallow copy - the nested objects (`picks[memberId]`) are still references to the same objects in the original state. When a member already had picks (like member 6 at pick 7 in a snake draft), the code was **mutating the existing nested object** instead of creating a new one.

This violated React/reducer immutability rules and caused React's state comparison to behave incorrectly, leading to:
- Member 6 appearing to have multiple picks after only 6 total picks
- The draft getting "stuck" at pick 7

### The Fix
Applied proper deep copying for nested objects:

```javascript
// NEW CODE (fixed)
// Update picks - MUST create new objects to maintain immutability
const newPicks = { ...state.picks };
newPicks[currentMemberId] = {
  ...(state.picks[currentMemberId] || {}),
  [selectedCategoryId]: movieId,
};
```

Also fixed the history entry to deep copy picks for proper undo functionality:

```javascript
picks: Object.fromEntries(
  Object.entries(state.picks).map(([memberId, memberPicks]) => [memberId, { ...memberPicks }])
),
```

### Why Pick 7 Specifically?
In a snake draft, member 6 picks at both position 6 (end of round 1) AND position 7 (start of round 2). This was the first time any member was picking for the second time, which is when the shallow copy mutation became visible.

---

## Original Problem Summary (Historical Reference)

**The DraftBoard freezes after the 6th pick (when transitioning to pick 7).** The draft cannot advance beyond the first round. The member who should be picking at pick 7 gets "stuck" - you can keep making picks for them (which appear in other views like Team, Matrix, Category), but the `currentPickIndex` never advances beyond 6.

## Environment

- React app with Vite
- State managed via `useReducer` in `useDraftState.js`
- LocalStorage persistence enabled
- Snake draft: 6 members × 6 rounds = 36 total picks

## Key Files

- `movie-draft-app/src/hooks/useDraftState.js` - Central state management
- `movie-draft-app/src/components/DraftBoard.jsx` - Main draft UI
- `movie-draft-app/src/components/DraftBoardGrid.jsx` - Grid view (read-only)
- `movie-draft-app/src/data/constants.js` - Configuration

## Draft Logic

### Snake Draft Order
- Round 1: Members 1→2→3→4→5→6 (picks 1-6)
- Round 2: Members 6→5→4→3→2→1 (picks 7-12) - **REVERSED**
- Round 3: Members 1→2→3→4→5→6 (picks 13-18)
- etc.

### State Structure
```javascript
{
  members: [{ id: 1, name: "..." }, ...],  // 6 members
  draftOrder: [1,2,3,4,5,6,6,5,4,3,2,1,...], // 36 member IDs in pick order
  currentPickIndex: 0-35,
  picks: { memberId: { categoryId: movieId } },
  picksOrder: [{ pickIndex, memberId, categoryId, movieId }, ...],
  selectedCategoryId: 1-6 or null,
}
```

## What We've Tried

### 1. Initial ID/Position Coupling Theory
**Theory:** Member IDs in `draftOrder` don't match current `members` array after randomization.

**Changes Made:**
- Added validation in `loadState()` to check if draftOrder member IDs exist in members array
- Added validation in `MAKE_PICK` to verify currentMemberId is valid
- Added validation in `START_DRAFT` to verify draftOrder is generated correctly

**Result:** Logs showed member IDs ARE matching correctly. Not the root cause.

### 2. Auto-Selection Infinite Loop Theory
**Theory:** The `useEffect` for auto-selecting categories was causing re-renders or selecting already-filled categories.

**Changes Made:**
- Simplified useEffect dependencies
- Added guards to prevent selecting already-filled categories
- Cleared category selection on pick change

**Result:** Issue persisted. Auto-selection was selecting correct categories.

### 3. Category Already Filled Error
**Key Finding from Logs:**
```
Category 5 already filled for member 6.
  Current pick index: 6
  Member 6 picks: {"3":1,"5":45}
  Attempting to select category: 5
  Picks order: 6 picks made so far
```

This shows that at pick 7 (index 6), member 6 already has 2 categories filled (3 and 5), but there have only been 6 picks total. **This is impossible in a correct snake draft** - after 6 picks, each member should have exactly 1 pick.

### 4. Snake Draft Category-Per-Round Enforcement (WRONG APPROACH)
**Theory:** Maybe snake draft should enforce one category per round.

**Changes Made:**
- Added validation that category must match round number
- Limited available categories to only the current round's category

**Result:** This was incorrect - users should be able to pick ANY unfilled category. Reverted.

### 5. Current State After Reverts
- Removed category-per-round enforcement
- Users can pick any available category
- Auto-selection picks first unfilled category
- **Bug still persists**

## Console Log Analysis

### Successful Flow (Picks 1-6)
```
[DraftBoard] Auto-selecting category 1 for member Doodie (G)
[DraftBoard] Auto-selecting category 1 for member Doodie (Z)
[DraftBoard] Manual category selection: 5
[DraftBoard] Auto-selecting category 1 for member Coach Josh
...
[DraftBoard] Auto-selecting category 1 for member Question Marc
[DraftBoard] Manual category selection: 3
```

### Failure Point (Pick 7)
```
[useDraftState] Auto-selecting category 1 for next member 6 (pick 7)
[useDraftState] Pick 7 member lookup:
  draftOrder[6] = 6
  Found member: id=6, name="Question Marc"
  All members: [1:"Doodie (G)", 2:"Doodie (Z)", ...]

Category 5 already filled for member 6.
  Current pick index: 6
  Member 6 picks: {"3":1,"5":45}
```

**Critical Issue:** Member 6 has picks for categories 3 AND 5 after only 6 total picks. This means multiple picks were assigned to member 6 during the first 6 picks.

## Hypotheses Not Yet Fully Explored

### 1. Race Condition in State Updates
The `picks` object might be getting updated with the wrong `currentMemberId`. Need to trace exactly when and how picks are being assigned.

### 2. Stale Closure Issue
The `makePick` callback might be capturing a stale `currentMemberId` from an earlier render.

### 3. Multiple Dispatch Calls
The reducer might be getting called multiple times for a single pick action.

### 4. LocalStorage Corruption
Saved state from previous sessions might have corrupted pick data that persists even after clearing.

## Suggested Next Steps

1. **Add Extensive Logging to MAKE_PICK Reducer:**
   ```javascript
   case ACTIONS.MAKE_PICK: {
     console.log('MAKE_PICK called:', {
       payload: action.payload,
       currentPickIndex: state.currentPickIndex,
       currentMemberId: state.draftOrder[state.currentPickIndex],
       existingPicks: state.picks,
       picksOrderLength: state.picksOrder.length,
     });
     // ... rest of reducer
   }
   ```

2. **Trace Every Pick Assignment:**
   Log when `newPicks[currentMemberId][selectedCategoryId] = movieId` is executed.

3. **Check for Multiple Component Mounts:**
   The `App` component might be mounting multiple instances of `useDraftState`.

4. **Verify Reducer Purity:**
   Ensure the reducer isn't mutating state directly instead of creating new objects.

5. **Test with Fresh localStorage:**
   Clear localStorage using Application tab → Storage → Local Storage → Clear, then hard refresh (Cmd+Shift+R).

## Files Modified During Investigation

- `useDraftState.js` - Many validation and logging additions
- `DraftBoard.jsx` - Auto-selection logic changes, added CATEGORIES import
- `SetupScreen.jsx` - Added "Clear Saved Data" button

## Test Script Created

`scripts/test-pick-sequence.js` - Validates snake draft order generation (this test passes, so the order generation is correct).

## How to Reproduce

1. Clear localStorage
2. Start app, click "Start Draft"
3. Make 6 picks (one for each member)
4. On pick 7, observe that:
   - The "On the Clock" member is correct (Question Marc / member 6)
   - But you cannot advance - picks keep going to member 6
   - Console shows "Category X already filled for member 6" errors
   - The `picks` object shows member 6 with multiple categories filled

## Key Code Locations

### MAKE_PICK Reducer (useDraftState.js ~line 253)
```javascript
case ACTIONS.MAKE_PICK: {
  const currentMemberId = state.draftOrder[state.currentPickIndex];
  // ... validation ...
  newPicks[currentMemberId][selectedCategoryId] = movieId;
  // ... advance to next pick ...
  return { ...state, currentPickIndex: nextPickIndex, picks: newPicks, ... };
}
```

### currentMember Computation (useDraftState.js ~line 420)
```javascript
const currentMemberId = state.draftOrder.length > 0 && state.currentPickIndex < state.draftOrder.length
  ? state.draftOrder[state.currentPickIndex]
  : null;

let currentMember = null;
if (currentMemberId) {
  currentMember = state.members.find(m => m.id === currentMemberId) || null;
}
```

### DraftBoard Pick Handler (DraftBoard.jsx ~line 121)
```javascript
const handlePick = () => {
  if (!selectedMovieId) { alert('Please select a movie first'); return; }
  if (!selectedCategoryId) { alert('Please select a category first'); return; }
  makePick(selectedMovieId, selectedCategoryId);
  setSelectedMovieId(null);
  setSearchQuery('');
  timer.reset();
};
```

---

**Good luck to the next engineer! The core mystery is: how are multiple picks being assigned to member 6 during the first 6 picks?**

