# Task 1.3: Role-Based Access Control

## Task Objective
Implement role-based access control to ensure only the commissioner can make picks, while viewers can watch the draft in real-time but cannot interact with pick controls. This enforces the multi-user draft experience where one person controls the draft flow.

## Project Context

### Current State
- ✅ **Task 1.1 Complete:** Firebase configured
- ✅ **Task 1.2 Complete:** Session management system implemented
  - Users can host/join sessions
  - `userRole` is determined and available via `useSessionContext()`
  - Role detection logic: `'commissioner'` or `'viewer'` based on session metadata

### Target State
After this task:
- **Commissioner:** Can make all picks, use all controls (existing functionality)
- **Viewer:** Can see all draft state, navigate all views, but cannot make picks
- **UI Feedback:** Clear visual indicators showing role and disabled controls
- **Solo Mode:** Continues to work unchanged (no session = full access)

### How This Fits Into Commissioner Mode
This is **Task 1.3** from the Commissioner Mode sprint plan. It enforces:
- Role-based restrictions on pick actions
- Visual feedback for viewers (disabled controls, "View Only" messaging)
- **Next:** Task 1.4 will sync draft state through Firebase so viewers see picks in real-time

## Relevant Files & Modules

### Files to Modify
1. **`movie-draft-app/src/components/DraftBoard.jsx`** - Add role-based restrictions to pick controls
2. **`movie-draft-app/src/components/DraftBoardGrid.jsx`** - Add role indicator (if applicable)
3. **`movie-draft-app/src/components/Navigation.jsx`** - Add role indicator in header (optional)

### Files to Review (For Context Only)
- `movie-draft-app/src/context/SessionContext.jsx` - Provides `userRole` via `useSessionContext()`
- `movie-draft-app/src/hooks/useSession.js` - Role detection logic (already implemented)
- `COMMISSIONER_MODE_TECH_SPEC.md` - Technical specification for role-based UI
- `COMMISSIONER_MODE_SPRINT_PLAN.md` - User Story 3 requirements

## Essential Documentation

### User Story 3: Role-Based Pick Controls (From Sprint Plan)

**As a** commissioner  
**I want to** be the only person who can make picks  
**So that** I maintain control over the draft flow

**As a** viewer  
**I want to** see that I cannot make picks  
**So that** I understand my role is view-only

**Acceptance Criteria:**
- [ ] Commissioner sees all pick controls (search, select, "Pick Movie" button)
- [ ] Viewers see pick controls but they are disabled/grayed out
- [ ] Clear visual indicator shows role (commissioner vs viewer)
- [ ] Viewers cannot make picks (prevented at both UI and logic level)

### Role Detection (Already Implemented in Task 1.2)
- `userRole` is available via `useSessionContext()`
- Values: `'commissioner'` | `'viewer'` | `null` (null = solo mode, no restrictions)
- Role is determined when joining/creating session
- Solo mode (no session) = `userRole === null` = full access

## Implementation Details

### 1. Modified DraftBoard.jsx

**Key Changes:**

1. **Import Session Context:**
```javascript
import { useSessionContext } from '../context/SessionContext';

// Inside component:
const { userRole } = useSessionContext();
const isViewer = userRole === 'viewer';
const isCommissioner = userRole === 'commissioner';
const isSessionMode = userRole !== null; // Has a role = in a session
```

2. **Disable Pick Controls for Viewers:**

**Category Selector:**
```jsx
<select
  value={selectedCategoryId || ''}
  onChange={(e) => setSelectedCategory(Number(e.target.value))}
  disabled={isViewer || !currentMember || availableCategories.length === 0}
  className={`w-full bg-white border border-border px-2 py-1.5 text-text-primary text-sm focus:outline-none focus:border-burgundy ${
    isViewer ? 'opacity-50 cursor-not-allowed bg-cream' : ''
  }`}
>
  {/* options */}
</select>
```

**Search Input:**
```jsx
<input
  type="text"
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  placeholder="Search by title..."
  disabled={isViewer}
  className={`w-full bg-white border border-border px-2 py-1.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-burgundy ${
    isViewer ? 'opacity-50 cursor-not-allowed bg-cream' : ''
  }`}
/>
```

**Movie Card Selection:**
- Disable click handlers for viewers
- Add visual styling (opacity, cursor) for disabled state
- In `MovieCard` component or wrapper, prevent `onClick` when `isViewer`

**Confirm Selection Button:**
```jsx
<button
  onClick={handlePick}
  disabled={!selectedMovieId || !selectedCategoryId || isViewer}
  className={`bg-burgundy hover:bg-burgundy-light disabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed text-white font-medium py-2 px-5 text-sm transition-colors whitespace-nowrap ${
    isViewer ? 'opacity-50' : ''
  }`}
>
  {isViewer ? 'View Only' : 'Confirm Selection'}
</button>
```

3. **Add Viewer Notice:**
```jsx
{isViewer && (
  <div className="bg-cream-dark border-l-4 border-text-muted px-4 py-3 mb-4">
    <div className="flex items-center gap-2">
      <span className="text-text-muted text-sm font-medium">
        👁️ View Only Mode
      </span>
      <span className="text-text-muted text-xs">
        You are watching the draft. Only the commissioner can make picks.
      </span>
    </div>
  </div>
)}
```

**Placement:** Add this notice at the top of the DraftBoard component, before the control bar.

4. **Prevent Pick Actions in Logic:**
```javascript
const handlePick = () => {
  // Prevent picks for viewers
  if (isViewer) {
    // Optional: Show friendly message (or rely on disabled button)
    return;
  }
  
  // Existing pick logic (unchanged)
  if (!selectedMovieId) {
    alert('Please select a movie first');
    return;
  }
  if (!selectedCategoryId) {
    alert('Please select a category first');
    return;
  }
  makePick(selectedMovieId, selectedCategoryId);
  setSelectedMovieId(null);
  setSearchQuery('');
};
```

5. **Disable Undo/Reset for Viewers (Optional):**
```jsx
<button
  onClick={handleUndo}
  disabled={!canUndo || isViewer}
  className={`border border-border bg-white text-text-secondary py-2 px-3 text-xs font-medium hover:bg-cream-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors ${
    isViewer ? 'opacity-50' : ''
  }`}
>
  Undo
</button>
<button
  onClick={resetDraft}
  disabled={isViewer}
  className={`border border-burgundy/30 bg-burgundy/5 text-burgundy py-2 px-3 text-xs font-medium hover:bg-burgundy/10 transition-colors ${
    isViewer ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  Reset
</button>
```

**Note:** Consider whether viewers should be able to undo/reset. Recommendation: **Disable for viewers** to prevent accidental actions.

### 2. Modified Navigation.jsx (Optional Enhancement)

Add role indicator in header:

```jsx
import { useSessionContext } from '../context/SessionContext';

// Inside component:
const { userRole, isHosting } = useSessionContext();

// In header, near logo:
{userRole === 'commissioner' && (
  <span className="text-xs font-medium bg-forest text-white px-3 py-1 uppercase tracking-wider">
    Commissioner
  </span>
)}
{userRole === 'viewer' && (
  <span className="text-xs font-medium bg-text-muted text-white px-3 py-1 uppercase tracking-wider">
    Viewer
  </span>
)}
```

**Placement:** Next to the "MOVIE DRAFT" logo or near the "Complete" badge area.

### 3. Other Components (Review Only)

**DraftBoardGrid.jsx, MemberTeamView.jsx, MatrixView.jsx, CategoryView.jsx:**
- These are **read-only views** - no changes needed
- Viewers should be able to navigate and view all of these
- No pick controls in these views, so no restrictions needed

**SetupScreen.jsx:**
- Already handles session management (Task 1.2)
- No additional role restrictions needed here
- Viewers can still see setup (they'll see the draft once it starts)

## Acceptance Criteria

1. ✅ Commissioner can use all pick controls (category selector, search, movie selection, confirm button)
2. ✅ Viewer sees all pick controls but they are disabled/grayed out
3. ✅ "View Only" notice/message is displayed for viewers
4. ✅ Confirm Selection button shows "View Only" text for viewers
5. ✅ Movie selection is disabled for viewers (cannot click movie cards)
6. ✅ Search input is disabled for viewers
7. ✅ Category selector is disabled for viewers
8. ✅ Undo/Reset buttons are disabled for viewers (optional but recommended)
9. ✅ Role indicator visible in Navigation header (optional enhancement)
10. ✅ Solo mode (no session) works unchanged (full access)
11. ✅ Viewers can navigate all views (Draft Board, Grid, Matrix, etc.)
12. ✅ No errors when switching between commissioner/viewer roles
13. ✅ Visual styling clearly indicates disabled state (opacity, cursor, background)

## Testing Instructions

### Manual Testing Checklist

1. **Commissioner Flow:**
   - [ ] Host a session
   - [ ] Verify all controls are enabled and functional
   - [ ] Make a pick successfully
   - [ ] Use search, category selector, movie selection
   - [ ] Undo/Reset work (if enabled)

2. **Viewer Flow:**
   - [ ] Join a session as viewer
   - [ ] Verify "View Only" notice is displayed
   - [ ] Verify all pick controls are disabled (grayed out)
   - [ ] Verify cannot click movie cards
   - [ ] Verify cannot make picks (button disabled)
   - [ ] Verify can navigate all views (Draft Board, Grid, Matrix, Category, Member Team)
   - [ ] Verify role indicator in header (if implemented)

3. **Solo Mode:**
   - [ ] No session active
   - [ ] All controls work normally
   - [ ] No "View Only" notice
   - [ ] Full functionality preserved

4. **Role Switching:**
   - [ ] Host session → become commissioner → controls enabled
   - [ ] Join session → become viewer → controls disabled
   - [ ] Leave session → return to solo → controls enabled
   - [ ] No console errors during role changes

5. **Visual States:**
   - [ ] Disabled controls have reduced opacity
   - [ ] Disabled controls show "not-allowed" cursor
   - [ ] Disabled inputs have different background color
   - [ ] "View Only" notice is clearly visible

### Browser Console Checks
- [ ] No errors when viewer tries to interact with disabled controls
- [ ] No errors when switching roles
- [ ] No React warnings about disabled props

## Expected Output

### Files Modified
- `movie-draft-app/src/components/DraftBoard.jsx`
- `movie-draft-app/src/components/Navigation.jsx` (optional enhancement)

### Deliverables

1. **Summary of Changes:**
   - List all files modified
   - Describe role-based restrictions added
   - Note any optional enhancements implemented

2. **Implementation Notes:**
   - How role detection is used
   - Which controls are restricted
   - Visual styling approach for disabled state

3. **Testing Results:**
   - Confirmation of all acceptance criteria
   - Screenshots of commissioner vs viewer UI (optional but helpful)
   - Any edge cases handled

4. **Screenshots (Optional but Helpful):**
   - DraftBoard as commissioner (all controls enabled)
   - DraftBoard as viewer (controls disabled, "View Only" notice)
   - Navigation header with role indicator

## Notes & Considerations

### Important Reminders
- **Do NOT modify `useDraftState.js` yet** - that's Task 1.4
- **Do NOT add Firebase state sync yet** - that's Task 1.4
- **Solo mode must continue to work** - `userRole === null` = no restrictions
- **Viewers can navigate all views** - only pick controls are restricted

### Role Logic
- `userRole === 'commissioner'` → Full access
- `userRole === 'viewer'` → View only (disabled controls)
- `userRole === null` → Solo mode (full access, no session)

### UI/UX Considerations
- **Clear Visual Feedback:** Disabled controls should be obviously disabled
- **Helpful Messaging:** "View Only" notice explains why controls are disabled
- **Consistent Styling:** Use same disabled styling pattern across all controls
- **Accessibility:** Disabled state should be clear for screen readers

### Future Tasks (Not This One)
- **Task 1.4:** State Synchronization (will sync draft state so viewers see picks in real-time)
- **Task 1.5:** UI/UX Polish (may enhance role indicators)

### Edge Cases
- What if `userRole` changes mid-draft? (Shouldn't happen, but handle gracefully)
- What if viewer tries to interact via keyboard? (Disabled inputs prevent this)
- What if viewer opens browser console? (UI restrictions are UX, not security - acceptable for MVP)

## Questions to Resolve
If you encounter issues or need clarification:
- Should viewers be able to undo/reset? (Recommendation: No)
- Should role indicator be in Navigation or DraftBoard? (Both acceptable)
- Should "View Only" notice be dismissible? (Recommendation: No, always visible)

## Next Steps (After This Task)
Once this task is complete and reviewed, the next task will be:
**Task 1.4: State Synchronization** - Syncing draft state through Firebase so viewers see picks in real-time.

---

**Task Status:** Ready for Assignment  
**Estimated Time:** 3 hours  
**Priority:** High (Core functionality for multi-user experience)  
**Dependencies:** Task 1.2 (Session Management) ✅ Complete

