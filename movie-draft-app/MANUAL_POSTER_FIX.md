# Manual Poster Fix Guide

## Quick Method: Use the Helper Script

I've created a helper script that makes it easy to add posters manually. Just run:

```bash
node scripts/add-poster.js "Movie Title" "poster_url_here"
```

## Manual Method: Edit JSON Directly

### Step 1: Find the Poster URL on TMDB

1. Go to https://www.themoviedb.org
2. Search for the movie (e.g., "The Thomas Crown Affair")
3. Click on the correct movie
4. Look at the poster image - right-click it and "Copy Image Address"
5. The URL will look like: `https://image.tmdb.org/t/p/w500/abc123xyz.jpg`

**OR** use the direct search URL format:
- Search: `https://www.themoviedb.org/search/movie?query=Movie%20Title`
- Click the movie → Poster → Right-click → Copy Image Address

### Step 2: Edit movies.json

1. Open `src/data/movies.json`
2. Find the movie (search for the title)
3. Change `"posterUrl": null` to `"posterUrl": "https://image.tmdb.org/t/p/w500/abc123xyz.jpg"`

**Example:**
```json
{
  "id": 58,
  "title": "The Thomas Crown Affair",
  "posterUrl": "https://image.tmdb.org/t/p/w500/abc123xyz.jpg"
}
```

### Step 3: Refresh the App

If your dev server is running, refresh the browser and the poster should appear!

## Current Missing Posters

- "The Thomas Crown Affair" (id: 58)
- "Tree of Life" (id: 66)

## Alternative: Use a Different Image Size

TMDB provides different sizes:
- `w500` - Medium (recommended)
- `w780` - Large
- `original` - Full resolution

Just replace `w500` in the URL with your preferred size.

