# Commissioner Mode - Sprint Plan

## Product Overview

**Feature**: Multi-user draft experience with role-based access control
**Goal**: Enable the commissioner to make picks while viewers watch the draft in real-time across multiple devices
**Timeline**: 1-2 sprints (depending on technical approach chosen)

---

## User Stories & Requirements

### Epic: Real-Time Multi-User Draft Experience

#### User Story 1: Commissioner Role Setup
**As a** commissioner  
**I want to** start a draft session and share a link with viewers  
**So that** they can watch the draft in real-time on their own devices

**Acceptance Criteria:**
- [ ] Commissioner can start a "Host Session" from the setup screen
- [ ] System generates a unique session ID and shareable link
- [ ] Link can be copied to clipboard with one click
- [ ] Session persists across page refreshes for commissioner
- [ ] Clear visual indicator shows "Hosting Session" status

#### User Story 2: Viewer Join Experience
**As a** viewer  
**I want to** join a draft session using a shared link  
**So that** I can watch the draft progress in real-time

**Acceptance Criteria:**
- [ ] Viewers can enter session ID or click shared link
- [ ] Viewers see a "Joining..." state while connecting
- [ ] Viewers are automatically redirected to draft board once connected
- [ ] Viewers see current draft state immediately upon joining
- [ ] Error message shown if session ID is invalid or expired

#### User Story 3: Role-Based Pick Controls
**As a** commissioner  
**I want to** be the only person who can make picks  
**So that** I maintain control over the draft flow

**As a** viewer  
**I want to** see that I cannot make picks  
**So that** I understand my role is view-only

**Acceptance Criteria:**
- [ ] Commissioner sees all pick controls (search, select, "Pick Movie" button)
- [ ] Viewers see pick controls but they are disabled/grayed out

#### User Story 4: Real-Time State Synchronization
**As a** viewer  
**I want to** see picks update automatically on my screen  
**So that** I don't need to refresh to see the latest draft state


**Acceptance Criteria:**
- [ ] Picks made by commissioner appear on all viewer screens within 2 seconds
- [ ] Timer updates synchronize across all clients
- [ ] Current picker indicator updates in real-time
- [ ] All views (Draft Board, Grid, Matrix, etc.) update simultaneously
- [ ] No manual refresh required for viewers

#### User Story 5: Viewer Navigation
**As a** viewer  
**I want to** navigate between different views (Grid, Matrix, Category, etc.)  
**So that** I can explore the draft from different perspectives

**Acceptance Criteria:**
- [ ] Viewers can access all navigation tabs/buttons
- [ ] Viewers can switch between Draft Board, Grid, Matrix, Member Team, Category views
- [ ] View changes are local to each viewer (not synchronized)
- [ ] All views show real-time draft state updates
- [ ] Navigation works identically for commissioner and viewers

#### User Story 6: Session Management
**As a** commissioner  
**I want to** end the session when the draft is complete  
**So that** viewers know the session is over

**Acceptance Criteria:**
- [ ] Commissioner can manually end session (optional "End Session" button)
- [ ] Session automatically ends when draft is complete
- [ ] Viewers see "Draft Complete" message when session ends
- [ ] Viewers can still view final draft state after session ends
- [ ] Session expires after 24 hours of inactivity (optional)

---

## Technical Approach Options

### Option A: Firebase Realtime Database (Recommended for Speed)
**Pros:**
- Fastest to implement (2-3 days)
- Built-in real-time sync
- Free tier sufficient for 6 users
- No backend code needed
- Automatic conflict resolution

**Cons:**
- External dependency
- Requires Firebase account setup
- Data stored in Google's cloud

**Implementation:**
- Add Firebase SDK
- Replace localStorage with Firebase state
- Use Firebase listeners for real-time updates
- Session ID = Firebase database path

### Option B: WebSocket Server (Node.js + Socket.io)
**Pros:**
- Full control over infrastructure
- Can deploy to same server as static site
- More flexible for future features
- No external dependencies

**Cons:**
- Requires backend development (3-5 days)
- Need hosting for WebSocket server
- More complex error handling
- Need to handle reconnection logic

**Implementation:**
- Create simple Node.js server with Socket.io
- Deploy to Railway/Render/Heroku
- Client connects via WebSocket
- State broadcast on each pick

### Option C: Polling with Shared State (Simplest, Least Real-Time)
**Pros:**
- No backend needed
- Can use GitHub Gist or simple JSON file
- Works with static hosting
- Easiest to implement (1-2 days)

**Cons:**
- Not truly real-time (2-5 second delay)
- Requires external storage (GitHub Gist API)
- Rate limiting concerns
- Less polished UX

**Implementation:**
- Commissioner writes state to GitHub Gist
- Viewers poll Gist every 2-3 seconds
- Session ID = Gist ID

---

## Recommended Approach: Firebase Realtime Database

**Rationale:**
- Best balance of speed and UX
- True real-time updates (< 1 second)
- Free tier handles 6 concurrent users easily
- Minimal code changes required
- Can be implemented in 1 sprint

---

## Sprint Breakdown

### Sprint 1: Core Multi-User Infrastructure

#### Task 1.1: Firebase Setup & Configuration
- [ ] Create Firebase project
- [ ] Add Firebase SDK to project
- [ ] Configure Firebase Realtime Database rules
- [ ] Add environment variables for Firebase config
- [ ] Create Firebase initialization utility

**Estimate:** 2 hours

#### Task 1.2: Session Management System
- [ ] Create `useSession` hook for session lifecycle
- [ ] Add "Host Session" button to SetupScreen
- [ ] Generate unique session IDs
- [ ] Create session creation/joining logic
- [ ] Add session state to draft state

**Estimate:** 4 hours

#### Task 1.3: Role-Based Access Control
- [ ] Add `userRole` to draft state ('commissioner' | 'viewer')
- [ ] Create role detection logic (first to join = commissioner)
- [ ] Add role-based UI conditionals
- [ ] Disable pick controls for viewers
- [ ] Add "View Only" messaging

**Estimate:** 3 hours

#### Task 1.4: State Synchronization
- [ ] Replace localStorage writes with Firebase writes
- [ ] Add Firebase listeners for state updates
- [ ] Handle initial state load from Firebase
- [ ] Implement conflict resolution (last write wins)
- [ ] Add connection status indicator

**Estimate:** 6 hours

#### Task 1.5: UI/UX Polish
- [ ] Add "Hosting Session" indicator
- [ ] Add "Viewer Mode" indicator
- [ ] Style disabled pick controls
- [ ] Add connection status badge
- [ ] Add session link sharing UI

**Estimate:** 3 hours

**Sprint 1 Total:** ~18 hours (2-3 days)

---

### Sprint 2: Edge Cases & Polish (If Needed)

#### Task 2.1: Error Handling
- [ ] Handle connection failures gracefully
- [ ] Add reconnection logic
- [ ] Show offline/online status
- [ ] Handle session expiration
- [ ] Add error boundaries

**Estimate:** 4 hours

#### Task 2.2: Session Lifecycle
- [ ] Add "End Session" functionality
- [ ] Handle commissioner leaving
- [ ] Add session timeout logic
- [ ] Preserve draft state after session ends
- [ ] Add session history (optional)

**Estimate:** 3 hours

#### Task 2.3: Performance Optimization
- [ ] Optimize Firebase reads/writes
- [ ] Debounce rapid state changes
- [ ] Add loading states
- [ ] Optimize re-renders on state updates

**Estimate:** 3 hours

#### Task 2.4: Testing & Documentation
- [ ] Test with 6 concurrent users
- [ ] Test connection edge cases
- [ ] Document Firebase setup process
- [ ] Add user-facing help text

**Estimate:** 2 hours

**Sprint 2 Total:** ~12 hours (1-2 days)

---

## Technical Implementation Details

### Firebase Database Structure

```
/sessions/{sessionId}/
  - draftState: {
      members: [...],
      picks: {...},
      currentPickIndex: 0,
      isSetupComplete: true,
      ...
    }
  - metadata: {
      createdAt: timestamp,
      commissionerId: "user-id",
      isActive: true
    }
```

### State Management Changes

**Current:** `useDraftState` → localStorage  
**New:** `useDraftState` → Firebase (if session active) OR localStorage (if solo mode)

**Key Changes:**
- Add `useSession` hook to manage session lifecycle
- Modify `useDraftState` to sync with Firebase when in session
- Keep localStorage as fallback for solo mode
- Add `userRole` to state

### Component Changes

**SetupScreen.jsx:**
- Add "Host Session" button (new)
- Add "Join Session" input/button (new)
- Show session link when hosting

**DraftBoard.jsx:**
- Conditionally disable pick controls based on role
- Show "View Only" message for viewers

**Navigation.jsx:**
- No changes needed (navigation works for all roles)

**App.jsx:**
- Add session provider/context
- Add connection status indicator

---

## Success Metrics

1. **Functionality:**
   - Commissioner can make picks successfully
   - Viewers see picks within 2 seconds
   - All 6 users can connect simultaneously
   - Navigation works for all users

2. **User Experience:**
   - Clear role indicators (commissioner vs viewer)
   - Smooth real-time updates
   - No manual refresh needed
   - Intuitive session joining flow

3. **Reliability:**
   - Handles connection drops gracefully
   - State remains consistent across clients
   - No data loss during session

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Firebase quota exceeded | High | Monitor usage, implement rate limiting, upgrade plan if needed |
| Connection issues during draft | High | Add reconnection logic, show offline status, allow manual refresh |
| State conflicts | Medium | Use last-write-wins, add conflict resolution UI |
| Session ID sharing complexity | Low | Use QR code generator, copy-to-clipboard, short URLs |
| Viewer confusion about role | Low | Clear UI indicators, disabled controls, help text |

---

## Future Enhancements (Out of Scope)

- Chat feature for viewers
- Viewer reactions/emojis
- Draft replay/history
- Multiple concurrent drafts
- Viewer voting on picks
- Draft analytics dashboard

---

## Questions to Resolve

1. **Session Persistence:** Should sessions persist if commissioner closes browser? (Recommendation: Yes, with rejoin capability)
2. **Viewer Limits:** Maximum number of viewers? (Recommendation: 10-15 for now)
3. **Session Expiration:** How long should sessions last? (Recommendation: 24 hours)
4. **Offline Mode:** Should commissioner be able to continue offline? (Recommendation: No, require connection)
5. **Mobile Support:** Is mobile viewing needed? (Recommendation: Not for MVP, but should work)

---

## Next Steps

1. **Review & Approve** this sprint plan
2. **Choose technical approach** (recommend Firebase)
3. **Set up Firebase project** (if Firebase chosen)
4. **Begin Sprint 1, Task 1.1** (Firebase setup)

---

## Definition of Done

- [ ] Commissioner can start session and share link
- [ ] Viewers can join session via link
- [ ] Commissioner can make picks
- [ ] Viewers see picks in real-time (< 2 second delay)
- [ ] Viewers cannot make picks (controls disabled)
- [ ] Viewers can navigate all views
- [ ] All 6 users can connect simultaneously
- [ ] Connection status visible to all users
- [ ] Works on deployed GitHub Pages site
- [ ] Solo mode still works (backward compatible)

