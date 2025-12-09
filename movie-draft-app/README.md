# �� Movie Draft App

A locally hosted web application for running a fantasy movie draft among friends. Snake-style draft for 6 members, each drafting movies into 6 categories from a pool of 100 movies.

## Features

- **Setup Screen**: Edit member names and randomize draft order
- **Live Draft Board**: Real-time drafting with search, 2-minute timer, and pick confirmation
- **Snake Draft**: Order reverses each round (1-6, 6-1, 1-6...)
- **Timer with Pause**: 2-minute countdown per pick with pause/resume
- **Undo Support**: Correct mistakes by undoing picks
- **Persistent State**: Draft progress saved to localStorage (survives page refresh)
- **Multiple Views**:
  - Draft Board: Main drafting interface
  - Team View: See all picks for a specific member
  - Matrix View: Category × Member grid comparison
  - Category View: Compare all members' picks in one category

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Fetching Movie Posters

The app needs poster images for the 100 movies. We use TMDB (The Movie Database) API:

1. **Get a free TMDB API key**: https://www.themoviedb.org/settings/api
2. **Create a `.env` file** in the project root with:
   ```
   TMDB_API_KEY=your_api_key_here
   ```
3. **Run the poster fetch script**:
   ```bash
   node scripts/fetch-posters.js
   ```

This will update `src/data/movies.json` with poster URLs. The `.env` file is already in `.gitignore` for security.

## Draft Day Usage

### Option 1: Development Server
```bash
npm run dev
```
Keep the terminal open during the draft.

### Option 2: Static Build (Recommended)
```bash
npm run build
npm run preview
```
Or just open `dist/index.html` directly in a browser.

## Draft Format

- **6 Members**: Doodie (G), Doodie (Z), Coach Josh, Relvis, Pittsburgh Matt, Question Marc
- **6 Categories**: Airplane Movies, All Nos, Slow/Boring, Ex US, Ilan's Picks, Wildcard/Faves
- **100 Movies**: Curated list from your club's 5-year watchlist
- **Snake Draft**: Round 1 goes 1→6, Round 2 goes 6→1, etc.
- **2 Minutes Per Pick**: Timer with pause functionality

## Data Persistence

All draft state is saved to `localStorage` automatically. This means:
- ✅ Refreshing the page keeps your progress
- ✅ Closing and reopening the browser keeps your progress
- ⚠️ Clearing browser data will reset the draft
- ⚠️ Different browsers/devices have separate draft states

To reset the draft, use the "Reset" button in the app.

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- localStorage for persistence
- No backend required

## File Structure

```
src/
├── components/
│   ├── SetupScreen.jsx      # Initial setup with name editing
│   ├── DraftBoard.jsx       # Main drafting interface
│   ├── MemberTeamView.jsx   # Single member's picks
│   ├── MatrixView.jsx       # Full draft grid
│   ├── CategoryView.jsx     # Single category comparison
│   ├── MovieCard.jsx        # Reusable movie poster card
│   ├── Timer.jsx            # Countdown timer display
│   └── Navigation.jsx       # View switcher
├── hooks/
│   ├── useDraftState.js     # Core draft logic + persistence
│   └── useTimer.js          # Timer logic
├── data/
│   ├── movies.json          # 100 movies with poster URLs
│   └── constants.js         # Members, categories, config
└── App.jsx                  # Main app shell
```
