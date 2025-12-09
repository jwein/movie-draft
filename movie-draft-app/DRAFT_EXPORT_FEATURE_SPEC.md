# Draft Export Feature - Product Specification

**Date:** December 8, 2025  
**Feature:** Draft Results Export & Google Sheets Integration  
**Priority:** High (CSV Export) / Medium (Google Sheets)  
**Type:** New Feature

---

## 📋 Executive Summary

Add the ability to export draft results for permanent record-keeping. The primary feature is a CSV download that captures all picks in both chronological and matrix formats. A stretch goal is live Google Sheets integration for real-time backup and sharing.

---

## 🎯 User Value Proposition

**Problem:**  
Currently, draft results only exist in the browser's localStorage. If the browser data is cleared, the device changes, or users want to share/archive results, there's no easy way to preserve the draft history.

**Solution:**  
- **CSV Export:** One-click download of draft results as a spreadsheet file
- **Google Sheets (Stretch):** Live sync to a shared Google Sheet for real-time backup and remote viewing

**User Benefit:**
- Permanent record of draft results
- Easy sharing with group members
- Can import into any spreadsheet app for further analysis
- Peace of mind that results won't be lost

---

## 📐 Feature Requirements

### Priority 1: CSV Export (Must Have)

#### 1.1 Export Button

| Attribute | Specification |
|-----------|---------------|
| Location | Navigation bar (rightmost position) |
| Label | "📥 Export" or "Export Draft" |
| Visibility | Visible only after draft has started |
| Disabled State | When no picks have been made |
| Click Action | Downloads CSV file immediately |

#### 1.2 CSV File Structure

The exported CSV should contain multiple sections:

```csv
Movie Draft Results
====================

DRAFT INFORMATION
-----------------
Date Exported,2025-12-08
Time Exported,14:30:25
Draft Status,Complete
Total Picks,36
Members,"Doodie (G), Doodie (Z), Coach Josh, Relvis, Pittsburgh Matt, Question Marc"
Categories,"Airplane Movies, All Nos, Slow/Boring, Ex US, Ilan's Picks, Wildcard/Faves"

PICKS BY DRAFT ORDER
--------------------
Pick #,Round,Direction,Member,Category,Movie Title,Year
1,1,→,Doodie (G),Action,The Dark Knight,2008
2,1,→,Doodie (Z),Comedy,Superbad,2007
3,1,→,Coach Josh,Drama,The Shawshank Redemption,1994
4,1,→,Relvis,Horror,Get Out,2017
5,1,→,Pittsburgh Matt,Sci-Fi,Inception,2010
6,1,→,Question Marc,Romance,La La Land,2016
7,2,←,Question Marc,Action,Mad Max: Fury Road,2015
8,2,←,Pittsburgh Matt,Comedy,The Grand Budapest Hotel,2014
...

RESULTS BY MEMBER (MATRIX VIEW)
-------------------------------
Member,Airplane Movies,All Nos,Slow/Boring,Ex US,Ilan's Picks,Wildcard/Faves
Doodie (G),The Dark Knight,Superbad,Lost in Translation,Parasite,Moonlight,Pulp Fiction
Doodie (Z),Inception,Step Brothers,Drive,Amélie,The Lighthouse,Fight Club
Coach Josh,The Matrix,Anchorman,Her,Pan's Labyrinth,Hereditary,Goodfellas
Relvis,Gladiator,Bridesmaids,Blade Runner 2049,City of God,Midsommar,The Godfather
Pittsburgh Matt,Top Gun: Maverick,The Hangover,No Country for Old Men,Oldboy,Uncut Gems,Schindler's List
Question Marc,Iron Man,Dumb and Dumber,There Will Be Blood,Spirited Away,The Witch,Forrest Gump
```

#### 1.3 File Naming Convention

- **Format:** `movie-draft-results-YYYY-MM-DD-HHmm.csv`
- **Example:** `movie-draft-results-2025-12-08-1430.csv`
- **Rationale:** Timestamp prevents overwriting if multiple exports in same day

#### 1.4 CSV Data Fields

**Picks By Draft Order Section:**
| Field | Description | Example |
|-------|-------------|---------|
| Pick # | Sequential pick number (1-36) | 1 |
| Round | Which round (1-6) | 1 |
| Direction | Snake direction indicator | → or ← |
| Member | Name of member who picked | Coach Josh |
| Category | Category picked for | Action |
| Movie Title | Full movie title | The Dark Knight |
| Year | Movie release year | 2008 |

**Matrix Section:**
- Rows: Members (in draft order)
- Columns: Categories (in order)
- Cells: Movie titles

#### 1.5 Special Character Handling

- Wrap fields containing commas in double quotes
- Escape double quotes by doubling them (`"` → `""`)
- Handle apostrophes and special characters in movie titles

```javascript
// Example: Proper CSV escaping
function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
```

---

### Priority 2: Google Sheets Integration (Stretch Goal)

#### 2.1 Setup Flow

1. **User Action:** Click "Connect Google Sheet" in settings/nav
2. **Modal Appears:** Instructions for setting up Google Apps Script
3. **User Deploys Script:** Copy-paste provided script to their Google Sheet
4. **User Provides URL:** Paste the deployed script URL into the app
5. **App Tests Connection:** Verify the URL works
6. **Connection Saved:** URL stored in localStorage

#### 2.2 Google Apps Script Template

Provide users with this script to deploy:

```javascript
// Google Apps Script - Deploy as Web App
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  if (data.action === 'addPick') {
    sheet.appendRow([
      data.pickNumber,
      data.timestamp,
      data.round,
      data.member,
      data.category,
      data.movieTitle,
      data.movieYear
    ]);
  } else if (data.action === 'fullSync') {
    // Clear and rewrite all data
    sheet.clear();
    sheet.appendRow(['Pick #', 'Timestamp', 'Round', 'Member', 'Category', 'Movie', 'Year']);
    data.picks.forEach(pick => {
      sheet.appendRow([
        pick.pickNumber,
        pick.timestamp,
        pick.round,
        pick.member,
        pick.category,
        pick.movieTitle,
        pick.movieYear
      ]);
    });
  }
  
  return ContentService.createTextOutput(JSON.stringify({ success: true }));
}
```

#### 2.3 Auto-Sync Behavior

| Event | Action |
|-------|--------|
| Pick made | POST new pick to Google Sheet |
| Undo pick | POST delete request (or mark as undone) |
| Manual sync | POST full draft state |
| Connection lost | Queue picks, retry when back online |
| App start | Check for unsynced picks, sync if needed |

#### 2.4 Sync Status Indicator

Show sync status in the UI:
- 🟢 "Synced" - All picks saved to sheet
- 🟡 "Syncing..." - Currently saving
- 🔴 "Offline" - Picks queued for sync
- ⚪ "Not Connected" - No sheet configured

#### 2.5 Settings UI

```
┌─────────────────────────────────────────────────────┐
│  Google Sheets Integration                      [X] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Status: 🟢 Connected                               │
│                                                     │
│  Script URL:                                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ https://script.google.com/macros/s/ABC.../  │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  [Test Connection]  [Sync Now]  [Disconnect]        │
│                                                     │
│  ─────────────────────────────────────────────────  │
│  Setup Instructions:                                │
│  1. Open your Google Sheet                          │
│  2. Go to Extensions > Apps Script                  │
│  3. Paste the provided script (copy below)          │
│  4. Deploy as Web App (Anyone can access)           │
│  5. Copy the URL and paste above                    │
│                                                     │
│  [Copy Script to Clipboard]                         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### File Structure

```
src/
├── utils/
│   ├── exportDraft.js          # CSV generation utilities
│   └── googleSheetsSync.js     # Google Sheets API calls (stretch)
├── components/
│   ├── ExportButton.jsx        # Export button component
│   ├── GoogleSheetsSetup.jsx   # Setup modal (stretch)
│   └── SyncStatus.jsx          # Sync indicator (stretch)
└── hooks/
    └── useGoogleSheets.js      # Sync state management (stretch)
```

### CSV Export Implementation

```javascript
// src/utils/exportDraft.js

import { CATEGORIES } from '../data/constants';

/**
 * Escape a value for CSV format
 */
function escapeCSV(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate CSV content from draft state
 */
export function generateDraftCSV(draftState) {
  const { members, picks, picksOrder, movies, isDraftComplete, categories } = draftState;
  const lines = [];
  const now = new Date();
  
  // Helper to find entities
  const getMovie = (id) => movies.find(m => m.id === id);
  const getMember = (id) => members.find(m => m.id === id);
  const getCategory = (id) => (categories || CATEGORIES).find(c => c.id === id);
  
  // === HEADER ===
  lines.push('Movie Draft Results');
  lines.push('');
  lines.push('DRAFT INFORMATION');
  lines.push(`Date Exported,${now.toISOString().split('T')[0]}`);
  lines.push(`Time Exported,${now.toTimeString().split(' ')[0]}`);
  lines.push(`Draft Status,${isDraftComplete ? 'Complete' : `In Progress (${picksOrder.length}/36 picks)`}`);
  lines.push(`Total Picks,${picksOrder.length}`);
  lines.push(`Members,${escapeCSV(members.map(m => m.name).join(', '))}`);
  lines.push(`Categories,${escapeCSV((categories || CATEGORIES).map(c => c.name).join(', '))}`);
  lines.push('');
  
  // === PICKS BY DRAFT ORDER ===
  lines.push('PICKS BY DRAFT ORDER');
  lines.push('Pick #,Round,Direction,Member,Category,Movie Title,Year');
  
  picksOrder.forEach((pick, index) => {
    const member = getMember(pick.memberId);
    const category = getCategory(pick.categoryId);
    const movie = getMovie(pick.movieId);
    const round = Math.floor(index / 6) + 1;
    const direction = round % 2 === 1 ? '→' : '←';
    
    lines.push([
      index + 1,
      round,
      direction,
      escapeCSV(member?.name || 'Unknown'),
      escapeCSV(category?.name || 'Unknown'),
      escapeCSV(movie?.title || 'Unknown'),
      movie?.year || ''
    ].join(','));
  });
  
  lines.push('');
  
  // === MATRIX VIEW ===
  lines.push('RESULTS BY MEMBER (MATRIX VIEW)');
  const categoryList = categories || CATEGORIES;
  lines.push(['Member', ...categoryList.map(c => escapeCSV(c.name))].join(','));
  
  members.forEach(member => {
    const memberPicks = picks[member.id] || {};
    const row = [escapeCSV(member.name)];
    
    categoryList.forEach(category => {
      const movieId = memberPicks[category.id];
      const movie = movieId ? getMovie(movieId) : null;
      row.push(escapeCSV(movie?.title || ''));
    });
    
    lines.push(row.join(','));
  });
  
  return lines.join('\n');
}

/**
 * Trigger CSV file download
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename() {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  return `movie-draft-results-${date}-${time.slice(0, 4)}.csv`;
}

/**
 * Main export function
 */
export function exportDraft(draftState) {
  const csv = generateDraftCSV(draftState);
  const filename = generateFilename();
  downloadCSV(csv, filename);
  return { success: true, filename };
}
```

### Export Button Component

```jsx
// src/components/ExportButton.jsx

import { exportDraft } from '../utils/exportDraft';

export default function ExportButton({ draftState, className = '' }) {
  const { picksOrder, isSetupComplete } = draftState;
  const hasPicksToExport = picksOrder && picksOrder.length > 0;
  
  const handleExport = () => {
    const result = exportDraft(draftState);
    if (result.success) {
      // Optional: Show success toast
      console.log(`Exported to ${result.filename}`);
    }
  };
  
  // Don't show during setup
  if (!isSetupComplete) return null;
  
  return (
    <button
      onClick={handleExport}
      disabled={!hasPicksToExport}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        hasPicksToExport
          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
      } ${className}`}
      title={hasPicksToExport ? 'Export draft results to CSV' : 'Make some picks first'}
    >
      📥 Export
    </button>
  );
}
```

---

## ✅ Acceptance Criteria

### CSV Export (Priority 1)

**Must Have:**
- [ ] Export button appears in navigation after draft starts
- [ ] Export button is disabled when no picks have been made
- [ ] Clicking export downloads a CSV file to user's device
- [ ] CSV contains all picks in chronological draft order
- [ ] CSV contains matrix view of picks by member/category
- [ ] CSV includes metadata (date, status, members, categories)
- [ ] Filename includes date/time stamp
- [ ] Special characters in movie titles/names are properly escaped
- [ ] Works on Chrome, Firefox, Safari, Edge

**Should Have:**
- [ ] Success feedback after export (toast notification)
- [ ] Snake direction indicator (→ / ←) in pick order section
- [ ] Movie year included in export

**Nice to Have:**
- [ ] Export format options (CSV only vs. include JSON)
- [ ] Keyboard shortcut for export (Ctrl/Cmd + E)

### Google Sheets Integration (Priority 2 - Stretch)

**Must Have (if implemented):**
- [ ] User can configure Google Sheet connection
- [ ] Clear setup instructions provided
- [ ] Picks auto-sync to sheet when made
- [ ] Manual "Sync Now" button available
- [ ] Sync status indicator visible

**Should Have:**
- [ ] Graceful offline handling (queue and retry)
- [ ] Test connection button
- [ ] Disconnect/reset option

---

## 🚨 Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No picks made | Export button disabled |
| Partial draft (e.g., 15/36 picks) | Export works, status shows "In Progress" |
| Draft complete | Export works, status shows "Complete" |
| Movie title contains commas | Properly escaped in CSV |
| Movie title contains quotes | Quotes doubled for CSV escape |
| Member name has special chars | Properly escaped |
| Very long movie title | No truncation, full title exported |
| Browser blocks download | Show error message |
| Google Sheet sync fails | Queue pick, show "Offline" status, retry |
| Apps Script URL invalid | Show error, don't save URL |

---

## 🎨 UI/UX Guidelines

### Export Button States

| State | Appearance |
|-------|------------|
| Default (enabled) | Emerald/green background, white text |
| Hover | Lighter green background |
| Disabled | Gray background, muted text |
| Click feedback | Brief pulse or color change |

### Placement

```
Navigation Bar:
┌──────────────────────────────────────────────────────────────────┐
│ 🎬 Movie Draft │ Board │ Grid │ Teams │ Matrix │ Category │ 📥 Export │
└──────────────────────────────────────────────────────────────────┘
```

### Success Feedback

After successful export, show a brief toast notification:
```
┌─────────────────────────────────────┐
│ ✅ Draft exported successfully!     │
│    movie-draft-results-2025-12-08   │
└─────────────────────────────────────┘
```

---

## 📊 Success Metrics

**User Experience:**
- Export completes in < 1 second
- Downloaded file opens correctly in Excel, Google Sheets, Numbers
- Data is complete and accurate

**Technical:**
- No errors in console during export
- File size is reasonable (< 50KB for full draft)
- Works across all supported browsers

---

## 🔄 What Stays the Same

- All existing views and functionality
- Draft state management (read-only access for export)
- localStorage persistence (export is separate feature)
- Navigation structure (just adding one button)

---

## 📅 Timeline

| Phase | Feature | Effort | Priority |
|-------|---------|--------|----------|
| Phase 1 | CSV Export | 2-3 hours | Must Have |
| Phase 2 | Google Sheets Setup UI | 2-3 hours | Stretch |
| Phase 3 | Auto-Sync Logic | 3-4 hours | Stretch |

**Recommendation:** Ship Phase 1 (CSV Export) first. Evaluate need for Google Sheets integration based on user feedback.

---

## 💬 Open Questions for Product

1. **Export button location:** Nav bar (recommended) or floating action button?
2. **Google Sheets priority:** Required for launch or post-launch enhancement?
3. **Additional export formats:** JSON export for backup/restore?
4. **Import feature:** Ability to restore draft from exported file?

---

## Approval

**Product Manager Sign-off:** ✅ Ready for Engineering  
**Scope:** 
- Phase 1 (CSV Export): Approved for immediate development
- Phase 2-3 (Google Sheets): Pending priority decision
