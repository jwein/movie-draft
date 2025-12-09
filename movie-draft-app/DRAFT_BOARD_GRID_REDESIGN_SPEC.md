# Draft Board Grid Redesign - Product Specification

**Date:** December 8, 2025  
**Feature:** Sequential Snake Draft Display (Remove Category Rows)  
**Component:** `DraftBoardGrid.jsx`  
**Priority:** High  
**Type:** UI/UX Enhancement

---

## 📋 Executive Summary

Simplify the Draft Board Grid view by removing the category-row organization. Keep member columns intact, but display picks sequentially in the order they were made (following the snake draft pattern). Categories will appear as text overlays on each movie card instead of as row labels.

---

## 🎯 User Value Proposition

**Current State:**  
The Draft Board Grid displays picks in a category-row × member-column matrix. Each pick is slotted into the intersection where its category row meets its member column. A sticky left column shows category labels.

**Desired State:**  
- Member columns remain (6 columns, one per member)
- Category rows are **removed** (no left column)
- Picks fill each member's column **sequentially** as they're made
- The snake draft order is visually apparent: Round 1 fills L→R, Round 2 fills R→L, etc.
- Category information moves to a **text overlay** on each movie card

**User Benefit:**  
- Cleaner, simpler layout without the category column
- Visual representation of the snake draft flow
- Each member's picks are still grouped in their column
- Category context is preserved via overlays

---

## 📐 Design Requirements

### Current Layout (Before)

```
           | Member1 | Member2 | Member3 | Member4 | Member5 | Member6 |
|----------|---------|---------|---------|---------|---------|---------|
| Action   | Movie   | Movie   | (empty) | Movie   | (empty) | Movie   |
| Comedy   | (empty) | Movie   | Movie   | (empty) | Movie   | (empty) |
| Drama    | Movie   | (empty) | Movie   | Movie   | (empty) | Movie   |
| Horror   | ...     | ...     | ...     | ...     | ...     | ...     |
| Sci-Fi   | ...     | ...     | ...     | ...     | ...     | ...     |
| Romance  | ...     | ...     | ...     | ...     | ...     | ...     |
```

### New Layout (After)

```
           | Member1 | Member2 | Member3 | Member4 | Member5 | Member6 |
|----------|---------|---------|---------|---------|---------|---------|
| Round 1  | Pick 1  | Pick 2  | Pick 3  | Pick 4  | Pick 5  | Pick 6  |
| Round 2  | Pick 12 | Pick 11 | Pick 10 | Pick 9  | Pick 8  | Pick 7  |  ← Snake!
| Round 3  | Pick 13 | Pick 14 | Pick 15 | Pick 16 | Pick 17 | Pick 18 |
| Round 4  | Pick 24 | Pick 23 | Pick 22 | Pick 21 | Pick 20 | Pick 19 |  ← Snake!
| Round 5  | Pick 25 | Pick 26 | Pick 27 | Pick 28 | Pick 29 | Pick 30 |
| Round 6  | Pick 36 | Pick 35 | Pick 34 | Pick 33 | Pick 32 | Pick 31 |  ← Snake!
```

**Note:** "Round 1", "Round 2" etc. are NOT displayed as row labels - they're just shown here to illustrate the concept. The grid has no left column.

---

### Layout Changes

#### 1. Remove Category Column
- **DELETE:** The sticky left column showing category names
- **REASON:** Categories no longer determine row placement

#### 2. Keep Member Columns
- **KEEP:** 6 member columns with headers showing member names
- **KEEP:** "On the Clock" indicator for current picker
- **KEEP:** Column highlighting for current picker

#### 3. Sequential Row Population
- Each member column has 6 slots (one per round)
- Slots fill in **draft order**, not category order
- **Row 1:** Round 1 picks - fills left to right (Pick 1-6)
- **Row 2:** Round 2 picks - fills right to left (Pick 7-12, snake!)
- **Row 3:** Round 3 picks - fills left to right (Pick 13-18)
- **Row 4:** Round 4 picks - fills right to left (Pick 19-24, snake!)
- **Row 5:** Round 5 picks - fills left to right (Pick 25-30)
- **Row 6:** Round 6 picks - fills right to left (Pick 31-36, snake!)

#### 4. Category as Text Overlay
Since we removed category rows, each movie card must display its category:

**On filled movie cards:**
- Category name as text overlay
- Position: Below or alongside the movie title in the gradient area
- Style: Distinctive color (amber-400 or yellow-400) for visibility
- Example: Card shows poster, then at bottom: "The Dark Knight" with "Action" in amber below/beside it

**On empty slots:**
- Keep current "(Empty)" placeholder styling
- No category shown (category is determined at pick time)

---

## 🔧 Technical Implementation Notes

### Data Structure

The component needs to track picks by round/position rather than by category:

```javascript
// For each member, get their picks in the order they were made
// The draftOrder array already contains this information

// Example: Get picks for display
const getPicksForMember = (memberId) => {
  // Filter draftOrder for this member's picks
  // Return in the order they appear in draftOrder
  return draftOrder
    .map((pick, index) => ({ ...pick, pickNumber: index + 1 }))
    .filter(pick => pick.memberId === memberId);
};

// For each round, determine which slot in each column gets filled
// Round 1 (picks 0-5): columns fill L→R
// Round 2 (picks 6-11): columns fill R→L (snake)
// etc.
```

### Rendering Logic

```javascript
// For each row (round), determine column order
const getColumnOrderForRound = (roundIndex) => {
  // Even rounds (0, 2, 4): left to right
  // Odd rounds (1, 3, 5): right to left (snake)
  return roundIndex % 2 === 0 
    ? members 
    : [...members].reverse();
};

// Build the grid by rounds
const rounds = [0, 1, 2, 3, 4, 5].map(roundIndex => {
  const startPick = roundIndex * 6;
  const columnOrder = getColumnOrderForRound(roundIndex);
  
  return columnOrder.map((member, colIndex) => {
    const pickIndex = startPick + colIndex;
    const pickInfo = draftOrder[pickIndex];
    // ... get movie and category info
  });
});
```

---

## ✅ Acceptance Criteria

### Must Have:
- [ ] Category column (left side) is completely removed
- [ ] Member columns remain with 6 slots each
- [ ] Picks display in snake draft order (L→R, R→L alternating by round)
- [ ] Category name appears as text overlay on each filled movie card
- [ ] Current pick slot is visually highlighted
- [ ] Movie posters and titles display correctly

### Should Have:
- [ ] Category text uses distinctive color (amber/yellow)
- [ ] Text overlays are readable on all poster backgrounds
- [ ] Empty slots are clearly differentiated from filled slots

### Nice to Have:
- [ ] Visual indication of snake direction per row
- [ ] Round numbers or pick numbers displayed subtly

---

## 🎨 Visual Design Guidelines

### Movie Card with Category Overlay:
```
┌─────────────────────┐
│                     │
│   [Movie Poster]    │
│                     │
│                     │
├─────────────────────┤  ← Gradient overlay
│ The Dark Knight     │  ← White, bold
│ Action              │  ← Amber-400, smaller
└─────────────────────┘
```

### Color Scheme:
- **Category text:** amber-400 or yellow-400
- **Movie title:** white, bold
- **Background gradient:** black/transparent gradient for readability
- **Current pick highlight:** amber border/glow (existing behavior)

---

## 🚨 Edge Cases

### Edge Case 1: Empty Draft (No Picks Yet)
**Scenario:** Draft just started, no picks made  
**Solution:** Show all 36 empty slots in correct grid positions, first slot highlighted

### Edge Case 2: Partial Draft
**Scenario:** Some picks made, some slots empty  
**Solution:** Filled slots show movie + category, empty slots show "(Empty)"

### Edge Case 3: Missing Poster
**Scenario:** Movie poster unavailable  
**Solution:** Placeholder background with category overlay still visible

### Edge Case 4: Long Category Names
**Scenario:** Custom category name is very long  
**Solution:** Truncate with ellipsis or reduce font size

---

## 🔄 What Stays the Same

- **Matrix View (`MatrixView.jsx`):** Unchanged - keeps category × member organization
- **Draft Board (`DraftBoard.jsx`):** Unchanged - main drafting interface
- **Member Team View:** Unchanged
- **Category View:** Unchanged
- **Draft logic/state:** Unchanged
- **Navigation:** Unchanged

---

## 🎯 User Stories

**As a draft participant**, I want to see each member's picks in their column ordered by when they picked, so I can follow the draft flow naturally.

**As the draft operator**, I want to see the snake pattern visually (picks flowing L→R then R→L), so I can confirm the draft order is correct.

**As a viewer**, I want to see what category each pick was for without needing a separate column, so the layout is cleaner.

---

## 📅 Timeline

**Estimated Effort:** 2-4 hours  
**Includes:**
- Remove category column
- Restructure grid rendering logic
- Add category overlay to movie cards
- Test across all draft states

---

## Approval

**Product Manager Sign-off:** ✅ Ready for Engineering  
**Scope:** `DraftBoardGrid.jsx` only - Matrix View unchanged
