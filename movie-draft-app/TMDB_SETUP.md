# TMDB API Setup Guide

## Step-by-Step Instructions

### Step 1: Create TMDB Account (2 minutes)

1. **Go to TMDB signup page**: https://www.themoviedb.org/signup
2. **Fill out the form**:
   - Username (choose any)
   - Email address
   - Password
   - Click "Sign Up"
3. **Verify your email** (check your inbox for confirmation link)

### Step 2: Get Your API Key (1 minute)

1. **Log in** to https://www.themoviedb.org
2. **Go to Settings**: Click your profile icon (top right) → "Settings"
3. **Navigate to API section**: Click "API" in the left sidebar
4. **Request API Key**:
   - Click "Request an API Key" button
   - Select "Developer" (for personal use)
   - Fill out the form:
     - **Application Name**: "Movie Draft App" (or anything)
     - **Application URL**: http://localhost (or leave blank)
     - **Application Summary**: "Personal movie draft app for friends"
   - Accept the terms and click "Submit"
5. **Copy your API Key**: You'll see it on the next page - it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

### Step 3: Create .env File

1. **Create a `.env` file** in the `movie-draft-app` folder (same level as `package.json`)
2. **Add your API key** to the file:
   ```
   TMDB_API_KEY=your_actual_api_key_here
   ```
   **Example**:
   ```
   TMDB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```
3. **Save the file** - it's already in `.gitignore` so it won't be committed to git

### Step 4: Run the Poster Fetch Script

Once your `.env` file is set up, run:

```bash
cd movie-draft-app
node scripts/fetch-posters.js
```

That's it! The script will automatically read your API key from the `.env` file.

### What the Script Does

- Searches TMDB for each of your 100 movies
- Finds the best match (usually the first result)
- Downloads the poster URL
- Updates `src/data/movies.json` with poster URLs
- Shows progress: ✅ for found, ❌ for not found

### Expected Output

```
🎬 Fetching posters for 100 movies...

✅ Le Samourai
✅ In A Lonely Place
✅ Harakiri
✅ Jojo Rabbit
...
❌ One Battle After Another - poster not found

📊 Results: 95 found, 5 not found
✅ Updated src/data/movies.json
```

### Troubleshooting

**"TMDB_API_KEY not found in .env file" error**
- Make sure you created a `.env` file in the `movie-draft-app` folder
- The file should contain exactly: `TMDB_API_KEY=your_key_here`
- No quotes around the key value
- No spaces around the `=` sign
- Make sure the file is named `.env` (not `.env.txt` or anything else)

**Many movies not found**
- Some movies might have slightly different titles in TMDB
- The script uses the first search result, which is usually correct
- Movies without posters will show "Poster unavailable" in the app

**Rate limiting**
- TMDB allows ~40 requests per 10 seconds
- The script includes a 250ms delay between requests
- If you hit rate limits, wait a minute and re-run (it will skip already-found posters)

### After Running the Script

1. Check `src/data/movies.json` - you should see `posterUrl` fields populated
2. Refresh your browser (if dev server is running)
3. The app should now show movie posters!

### Alternative: Manual Poster URLs

If some movies aren't found automatically, you can manually edit `src/data/movies.json` and add poster URLs. TMDB poster URLs look like:
```
https://image.tmdb.org/t/p/w500/[poster_path]
```

