# Engineering Task: Add Draft Export Feature

## What We're Building

Add the ability to export draft results to a spreadsheet (CSV) for permanent record-keeping. This includes:
1. **Manual Export Button** - Download current draft state as CSV anytime
2. **Auto-Save to Google Sheets** (Optional/Stretch) - Live write picks to a Google Sheet as they happen

---

## Priority 1: CSV Export (Must Have)

### User Story
As a draft operator, I want to export the draft results to a spreadsheet file, so I have a permanent record I can share with the group and reference later.

### Requirements

#### 1. Add Export Button
- **Location:** Navigation bar or as a button in each view (suggest: nav bar for global access)
- **Label:** "Export Draft" or "📥 Export CSV"
- **Visibility:** Always visible once draft has started (hide during setup)
- **State:** Disabled if no picks have been made yet

#### 2. CSV Export Format

Export should generate a CSV file with the following structure:

**Option A: Pick Order Format (Recommended)**
```csv
Pick #,Round,Member,Category,Movie Title,Movie Year
1,1,Coach Josh,Action,The Dark Knight,2008
2,1,Relvis,Comedy,Superbad,2007
3,1,Pittsburgh Matt,Drama,The Shawshank Redemption,1994
...
```

**Option B: Matrix Format (Alternative)**
```csv
Member,Airplane Movies,All Nos,Slow/Boring,Ex US,Ilan's Picks,Wildcard/Faves
Doodie (G),The Dark Knight,Superbad,,,Drive,
Doodie (Z),Inception,,,Parasite,,Pulp Fiction
...
```

**Recommendation:** Include BOTH formats in the export, separated by a blank row, so users get both views.

#### 3. File Naming
- **Format:** `movie-draft-results-YYYY-MM-DD.csv`
- **Example:** `movie-draft-results-2025-12-08.csv`

#### 4. Export Metadata (Header Section)
Include metadata at the top of the CSV:
```csv
Movie Draft Results
Date Exported,2025-12-08
Draft Status,Complete (or "In Progress - 24/36 picks")
Members,"Doodie (G), Doodie (Z), Coach Josh, Relvis, Pittsburgh Matt, Question Marc"

(blank row)
PICKS BY DRAFT ORDER
Pick #,Round,Member,Category,Movie Title,Movie Year
...
```

### Implementation Notes

```javascript
// Utility function to generate CSV
function generateDraftCSV(draftState) {
  const { members, picks, picksOrder, movies, isDraftComplete } = draftState;
  
  const lines = [];
  
  // Metadata
  lines.push('Movie Draft Results');
  lines.push(`Date Exported,${new Date().toISOString().split('T')[0]}`);
  lines.push(`Draft Status,${isDraftComplete ? 'Complete' : `In Progress - ${picksOrder.length}/36 picks`}`);
  lines.push(`Members,"${members.map(m => m.name).join(', ')}"`);
  lines.push('');
  
  // Picks by draft order
  lines.push('PICKS BY DRAFT ORDER');
  lines.push('Pick #,Round,Member,Category,Movie Title,Movie Year');
  
  picksOrder.forEach((pick, index) => {
    const member = members.find(m => m.id === pick.memberId);
    const category = CATEGORIES.find(c => c.id === pick.categoryId);
    const movie = movies.find(m => m.id === pick.movieId);
    const round = Math.floor(index / 6) + 1;
    
    lines.push(`${index + 1},${round},"${member?.name}","${category?.name}","${movie?.title}",${movie?.year || ''}`);
  });
  
  return lines.join('\n');
}

// Trigger download
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
```

### Acceptance Criteria

**Must Have:**
- [ ] Export button visible in navigation (after draft starts)
- [ ] Clicking export downloads a CSV file
- [ ] CSV includes all picks made so far in draft order
- [ ] CSV includes member names, categories, movie titles
- [ ] CSV has descriptive filename with date
- [ ] Works for both in-progress and completed drafts

**Should Have:**
- [ ] CSV includes metadata header (date, status, members)
- [ ] Export button disabled if no picks made
- [ ] Both pick-order and matrix formats included in export

---

## Priority 2: Google Sheets Integration (Stretch Goal)

### User Story
As a draft operator, I want picks to automatically save to a Google Sheet as they happen, so I have a live backup and can share a live view with remote participants.

### Requirements

#### 1. Setup Flow
- User provides a Google Sheet URL or creates a new sheet
- App authenticates via Google OAuth or uses a simple API key approach
- Sheet ID is stored in localStorage

#### 2. Auto-Sync Behavior
- On each pick, append a new row to the Google Sheet
- Include: Pick #, Timestamp, Member, Category, Movie Title
- Handle offline gracefully (queue picks, sync when back online)

#### 3. Manual Sync Button
- "Sync to Sheet" button to force a full sync
- Useful if auto-sync missed picks or for initial setup

### Technical Approach Options

**Option A: Google Sheets API (Requires OAuth)**
- Full read/write access
- Requires Google Cloud project setup
- More complex but most reliable

**Option B: Google Apps Script Web App**
- Create a simple Apps Script that accepts POST requests
- No OAuth needed for the client
- User deploys script, provides URL to app

**Option C: Third-party service (Sheetson, Sheety, etc.)**
- Simple REST API to write to sheets
- May have rate limits or costs

### Recommendation
Start with **Option B (Apps Script)** for simplicity:
1. Provide user with a template Apps Script to deploy
2. User pastes their deployed script URL into the app
3. App POSTs pick data to that URL

### Acceptance Criteria (Stretch)

- [ ] User can configure a Google Sheet connection
- [ ] Picks auto-sync to sheet as they're made
- [ ] Manual "Sync Now" button available
- [ ] Graceful handling of sync failures
- [ ] Clear setup instructions provided

---

## UI/UX Considerations

### Export Button Placement
```
┌─────────────────────────────────────────────────────────────┐
│  Draft Board  │  Board Grid  │  Teams  │  Matrix  │  📥 Export │
└─────────────────────────────────────────────────────────────┘
```
Or as a floating action button / dropdown menu item.

### Export Feedback
- Show brief toast/notification: "Draft exported successfully!"
- If export fails, show error message

### Google Sheets Setup (if implemented)
- Settings modal or dedicated setup section
- Clear instructions with screenshots
- Test connection button

---

## Edge Cases

1. **Empty draft:** Export button disabled or exports metadata only
2. **Partial draft:** Clearly indicate "In Progress" status in export
3. **Special characters in names:** Properly escape quotes in CSV
4. **Very long movie titles:** Should still work, CSV handles it
5. **Browser compatibility:** Use standard Blob/download approach

---

## What NOT to Change

- Draft logic/state management (only read from it)
- Existing views (just add export capability)
- localStorage persistence (this is a separate export feature)

---

## File Structure

```
src/
├── utils/
│   └── exportDraft.js       # NEW: CSV generation and download utilities
├── components/
│   ├── ExportButton.jsx     # NEW: Export button component
│   └── Navigation.jsx       # MODIFY: Add export button
└── hooks/
    └── useDraftState.js     # READ ONLY: No changes needed
```

---

## Estimated Effort

| Feature | Effort |
|---------|--------|
| CSV Export (Priority 1) | 2-3 hours |
| Google Sheets (Priority 2) | 4-6 hours |

**Recommendation:** Ship CSV export first, add Google Sheets integration later if needed.

---

## Open Questions

1. **Export button location:** Nav bar vs. floating button vs. menu dropdown?
2. **CSV format preference:** Pick order only, matrix only, or both?
3. **Google Sheets priority:** Is this needed for launch or can it be post-launch?

---

**Full Spec Available:** See `DRAFT_EXPORT_FEATURE_SPEC.md` for comprehensive details.
