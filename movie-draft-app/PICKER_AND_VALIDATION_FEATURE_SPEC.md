# Picker Attribution & Category Validation - Product Specification

**Date:** December 8, 2025  
**Feature:** Movie Picker Attribution & Category Eligibility Validation  
**Priority:** High  
**Type:** Data Enhancement + Business Logic

---

## 📋 Executive Summary

Enhance the draft experience with two related features:

1. **Picker Attribution:** Track which movie club member originally introduced each of the 100 movies, and display post-draft statistics showing how many of each picker's movies were selected.

2. **Category Validation:** Restrict three categories (All Nos, Ex US, Ilan's Picks) to only allow drafting from their eligible movie pools, filtering the available movies list accordingly.

---

## 🎯 User Value Proposition

### Picker Attribution

**Problem:** The 100 movies represent 5 years of movie club history, but there's no way to see whose picks were most popular in the draft.

**Solution:** Track the original picker for each movie and show post-draft stats.

**User Benefit:**
- Celebrate whose movie picks were most drafted
- Add fun competitive element ("My picks got drafted the most!")
- Preserve movie club history and context

### Category Validation

**Problem:** Three categories have specific eligibility requirements, but users can currently draft any movie to any category, leading to invalid picks.

**Solution:** Filter the available movies list based on the selected category's eligibility rules.

**User Benefit:**
- Prevents invalid picks
- Reduces confusion during drafting
- Ensures draft integrity

---

## 📐 Feature Requirements

### Feature 1: Picker Attribution

#### 1.1 Data Model

Each movie in `movies.json` will have a `picker` field:

```json
{
  "id": 1,
  "title": "Little Women",
  "year": 2019,
  "posterUrl": "https://...",
  "picker": "Josh"
}
```

#### 1.2 Pickers

There are **7 original pickers** (note: 6 draft members + Ilan who is not drafting):

| Picker | Movie Count |
|--------|-------------|
| Josh | 15 movies |
| Matt | 16 movies |
| Marc | 14 movies |
| Adam | 13 movies |
| Gary | 15 movies |
| Ilan | 12 movies |
| **Total** | **85 movies** |

*Note: Your data shows ~100 movies but counts add to 85. Please verify the full list.*

#### 1.3 Display Rules

| Context | Show Picker? |
|---------|--------------|
| Movie cards during draft | ❌ No |
| Search results | ❌ No |
| Post-draft summary | ✅ Yes |
| CSV export | ✅ Yes |

#### 1.4 Post-Draft Stats Component

After draft completion, display a "Picker Stats" section:

```
┌─────────────────────────────────────────────────────────────┐
│  🎬 Original Picker Stats                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Josh    ████████████░░░░░░░░  8/15 drafted (53%)          │
│  Matt    ██████████░░░░░░░░░░  7/16 drafted (44%)          │
│  Marc    █████████░░░░░░░░░░░  6/14 drafted (43%)          │
│  Adam    ███████░░░░░░░░░░░░░  5/13 drafted (38%)          │
│  Gary    ████████░░░░░░░░░░░░  6/15 drafted (40%)          │
│  Ilan    ██████░░░░░░░░░░░░░░  4/12 drafted (33%)          │
│                                                             │
│  Total: 36/85 movies drafted                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 1.5 Stats Calculation

```javascript
function calculatePickerStats(movies, picksOrder) {
  // Get all drafted movie IDs
  const draftedMovieIds = new Set(picksOrder.map(p => p.movieId));
  
  // Group movies by picker
  const pickerStats = {};
  
  movies.forEach(movie => {
    const picker = movie.picker;
    if (!pickerStats[picker]) {
      pickerStats[picker] = { total: 0, drafted: 0 };
    }
    pickerStats[picker].total++;
    if (draftedMovieIds.has(movie.id)) {
      pickerStats[picker].drafted++;
    }
  });
  
  // Calculate percentages and sort
  return Object.entries(pickerStats)
    .map(([picker, stats]) => ({
      picker,
      total: stats.total,
      drafted: stats.drafted,
      percentage: Math.round((stats.drafted / stats.total) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage);
}
```

---

### Feature 2: Category Validation

#### 2.1 Restricted Categories

| Category ID | Category Name | Eligible Movies | Restriction Type |
|-------------|---------------|-----------------|------------------|
| 1 | Airplane Movies | All 100 | None |
| 2 | All Nos | 30 | Whitelist |
| 3 | Slow/Boring | All 100 | None |
| 4 | Ex US | 34 | Whitelist |
| 5 | Ilan's Picks | 12 | Whitelist |
| 6 | Wildcard/Faves | All 100 | None |

#### 2.2 Data Model

Add eligibility flags to each movie:

```json
{
  "id": 1,
  "title": "Le Samourai",
  "year": 1967,
  "posterUrl": "https://...",
  "picker": "Matt",
  "isAllNos": false,
  "isExUS": true,
  "isIlansPicks": false
}
```

#### 2.3 Filtering Behavior

When user selects a category for their pick:

| Selected Category | Available Movies Shown |
|-------------------|------------------------|
| Airplane Movies | All remaining available |
| All Nos | Only `isAllNos === true` |
| Slow/Boring | All remaining available |
| Ex US | Only `isExUS === true` |
| Ilan's Picks | Only `isIlansPicks === true` |
| Wildcard/Faves | All remaining available |

#### 2.4 Filtering Logic

```javascript
// Add to useDraftState.js or DraftBoard.jsx

const RESTRICTED_CATEGORIES = {
  2: 'isAllNos',      // All Nos
  4: 'isExUS',        // Ex US
  5: 'isIlansPicks',  // Ilan's Picks
};

function getAvailableMoviesForCategory(categoryId, availableMovies) {
  const filterField = RESTRICTED_CATEGORIES[categoryId];
  
  if (filterField) {
    return availableMovies.filter(movie => movie[filterField] === true);
  }
  
  return availableMovies;
}
```

#### 2.5 UI Indicators

**Category Selector Badge:**
Show eligible count on restricted categories:
```
[ ] Airplane Movies
[ ] All Nos (24 eligible)
[ ] Slow/Boring  
[ ] Ex US (28 eligible)
[ ] Ilan's Picks (9 eligible)
[ ] Wildcard/Faves
```

**Available Movies Header:**
When filtered, show context:
```
Available Movies — Showing 24 eligible for "All Nos"
[Search movies...]
```

**Empty State:**
If all eligible movies are drafted:
```
┌─────────────────────────────────────────────────┐
│  No eligible movies remaining for "Ilan's Picks" │
│                                                  │
│  All 12 eligible movies have been drafted.       │
│  Please select a different category.             │
└─────────────────────────────────────────────────┘
```

---

## 📊 Complete Movie Data

### Picker Assignments (100 movies)

```javascript
const MOVIE_PICKER_DATA = {
  "Little Women": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Le Samourai": { picker: "Matt", isAllNos: false, isExUS: true, isIlansPicks: false },
  "In A Lonely Place": { picker: "Marc", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Harakiri": { picker: "Adam", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Jojo Rabbit": { picker: "Gary", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Starman": { picker: "Josh", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Boomerang": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Local Hero": { picker: "Marc", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Sexy Beast": { picker: "Adam", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Zombieland": { picker: "Gary", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Something Wild": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Pain and Glory": { picker: "Matt", isAllNos: false, isExUS: true, isIlansPicks: false },
  "McCabe & Mrs. Miller": { picker: "Marc", isAllNos: false, isExUS: false, isIlansPicks: false },
  "After Hours": { picker: "Adam", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Amos & Andrew": { picker: "Gary", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Lives of Others": { picker: "Josh", isAllNos: true, isExUS: true, isIlansPicks: false },
  "Queen & Slim": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Josie and the Pussycats": { picker: "Marc", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Mother!": { picker: "Adam", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Trial of the Chicago 7": { picker: "Gary", isAllNos: false, isExUS: false, isIlansPicks: false },
  "The Last Detail/Last Flag Flying": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "The American": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Memories of Murder": { picker: "Marc", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Sweet Smell of Success": { picker: "Adam", isAllNos: true, isExUS: false, isIlansPicks: false },
  "First Cow": { picker: "Gary", isAllNos: false, isExUS: false, isIlansPicks: false },
  "The Lavender Hill Mob": { picker: "Josh", isAllNos: true, isExUS: true, isIlansPicks: false },
  "Mangrove": { picker: "Matt", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Repulsion": { picker: "Ilan", isAllNos: false, isExUS: false, isIlansPicks: true },
  "A Touch of Sin": { picker: "Marc", isAllNos: true, isExUS: true, isIlansPicks: false },
  "40 Year Old Version": { picker: "Adam", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Million Dollar Baby": { picker: "Gary", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Sense and Sensibility": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Judas and the Black Messiah": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Justin Timberlake + the Tennessee Kids": { picker: "Ilan", isAllNos: false, isExUS: false, isIlansPicks: true },
  "Malcolm X": { picker: "Marc", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Another Round": { picker: "Adam", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Network": { picker: "Gary", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Love & Basketball": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Chungking Express": { picker: "Matt", isAllNos: false, isExUS: true, isIlansPicks: false },
  "The Imaginarium of Doctor Parnassus": { picker: "Ilan", isAllNos: true, isExUS: false, isIlansPicks: true },
  "Days of Heaven": { picker: "Marc", isAllNos: false, isExUS: false, isIlansPicks: false },
  "French Connection": { picker: "Adam", isAllNos: false, isExUS: false, isIlansPicks: false },
  "The Hit": { picker: "Gary", isAllNos: false, isExUS: true, isIlansPicks: false },
  "To Live and Die in LA": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Night Moves": { picker: "Matt", isAllNos: true, isExUS: false, isIlansPicks: false },
  "State of Grace": { picker: "Ilan", isAllNos: false, isExUS: false, isIlansPicks: true },
  "High and Low": { picker: "Marc", isAllNos: false, isExUS: true, isIlansPicks: false },
  "The Long Good Friday": { picker: "Adam", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Down by Law": { picker: "Gary", isAllNos: true, isExUS: false, isIlansPicks: false },
  "They Live": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Let the Sunshine In": { picker: "Matt", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Ghost in the Shell": { picker: "Ilan", isAllNos: false, isExUS: true, isIlansPicks: true },
  "The Velvet Underground": { picker: "Marc", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Night Shift": { picker: "Adam", isAllNos: true, isExUS: false, isIlansPicks: false },
  "In the Heat of the Night": { picker: "Ilan", isAllNos: false, isExUS: false, isIlansPicks: true },
  "Jungle Fever": { picker: "Ilan", isAllNos: false, isExUS: false, isIlansPicks: true },
  "The Last Picture Show": { picker: "Gary", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Broadcast News": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "The Thomas Crown Affair (1968)": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Red Rock West": { picker: "Ilan", isAllNos: false, isExUS: false, isIlansPicks: true },
  "Buffalo Bill and the Indians, or Sitting Bull's History Lesson": { picker: "Marc", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Bob Roberts": { picker: "Adam", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Fabulous Baker Boys": { picker: "Gary", isAllNos: false, isExUS: false, isIlansPicks: false },
  "My Dinner with Andre": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Blue Collar": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Don't Look Now": { picker: "Ilan", isAllNos: false, isExUS: true, isIlansPicks: true },
  "Tree of Life": { picker: "Marc", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Triangle of Sadness": { picker: "Adam", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Murder on the Orient Express": { picker: "Gary", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Munich": { picker: "Josh", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Moonlight": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "The Conformist": { picker: "Marc", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Roma": { picker: "Adam", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Tampopo": { picker: "Gary", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Beau is Afraid": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Pretty Baby": { picker: "Matt", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Carnal Knowledge": { picker: "Marc", isAllNos: true, isExUS: false, isIlansPicks: false },
  "The Straight Story": { picker: "Adam", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Withnail and I": { picker: "Gary", isAllNos: false, isExUS: true, isIlansPicks: false },
  "The Heartbreak Kid": { picker: "Josh", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Killers of the Flower Moon": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Babylon": { picker: "Adam", isAllNos: false, isExUS: false, isIlansPicks: false },
  "The Boy and the Heron": { picker: "Marc", isAllNos: false, isExUS: true, isIlansPicks: false },
  "In the Loop": { picker: "Gary", isAllNos: true, isExUS: true, isIlansPicks: false },
  "Shampoo": { picker: "Josh", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Drive away Dolls": { picker: "Matt", isAllNos: false, isExUS: false, isIlansPicks: false },
  "The Secret in Their Eyes": { picker: "Ilan", isAllNos: false, isExUS: true, isIlansPicks: true },
  "Do Not Expect Too Much From the End of the World": { picker: "Marc", isAllNos: false, isExUS: true, isIlansPicks: false },
  "The Favourite": { picker: "Adam", isAllNos: false, isExUS: true, isIlansPicks: false },
  "True Stories": { picker: "Gary", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Heat": { picker: "Josh", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Marie Antoinette": { picker: "Matt", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Kneecap": { picker: "Ilan", isAllNos: false, isExUS: true, isIlansPicks: true },
  "Mulholland Drive": { picker: "Marc", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Mishima: A Life in Four Chapters": { picker: "Adam", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Still Walking": { picker: "Gary", isAllNos: false, isExUS: true, isIlansPicks: false },
  "Silence": { picker: "Josh", isAllNos: true, isExUS: true, isIlansPicks: false },
  "Near Dark": { picker: "Matt", isAllNos: true, isExUS: false, isIlansPicks: false },
  "Old Boy": { picker: "Ilan", isAllNos: true, isExUS: true, isIlansPicks: true },
  "One Battle After Another": { picker: "Marc", isAllNos: false, isExUS: false, isIlansPicks: false },
  "Cloud Atlas": { picker: "Adam", isAllNos: true, isExUS: false, isIlansPicks: false }
};
```

---

## ✅ Acceptance Criteria

### Picker Attribution

- [ ] Each movie in `movies.json` has a `picker` field
- [ ] Picker is NOT shown on movie cards during drafting
- [ ] Post-draft view shows picker stats with:
  - Picker name
  - Movies drafted count / total movies count
  - Percentage drafted
  - Visual progress bar
- [ ] Stats are sorted by percentage (highest first)
- [ ] Stats only visible after draft is complete
- [ ] Picker included in CSV export

### Category Validation

- [ ] Each movie has `isAllNos`, `isExUS`, `isIlansPicks` boolean fields
- [ ] "All Nos" category shows only eligible movies (30)
- [ ] "Ex US" category shows only eligible movies (34)
- [ ] "Ilan's Picks" category shows only eligible movies (12)
- [ ] Other categories show all available movies
- [ ] UI shows count of eligible movies for restricted categories
- [ ] Empty state shown when all eligible movies are drafted
- [ ] Filtering updates immediately when category selection changes

---

## 🚨 Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| All eligible movies drafted for a category | Show empty state message, suggest different category |
| Movie eligible for multiple restricted categories | Works correctly (flags are independent) |
| Undo pick in restricted category | Movie returns to filtered list |
| Search within filtered list | Search applies to already-filtered results |
| Switch from restricted to unrestricted category | Show full available list |
| Draft complete with 0 of a picker's movies drafted | Show "0/X drafted (0%)" |

---

## 🔧 Technical Implementation

### Files to Modify

```
src/
├── data/
│   └── movies.json                    # ADD: picker, isAllNos, isExUS, isIlansPicks
├── components/
│   ├── DraftBoard.jsx                 # MODIFY: Filter movies by category
│   ├── PickerStats.jsx                # NEW: Post-draft picker statistics
│   └── Navigation.jsx                 # MODIFY: Show picker stats link when draft complete
├── hooks/
│   └── useDraftState.js               # MODIFY: Add filtering helper
└── utils/
    └── exportDraft.js                 # MODIFY: Include picker in export
```

### Component: PickerStats.jsx

```jsx
export default function PickerStats({ draftState }) {
  const { movies, picksOrder, isDraftComplete } = draftState;
  
  if (!isDraftComplete) return null;
  
  const stats = calculatePickerStats(movies, picksOrder);
  
  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <h3 className="text-xl font-bold text-white mb-4">
        🎬 Original Picker Stats
      </h3>
      
      <div className="space-y-3">
        {stats.map(({ picker, drafted, total, percentage }) => (
          <div key={picker} className="flex items-center gap-4">
            <span className="w-16 text-slate-300 font-medium">{picker}</span>
            <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-slate-400 text-sm w-32 text-right">
              {drafted}/{total} ({percentage}%)
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-700 text-slate-400 text-sm">
        Total: {picksOrder.length} of {movies.length} movies drafted
      </div>
    </div>
  );
}
```

---

## 📅 Timeline

| Task | Effort |
|------|--------|
| Update movies.json with all data | 1-2 hours |
| Category filtering logic in useDraftState | 1 hour |
| Update DraftBoard to use filtered list | 1 hour |
| Filtered list UI indicators | 30 min |
| PickerStats component | 1-2 hours |
| Update CSV export | 30 min |
| Testing all scenarios | 1 hour |
| **Total** | **6-8 hours** |

---

## 🔄 Integration with Other Features

### Export Feature
- Add `picker` column to "Picks by Draft Order" section
- Add "Picker Stats" summary section at end of CSV

### Grid Redesign
- No impact - filtering happens before display regardless of layout

---

## Approval

**Product Manager Sign-off:** ✅ Ready for Engineering  
**Dependencies:** None - can be implemented independently  
**Scope:** Data model update + filtering logic + post-draft stats display
