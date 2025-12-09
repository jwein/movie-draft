# Engineering Task: Picker Attribution & Category Validation

## Overview

Two related features to enhance the draft experience:

1. **Picker Attribution** - Track which club member originally introduced each movie, show stats after draft
2. **Category Validation** - Restrict certain categories to only allow eligible movies

---

## Feature 1: Picker Attribution

### Background
The 100 movies come from a 5-year movie club where members take turns picking films. Each movie has an original "picker" who introduced it to the club.

### Pickers (7 people)
- Josh, Matt, Marc, Adam, Gary, Ilan
- Note: Ilan is NOT one of the 6 draft members, but was a movie picker

### Data Model Update

Update `movies.json` to include a `picker` field:

```json
{
  "id": 1,
  "title": "Little Women",
  "year": 2019,
  "posterUrl": "...",
  "picker": "Josh"
}
```

### Where to Display

**NOT during drafting** - Don't show picker on movie cards during the draft

**Post-Draft Summary View** - After draft is complete, show a breakdown:
```
Original Picker Stats
─────────────────────
Josh:  8 of 15 movies drafted (53%)
Matt:  7 of 16 movies drafted (44%)
Marc:  6 of 14 movies drafted (43%)
Adam:  5 of 13 movies drafted (38%)
Gary:  6 of 15 movies drafted (40%)
Ilan:  4 of 12 movies drafted (33%)
```

### Implementation

1. **Update `movies.json`** with picker data (see data section below)
2. **Create post-draft stats component** that calculates:
   - Total movies per picker in the pool
   - How many of each picker's movies were drafted
   - Percentage drafted
3. **Display location:** New section on the draft complete screen or as a tab in post-draft views

### Acceptance Criteria

- [ ] Each movie in `movies.json` has a `picker` field
- [ ] Post-draft view shows picker attribution stats
- [ ] Stats show: picker name, movies drafted / total movies, percentage
- [ ] Stats are only visible after draft is complete (not during)

---

## Feature 2: Category Validation

### Background
Three categories have restricted movie pools - only certain movies are eligible:

| Category | Eligible Movies | Description |
|----------|-----------------|-------------|
| All Nos | 30 movies | Movies that received low ratings |
| Ex US | 34 movies | Non-US films |
| Ilan's Picks | 12 movies | Specific curated list |

### Validation Behavior

**Option A (Selected): Filter Only**
- When a restricted category is selected, the available movies grid shows ONLY eligible movies
- Ineligible movies are hidden entirely (not grayed out)
- Clear UX indication that the list is filtered

### Data Model Update

Add category eligibility flags to each movie in `movies.json`:

```json
{
  "id": 1,
  "title": "Le Samourai",
  "year": 1967,
  "posterUrl": "...",
  "picker": "Matt",
  "isAllNos": false,
  "isExUS": true,
  "isIlansPicks": false
}
```

Or use an array approach:
```json
{
  "id": 1,
  "title": "Le Samourai",
  "eligibleCategories": ["exUS"]  // Values: "allNos", "exUS", "ilansPicks"
}
```

**Recommendation:** Use boolean flags for clarity and easier filtering.

### Category IDs (from constants.js)
```javascript
export const CATEGORIES = [
  { id: 1, name: 'Airplane Movies' },      // No restrictions
  { id: 2, name: 'All Nos' },              // RESTRICTED
  { id: 3, name: 'Slow/Boring' },          // No restrictions
  { id: 4, name: 'Ex US' },                // RESTRICTED
  { id: 5, name: "Ilan's Picks" },         // RESTRICTED
  { id: 6, name: 'Wildcard/Faves' },       // No restrictions
];
```

### Filtering Logic

```javascript
// In DraftBoard.jsx or useDraftState.js

const getAvailableMoviesForCategory = (categoryId, availableMovies) => {
  // Category 2: All Nos - only show isAllNos === true
  if (categoryId === 2) {
    return availableMovies.filter(m => m.isAllNos);
  }
  
  // Category 4: Ex US - only show isExUS === true
  if (categoryId === 4) {
    return availableMovies.filter(m => m.isExUS);
  }
  
  // Category 5: Ilan's Picks - only show isIlansPicks === true
  if (categoryId === 5) {
    return availableMovies.filter(m => m.isIlansPicks);
  }
  
  // All other categories: show all available movies
  return availableMovies;
};
```

### UX Considerations

1. **Visual indicator** when list is filtered:
   ```
   Available Movies (12 eligible for "Ilan's Picks")
   ```
   
2. **Category badge** on restricted categories:
   ```
   Ilan's Picks (12 eligible) ✓
   ```

3. **Empty state** if all eligible movies are taken:
   ```
   No eligible movies remaining for this category.
   Consider picking a different category first.
   ```

### Acceptance Criteria

- [ ] Movies have eligibility flags (`isAllNos`, `isExUS`, `isIlansPicks`)
- [ ] Selecting "All Nos" category filters to only show eligible movies
- [ ] Selecting "Ex US" category filters to only show eligible movies
- [ ] Selecting "Ilan's Picks" category filters to only show eligible movies
- [ ] Other categories (Airplane, Slow/Boring, Wildcard) show all available movies
- [ ] UI indicates when list is filtered and how many movies are eligible
- [ ] Handles edge case where no eligible movies remain

---

## Data: Movie Picker Mapping

Here's the complete picker data to add to `movies.json`:

```javascript
const PICKER_DATA = {
  "Little Women": "Josh",
  "Le Samourai": "Matt",
  "In A Lonely Place": "Marc",
  "Harakiri": "Adam",
  "Jojo Rabbit": "Gary",
  "Starman": "Josh",
  "Boomerang": "Matt",
  "Local Hero": "Marc",
  "Sexy Beast": "Adam",
  "Zombieland": "Gary",
  "Something Wild": "Josh",
  "Pain and Glory": "Matt",
  "McCabe & Mrs. Miller": "Marc",
  "After Hours": "Adam",
  "Amos & Andrew": "Gary",
  "Lives of Others": "Josh",
  "Queen & Slim": "Matt",
  "Josie and the Pussycats": "Marc",
  "Mother!": "Adam",
  "Trial of the Chicago 7": "Gary",
  "The Last Detail/Last Flag Flying": "Josh",
  "The American": "Matt",
  "Memories of Murder": "Marc",
  "Sweet Smell of Success": "Adam",
  "First Cow": "Gary",
  "The Lavender Hill Mob": "Josh",
  "Mangrove": "Matt",
  "Repulsion": "Ilan",
  "A Touch of Sin": "Marc",
  "40 Year Old Version": "Adam",
  "Million Dollar Baby": "Gary",
  "Sense and Sensibility": "Josh",
  "Judas and the Black Messiah": "Matt",
  "Justin Timberlake + the Tennessee Kids": "Ilan",
  "Malcolm X": "Marc",
  "Another Round": "Adam",
  "Network": "Gary",
  "Love & Basketball": "Josh",
  "Chungking Express": "Matt",
  "The Imaginarium of Doctor Parnassus": "Ilan",
  "Days of Heaven": "Marc",
  "French Connection": "Adam",
  "The Hit": "Gary",
  "To Live and Die in LA": "Josh",
  "Night Moves": "Matt",
  "State of Grace": "Ilan",
  "High and Low": "Marc",
  "The Long Good Friday": "Adam",
  "Down by Law": "Gary",
  "They Live": "Josh",
  "Let the Sunshine In": "Matt",
  "Ghost in the Shell": "Ilan",
  "The Velvet Underground": "Marc",
  "Night Shift": "Adam",
  "In the Heat of the Night": "Ilan",
  "Jungle Fever": "Ilan",
  "The Last Picture Show": "Gary",
  "Broadcast News": "Josh",
  "The Thomas Crown Affair (1968)": "Matt",
  "Red Rock West": "Ilan",
  "Buffalo Bill and the Indians, or Sitting Bull's History Lesson": "Marc",
  "Bob Roberts": "Adam",
  "Fabulous Baker Boys": "Gary",
  "My Dinner with Andre": "Josh",
  "Blue Collar": "Matt",
  "Don't Look Now": "Ilan",
  "Tree of Life": "Marc",
  "Triangle of Sadness": "Adam",
  "Murder on the Orient Express": "Gary",
  "Munich": "Josh",
  "Moonlight": "Matt",
  "The Conformist": "Marc",
  "Roma": "Adam",
  "Tampopo": "Gary",
  "Beau is Afraid": "Josh",
  "Pretty Baby": "Matt",
  "Carnal Knowledge": "Marc",
  "The Straight Story": "Adam",
  "Withnail and I": "Gary",
  "The Heartbreak Kid": "Josh",
  "Killers of the Flower Moon": "Matt",
  "Babylon": "Adam",
  "The Boy and the Heron": "Marc",
  "In the Loop": "Gary",
  "Shampoo": "Josh",
  "Drive away Dolls": "Matt",
  "The Secret in Their Eyes": "Ilan",
  "Do Not Expect Too Much From the End of the World": "Marc",
  "The Favourite": "Adam",
  "True Stories": "Gary",
  "Heat": "Josh",
  "Marie Antoinette": "Matt",
  "Kneecap": "Ilan",
  "Mulholland Drive": "Marc",
  "Mishima: A Life in Four Chapters": "Adam",
  "Still Walking": "Gary",
  "Silence": "Josh",
  "Near Dark": "Matt",
  "Old Boy": "Ilan",
  "One Battle After Another": "Marc",
  "Cloud Atlas": "Adam"
};
```

---

## Data: Category Eligibility Lists

### All Nos (30 movies)
```javascript
const ALL_NOS_MOVIES = [
  "Starman",
  "Amos & Andrew",
  "Lives of Others",
  "Josie and the Pussycats",
  "Mother!",
  "Sweet Smell of Success",
  "The Lavender Hill Mob",
  "A Touch of Sin",
  "40 Year Old Version",
  "The Imaginarium of Doctor Parnassus",
  "Night Moves",
  "Down by Law",
  "The Velvet Underground",
  "Night Shift",
  "Buffalo Bill and the Indians, or Sitting Bull's History Lesson",
  "Bob Roberts",
  "Tree of Life",
  "Munich",
  "Pretty Baby",
  "Carnal Knowledge",
  "The Straight Story",
  "The Heartbreak Kid",
  "In the Loop",
  "Shampoo",
  "True Stories",
  "Marie Antoinette",
  "Silence",
  "Near Dark",
  "Old Boy",
  "Cloud Atlas"
];
```

### Ilan's Picks (12 movies)
```javascript
const ILANS_PICKS_MOVIES = [
  "Repulsion",
  "Justin Timberlake + the Tennessee Kids",
  "The Imaginarium of Doctor Parnassus",
  "State of Grace",
  "Ghost in the Shell",
  "In the Heat of the Night",
  "Jungle Fever",
  "Red Rock West",
  "Don't Look Now",
  "The Secret in Their Eyes",
  "Kneecap",
  "Old Boy"
];
```

### Ex US (34 movies)
```javascript
const EX_US_MOVIES = [
  "Le Samourai",
  "Harakiri",
  "Jojo Rabbit",
  "Local Hero",
  "Sexy Beast",
  "Pain and Glory",
  "Lives of Others",
  "Memories of Murder",
  "The Lavender Hill Mob",
  "Mangrove",
  "A Touch of Sin",
  "Another Round",
  "Chungking Express",
  "The Hit",
  "High and Low",
  "The Long Good Friday",
  "Let the Sunshine In",
  "Ghost in the Shell",
  "Don't Look Now",
  "Triangle of Sadness",
  "The Conformist",
  "Roma",
  "Tampopo",
  "Withnail and I",
  "The Boy and the Heron",
  "In the Loop",
  "The Secret in Their Eyes",
  "Do Not Expect Too Much From the End of the World",
  "The Favourite",
  "Kneecap",
  "Mishima: A Life in Four Chapters",
  "Still Walking",
  "Silence",
  "Old Boy"
];
```

---

## Implementation Steps

### Step 1: Update movies.json
Add to each movie object:
- `picker`: string (Josh, Matt, Marc, Adam, Gary, or Ilan)
- `isAllNos`: boolean
- `isExUS`: boolean  
- `isIlansPicks`: boolean

### Step 2: Update DraftBoard filtering
- Modify the available movies display to filter based on selected category
- Add UI indicator showing filtered count

### Step 3: Create Post-Draft Stats Component
- Calculate picker attribution stats
- Display after draft is complete
- Include in export CSV

### Step 4: Update Export
- Add `picker` column to CSV export
- Add picker stats summary section

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| All eligible movies for a category are drafted | Show "No eligible movies remaining" message |
| User switches from restricted to unrestricted category | Show full available list again |
| Movie is eligible for multiple restricted categories | Works fine - flags are independent |
| Undo pick in restricted category | Movie returns to filtered list |

---

## Estimated Effort

| Task | Effort |
|------|--------|
| Update movies.json with all data | 1-2 hours |
| Category filtering logic | 1-2 hours |
| Filtered list UI indicator | 30 min |
| Post-draft picker stats component | 1-2 hours |
| Update CSV export | 30 min |
| **Total** | **4-6 hours** |

---

## Files to Modify

```
src/
├── data/
│   └── movies.json              # ADD: picker, isAllNos, isExUS, isIlansPicks
├── components/
│   ├── DraftBoard.jsx           # MODIFY: Filter available movies by category
│   ├── PickerStats.jsx          # NEW: Post-draft attribution stats
│   └── DraftComplete.jsx        # MODIFY: Include PickerStats (or add to existing view)
├── hooks/
│   └── useDraftState.js         # MODIFY: Add getAvailableMoviesForCategory helper
└── utils/
    └── exportDraft.js           # MODIFY: Include picker in export
```

---

## Open Questions

1. **Picker stats display:** Separate view/tab, or section on draft complete screen?
2. **Filtering indicator:** Badge on category selector, or text above movie grid, or both?
3. **Export format:** Include picker column in pick-order section, matrix section, or both?

---

**Full Spec Available:** See `PICKER_AND_VALIDATION_FEATURE_SPEC.md` for comprehensive details.
