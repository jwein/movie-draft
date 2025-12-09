/**
 * TMDB Poster Fetcher
 * 
 * This script fetches movie poster URLs from The Movie Database (TMDB) API.
 * 
 * To use:
 * 1. Get a free API key at https://www.themoviedb.org/settings/api
 * 2. Create a .env file in the project root with: TMDB_API_KEY=your_key_here
 * 3. Run: node scripts/fetch-posters.js
 * 
 * The script will update src/data/movies.json with poster URLs.
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

if (!API_KEY) {
  console.error('❌ TMDB_API_KEY not found in .env file');
  console.error('   Get a free key at: https://www.themoviedb.org/settings/api');
  console.error('   Create a .env file in the project root with:');
  console.error('   TMDB_API_KEY=your_key_here');
  process.exit(1);
}

async function searchMovie(title) {
  const url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Return the first result's poster path
      const movie = data.results[0];
      if (movie.poster_path) {
        return `${IMAGE_BASE}${movie.poster_path}`;
      }
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${title}:`, error.message);
    return null;
  }
}

async function main() {
  const moviesPath = path.join(__dirname, '..', 'src', 'data', 'movies.json');
  const movies = JSON.parse(fs.readFileSync(moviesPath, 'utf8'));
  
  console.log(`🎬 Fetching posters for ${movies.length} movies...\n`);
  
  let found = 0;
  let notFound = 0;
  
  for (const movie of movies) {
    const posterUrl = await searchMovie(movie.title);
    
    if (posterUrl) {
      movie.posterUrl = posterUrl;
      console.log(`✅ ${movie.title}`);
      found++;
    } else {
      console.log(`❌ ${movie.title} - poster not found`);
      notFound++;
    }
    
    // Rate limiting - TMDB allows ~40 requests per 10 seconds
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  
  // Write updated movies back to file
  fs.writeFileSync(moviesPath, JSON.stringify(movies, null, 2));
  
  console.log(`\n📊 Results: ${found} found, ${notFound} not found`);
  console.log(`✅ Updated ${moviesPath}`);
}

main();
