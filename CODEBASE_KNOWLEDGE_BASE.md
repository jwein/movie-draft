# Movie Draft - Codebase Knowledge Base

**Last Updated:** Initial onboarding  
**Purpose:** Reference document for Engineering Manager to maintain context across task assignments

---

## Project Overview

### What It Is
A fantasy movie draft web application for 6 friends to draft movies into 6 categories from a curated pool of 100 films. The app enforces snake draft order, includes a 2-minute timer per pick, and provides multiple views for tracking draft progress.

### Current Status
- ✅ **Deployed:** Working on GitHub Pages
- ✅ **Solo Mode:** Fully functional single-user experience
- 🚧 **Commissioner Mode:** In development (feature/commissioner-mode branch)
- 📋 **Next Feature:** Multi-user real-time draft sessions

### Tech Stack
- **Framework:** React 19 with Vite
- **Styling:** Tailwind CSS v4
- **State Management:** React hooks (useReducer) + localStorage
- **Deployment:** GitHub Pages (static hosting)
- **Package Manager:** npm

---

## Architecture Overview

### High-Level Structure
```
App.jsx (Root)
├── SetupScreen (Initial setup: member names, draft order)
├── Navigation (View switcher)
└── View Components:
    ├── DraftBoard (Main drafting interface)
    ├── DraftBoardGrid (Sequential snake view)
    ├── MemberTeamView (Individual member's picks)
    ├── MatrixView (Category × Member matrix)
    └── CategoryView (All picks for a category)
```

### State Management Flow
```
useDraftState Hook
├── Reducer-based state (draftReducer)
├── localStorage persistence (auto-save)
├── Snake draft order generation
└── Pick validation & history (undo support)

useTimer Hook
├── 2-minute countdown per pick
├── Pause/resume functionality
└── Time's up handling
```

### Data Flow
1. **Initialization:** Load state from localStorage or create initial state
2. **Setup:** User enters member names, optionally randomizes order
3. **Draft Start:** Generate snake draft order (36 picks: 6 rounds × 6 members)
4. **Picking:** User selects movie + category → `makePick()` → Update state → Save to localStorage
5. **Views:** All views read from `draftState` and update reactively

---

## Key Files & Components

### Core State Management

#### `src/hooks/useDraftState.js`
**Purpose:** Central state management for entire draft  
**Key Features:**
- Reducer pattern with localStorage persistence
- Snake draft order generation (`generateSnakeDraftOrder`)
- Pick validation (prevent duplicates, category conflicts)
- Undo functionality (history stack)
- Computed values (currentMember, availableMovies, etc.)

**State Structure:**
```javascript
{
  // Setup
  isSetupComplete: boolean,
  members: [{ id, name }], // 6 members
  
  // Draft state
  draftOrder: [memberId, ...], // 36 picks in snake order
  currentPickIndex: number, // 0-35
  currentCategoryIndex: number, // 0-5
  selectedCategoryId: number | null,
  
  // Picks
  picks: { memberId: { categoryId: movieId } },
  picksOrder: [{ pickIndex, memberId, categoryId, movieId }],
  
  // Movies
  availableMovieIds: [movieId, ...],
  movies: [{ id, title, posterUrl, year, ... }],
  
  // History & completion
  history: [previousState, ...],
  isDraftComplete: boolean,
}
```

**Key Actions:**
- `updateMemberName(memberId, name)`
- `randomizeOrder()`
- `startDraft()`
- `setSelectedCategory(categoryId)`
- `makePick(movieId, categoryId)`
- `undoPick()`
- `resetDraft()`

**Important Notes:**
- State auto-saves to localStorage on every change
- `draftOrder` is the source of truth for pick sequence
- Member IDs are 1-6, but can change after randomization
- Extensive validation to prevent data corruption

#### `src/hooks/useTimer.js`
**Purpose:** 2-minute countdown timer per pick  
**Features:**
- Start/pause/reset functionality
- Time's up detection
- Formatted display (mm:ss)

---

### Core Components

#### `src/App.jsx`
**Purpose:** Root component, view routing  
**Key Logic:**
- Manages `currentView` state
- Conditionally shows SetupScreen if `!isSetupComplete`
- Routes to different view components based on `currentView`
- Resets timer when pick changes

**View Constants:**
- `VIEWS.SETUP`
- `VIEWS.DRAFT_BOARD`
- `VIEWS.DRAFT_BOARD_GRID`
- `VIEWS.MEMBER_TEAM`
- `VIEWS.MATRIX`
- `VIEWS.CATEGORY`

#### `src/components/SetupScreen.jsx`
**Purpose:** Initial setup before draft starts  
**Features:**
- Member name editing (6 members)
- Randomize draft order button
- "Begin Draft" button
- Clear storage option

**Flow:**
1. User edits member names
2. (Optional) Randomize order
3. Click "Begin Draft" → `startDraft()` → Sets `isSetupComplete: true`

#### `src/components/DraftBoard.jsx`
**Purpose:** Main drafting interface  
**Key Features:**
- Shows current picker ("Now Selecting")
- Timer display
- Category selector (dropdown)
- Movie search bar
- Available movies grid (5 columns)
- Selected movie preview
- "Confirm Selection" button
- Undo/Reset buttons

**State Management:**
- Local state: `searchQuery`, `selectedMovieId`
- Props: `draftState`, `timer`
- Auto-selects first available category for current member

**Important Logic:**
- Filters movies by category eligibility (for restricted categories)
- Filters by search query
- Validates selection before allowing pick
- Shows "Draft Complete" screen when done

#### `src/components/DraftBoardGrid.jsx`
**Purpose:** Sequential snake draft view  
**Shows:** All 36 picks in order (1-36) with member name and movie poster

#### `src/components/MemberTeamView.jsx`
**Purpose:** View all picks for a single member  
**Features:**
- Dropdown to select member
- Shows 6 categories with picks (or "Empty")

#### `src/components/MatrixView.jsx`
**Purpose:** Category × Member matrix  
**Layout:** Categories as rows, Members as columns, cells show picks

#### `src/components/CategoryView.jsx`
**Purpose:** View all members' picks for a single category  
**Features:**
- Dropdown to select category
- Grid showing each member's pick for that category

#### `src/components/Navigation.jsx`
**Purpose:** View switcher in header  
**Features:**
- Tab-style navigation
- Export button
- "Draft Complete" badge

---

### Data Files

#### `src/data/constants.js`
**Exports:**
- `DRAFT_CONFIG`: Timer seconds, rounds, members count
- `DEFAULT_MEMBERS`: 6 default member names
- `CATEGORIES`: 6 categories with IDs and names
- `STORAGE_KEY`: localStorage key ("movie-draft-state")
- `VIEWS`: View type constants

**Categories:**
1. Airplane Movies
2. All Nos (restricted - only movies with `isAllNos: true`)
3. Slow/Boring
4. Ex US (restricted - only movies with `isExUS: true`)
5. Ilan's Picks (restricted - only movies with `isIlansPicks: true`)
6. Wildcard/Faves

#### `src/data/movies.json`
**Structure:** Array of 100 movie objects
```javascript
{
  id: number,
  title: string,
  year: number,
  posterUrl: string | null,
  isAllNos: boolean,
  isExUS: boolean,
  isIlansPicks: boolean
}
```

---

## Draft Logic

### Snake Draft Order
- **Total Picks:** 36 (6 rounds × 6 members)
- **Round 1:** Members 1, 2, 3, 4, 5, 6
- **Round 2:** Members 6, 5, 4, 3, 2, 1 (reversed)
- **Round 3:** Members 1, 2, 3, 4, 5, 6 (forward again)
- **Pattern repeats** for 6 rounds

### Pick Validation
- ✅ Movie must be in `availableMovieIds`
- ✅ Category must not be filled for current member
- ✅ Member must match `draftOrder[currentPickIndex]`

### Category Restrictions
Some categories have eligibility restrictions:
- **All Nos (id: 2):** Only movies where `isAllNos === true`
- **Ex US (id: 4):** Only movies where `isExUS === true`
- **Ilan's Picks (id: 5):** Only movies where `isIlansPicks === true`

These are enforced in `getAvailableMoviesForCategory()` helper.

---

## Current Limitations & Known Issues

### Solo Mode Only
- Currently single-user (one operator makes all picks)
- No real-time synchronization
- No multi-device support

### State Persistence
- Uses localStorage (browser-specific)
- No cloud backup
- No cross-device sync

### Member ID Handling
- Member IDs can change after randomization
- Extensive validation in `useDraftState` to handle ID mismatches
- Some edge cases around member randomization after draft starts

---

## Commissioner Mode Requirements

### Goal
Enable multi-user draft experience where:
- **Commissioner (Host):** Makes all picks
- **Viewers:** Watch draft in real-time on their devices
- **Real-time Sync:** Picks appear on all devices within 2 seconds

### Technical Approach
- **Firebase Realtime Database** for state synchronization
- **Session Management:** Create/join sessions via session ID
- **Role-Based Access:** First to join = commissioner, others = viewers
- **Hybrid Mode:** Solo mode (localStorage) still works, Firebase is opt-in

### Implementation Phases
1. **Task 1.1:** Firebase Setup & Configuration ← **CURRENT**
2. **Task 1.2:** Session Management System
3. **Task 1.3:** Role-Based Access Control
4. **Task 1.4:** State Synchronization (modify `useDraftState`)
5. **Task 1.5:** UI/UX Polish

---

## File Structure

```
movie-draft-app/
├── src/
│   ├── components/
│   │   ├── SetupScreen.jsx
│   │   ├── DraftBoard.jsx
│   │   ├── DraftBoardGrid.jsx
│   │   ├── MemberTeamView.jsx
│   │   ├── MatrixView.jsx
│   │   ├── CategoryView.jsx
│   │   ├── Navigation.jsx
│   │   ├── MovieCard.jsx
│   │   ├── Timer.jsx
│   │   ├── PickerStats.jsx
│   │   └── ExportButton.jsx
│   ├── hooks/
│   │   ├── useDraftState.js
│   │   └── useTimer.js
│   ├── data/
│   │   ├── constants.js
│   │   └── movies.json
│   ├── utils/
│   │   └── exportDraft.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── public/
├── scripts/
├── package.json
├── vite.config.js
└── .env.local (gitignored - for Firebase config)
```

---

## Development Workflow

### Branch Strategy
- **Current Branch:** `feature/commissioner-mode`
- **Base Branch:** `main` (or `master`)

### Running Locally
```bash
cd movie-draft-app
npm install
npm run dev
```

### Building for Production
```bash
npm run build
# Output: dist/
```

### Environment Variables
- All Firebase config in `.env.local` (gitignored)
- Must use `VITE_` prefix for Vite to expose them
- Example: `VITE_FIREBASE_API_KEY=...`

---

## Key Patterns & Conventions

### State Updates
- Always use reducer actions (don't mutate state directly)
- State auto-saves to localStorage
- Use `useCallback` for action creators

### Component Props
- `draftState`: Full state object from `useDraftState()`
- `timer`: Timer object from `useTimer()`
- Pass entire objects, not individual values (for flexibility)

### Styling
- Tailwind CSS utility classes
- Custom colors: `burgundy`, `cream`, `charcoal`, `forest`, `gold`
- Responsive design (desktop-first, no mobile optimization yet)

### Error Handling
- Console warnings for data integrity issues
- Validation before state updates
- Graceful degradation (e.g., missing posters)

---

## Testing Considerations

### Manual Testing Checklist
- [ ] Full draft flow (36 picks)
- [ ] Undo functionality
- [ ] Category restrictions work
- [ ] Search functionality
- [ ] All views render correctly
- [ ] Timer works correctly
- [ ] localStorage persistence
- [ ] Member randomization
- [ ] Draft completion screen

### Edge Cases
- Member randomization after draft starts
- Invalid member IDs in draftOrder
- Category already filled
- Movie already picked
- Timer reaches zero

---

## Future Enhancements (Out of Scope for Commissioner Mode)

- Chat feature for viewers
- Viewer reactions/emojis
- Draft replay/history
- Multiple concurrent drafts
- Viewer voting on picks
- Draft analytics dashboard
- Mobile optimization
- Authentication system

---

## Questions & Decisions Log

### Resolved
- ✅ Firebase chosen over WebSocket (faster implementation)
- ✅ MVP uses simple security rules (no auth)
- ✅ Solo mode must remain functional (backward compatibility)

### Pending
- Session persistence if commissioner closes browser?
- Maximum number of viewers?
- Session expiration time?
- Offline mode support?

---

## References

### Documentation Files
- `movie draft overview prd.md` - Product requirements
- `Phase_Progress.md` - Development progress tracking
- `COMMISSIONER_MODE_SPRINT_PLAN.md` - Sprint plan with user stories
- `COMMISSIONER_MODE_TECH_SPEC.md` - Technical implementation details
- `GIT_WORKFLOW_GUIDE.md` - Git workflow guidelines

### External Resources
- Firebase Realtime Database: https://firebase.google.com/docs/database/web/start
- Vite Environment Variables: https://vitejs.dev/guide/env-and-mode.html
- React 19 Documentation: https://react.dev/

---

**Note:** This document should be updated as the codebase evolves, especially after Commissioner Mode implementation.

