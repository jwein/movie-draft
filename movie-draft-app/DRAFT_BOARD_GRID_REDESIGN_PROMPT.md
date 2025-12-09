# Engineering Task: Redesign Draft Board Grid View

## What We're Changing

Update `DraftBoardGrid.jsx` to remove the category-row organization. Keep member columns, but display picks sequentially as they happen (snaking through columns each round) rather than slotting them into category rows.

## Current State vs. Desired State

**Current:**
- Member columns ✓ (keep this)
- Category rows on the left ✗ (remove this)
- Picks slotted into the intersection of member column + category row ✗ (change this)

**Desired:**
- Member columns ✓ (keep)
- NO category rows (remove the left column entirely)
- Picks populate sequentially in the member's column as they're made
- Snake draft order flows visually: Round 1 fills left→right, Round 2 fills right→left, etc.
- Category appears as a **text overlay** on each movie card (since we no longer have category rows)

## Visual Example

```
Round 1 (L→R):     Member1  Member2  Member3  Member4  Member5  Member6
                   Pick 1   Pick 2   Pick 3   Pick 4   Pick 5   Pick 6

Round 2 (R→L):     Pick 12  Pick 11  Pick 10  Pick 9   Pick 8   Pick 7

Round 3 (L→R):     Pick 13  Pick 14  Pick 15  Pick 16  Pick 17  Pick 18

...and so on for all 6 rounds
```

Each member ends up with 6 picks stacked vertically in their column, but the ORDER they fill follows the snake draft.

## Requirements

### 1. Remove the Category Column
- Delete the sticky left column showing category labels
- Categories are no longer used to organize the grid rows

### 2. Keep Member Columns
- Same 6 member columns across the top (unchanged)
- Each column will have 6 slots (one per round/pick)

### 3. Sequential Pick Display
- Picks fill slots in each member's column **in the order they were drafted**
- Row 1 = Round 1 picks (members 1-6, left to right)
- Row 2 = Round 2 picks (members 6-1, right to left - snake!)
- Row 3 = Round 3 picks (members 1-6, left to right)
- And so on...

### 4. Add Category as Text Overlay
Since we removed category rows, each movie card needs to show its category:
- Add category name as text overlay on the movie poster
- Position: alongside or below the movie title
- Style: distinctive color (amber/yellow) for visibility

## Movie Card Updates

Each filled movie card should display:
- Movie poster (background)
- **Category name** (NEW - text overlay, amber color)
- Movie title (existing - bottom gradient overlay)

Each empty slot should show:
- "(Empty)" or similar placeholder
- Optionally: which member will pick here

## Acceptance Criteria

**Must Have:**
- ✅ Category column on the left is removed
- ✅ Member columns remain (6 columns)
- ✅ Each member has 6 slots (one per round)
- ✅ Picks display in snake draft order (visually snaking L→R, R→L each round)
- ✅ Category name appears as text overlay on each movie card
- ✅ Current pick slot is highlighted

**Should Have:**
- ✅ Category text in distinctive color (amber) for easy scanning
- ✅ Text overlay is readable on all poster backgrounds

## What NOT to Change
- ❌ Matrix View (`MatrixView.jsx`) - leave this unchanged, it keeps the category × member organization
- ❌ Draft logic or state management
- ❌ Member column headers
- ❌ Navigation

## Edge Cases
1. **Empty draft**: Show all 36 empty slots in correct positions
2. **Missing posters**: Placeholder still shows category overlay
3. **Long category names**: Truncate or use smaller font

---

**Estimated Effort:** 2-4 hours

**Scope:** Only `DraftBoardGrid.jsx` - Matrix View stays as-is for category comparison use case.
