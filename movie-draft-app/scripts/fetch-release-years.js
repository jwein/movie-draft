#!/usr/bin/env node
/**
 * TMDB Release Year Backfill Script
 * 
 * Fetches release years from TMDB API for movies missing releaseYear.
 * 
 * Usage:
 *   node scripts/fetch-release-years.js --dry-run    # Preview changes
 *   node scripts/fetch-release-years.js --write      # Apply changes to movies.json
 * 
 * Environment:
 *   TMDB_API_KEY - Required. Your TMDB API key (v3 auth)
 * 
 * Features:
 *   - Caches API responses to .tmdb-cache.json
 *   - Rate limiting (40 requests per 10 seconds per TMDB limits)
 *   - Summary report of changes
 *   - Safe writes with backup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const MOVIES_PATH = path.join(__dirname, '../src/data/movies.json');
const CACHE_PATH = path.join(__dirname, '.tmdb-cache.json');

// TMDB API config
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const RATE_LIMIT_DELAY_MS = 260; // ~40 requests per 10 seconds

// Parse CLI args
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isWrite = args.includes('--write');

if (!isDryRun && !isWrite) {
  console.log('Usage: node scripts/fetch-release-years.js [--dry-run | --write]');
  console.log('  --dry-run  Preview changes without writing');
  console.log('  --write    Apply changes to movies.json');
  process.exit(1);
}

// Check for API key
const TMDB_API_KEY = process.env.TMDB_API_KEY;
if (!TMDB_API_KEY) {
  console.error('Error: TMDB_API_KEY environment variable is required.');
  console.error('See TMDB_SETUP.md for instructions.');
  process.exit(1);
}

// Load cache
function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf-8'));
    }
  } catch (e) {
    console.warn('Warning: Could not load cache, starting fresh.');
  }
  return {};
}

// Save cache
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
  } catch (e) {
    console.warn('Warning: Could not save cache:', e.message);
  }
}

// Rate-limited fetch
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Search TMDB for a movie by title
async function searchMovie(title, cache) {
  const cacheKey = `search:${title.toLowerCase()}`;
  
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }
  
  await sleep(RATE_LIMIT_DELAY_MS);
  
  const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`;
  
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      console.log('  Rate limited, waiting 10 seconds...');
      await sleep(10000);
      return searchMovie(title, cache);
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    cache[cacheKey] = data;
    return data;
  } catch (e) {
    console.error(`  Error searching for "${title}":`, e.message);
    return null;
  }
}

// Extract release year from TMDB result
function extractReleaseYear(searchResult, movieTitle) {
  if (!searchResult || !searchResult.results || searchResult.results.length === 0) {
    return null;
  }
  
  // Try to find exact title match first
  const exactMatch = searchResult.results.find(
    r => r.title.toLowerCase() === movieTitle.toLowerCase()
  );
  
  const result = exactMatch || searchResult.results[0];
  
  if (result.release_date) {
    const year = parseInt(result.release_date.substring(0, 4), 10);
    if (!isNaN(year) && year > 1800 && year < 2100) {
      return year;
    }
  }
  
  return null;
}

// Main
async function main() {
  console.log(`\n🎬 TMDB Release Year Backfill`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'WRITE (will update movies.json)'}\n`);
  
  // Load movies
  let movies;
  try {
    movies = JSON.parse(fs.readFileSync(MOVIES_PATH, 'utf-8'));
  } catch (e) {
    console.error('Error: Could not load movies.json:', e.message);
    process.exit(1);
  }
  
  // Load cache
  const cache = loadCache();
  
  // Find movies missing releaseYear
  const missingYears = movies.filter(m => typeof m.releaseYear !== 'number');
  
  console.log(`Total movies: ${movies.length}`);
  console.log(`Missing releaseYear: ${missingYears.length}`);
  console.log(`Cached searches: ${Object.keys(cache).length}\n`);
  
  if (missingYears.length === 0) {
    console.log('✅ All movies already have releaseYear. Nothing to do.');
    return;
  }
  
  // Process each movie
  const results = {
    found: [],
    notFound: [],
    errors: [],
  };
  
  for (let i = 0; i < missingYears.length; i++) {
    const movie = missingYears[i];
    const progress = `[${i + 1}/${missingYears.length}]`;
    
    process.stdout.write(`${progress} Searching: ${movie.title}... `);
    
    const searchResult = await searchMovie(movie.title, cache);
    const year = extractReleaseYear(searchResult, movie.title);
    
    if (year) {
      console.log(`✓ ${year}`);
      results.found.push({ id: movie.id, title: movie.title, releaseYear: year });
      movie.releaseYear = year;
    } else {
      console.log('✗ Not found');
      results.notFound.push({ id: movie.id, title: movie.title });
    }
  }
  
  // Save cache
  saveCache(cache);
  
  // Summary report
  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(50));
  console.log(`\n✓ Found release years: ${results.found.length}`);
  console.log(`✗ Not found: ${results.notFound.length}`);
  
  if (results.found.length > 0) {
    console.log('\nMovies updated:');
    results.found.forEach(m => {
      console.log(`  - ${m.title} → ${m.releaseYear}`);
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\nMovies not found (manual lookup needed):');
    results.notFound.forEach(m => {
      console.log(`  - ${m.title}`);
    });
  }
  
  // Write changes
  if (isWrite && results.found.length > 0) {
    console.log('\n' + '='.repeat(50));
    console.log('WRITING CHANGES');
    console.log('='.repeat(50));
    
    // Create backup
    const backupPath = MOVIES_PATH.replace('.json', `.backup-${Date.now()}.json`);
    try {
      fs.copyFileSync(MOVIES_PATH, backupPath);
      console.log(`\n✓ Backup created: ${path.basename(backupPath)}`);
    } catch (e) {
      console.error('Warning: Could not create backup:', e.message);
    }
    
    // Write updated movies
    try {
      fs.writeFileSync(MOVIES_PATH, JSON.stringify(movies, null, 2));
      console.log(`✓ Updated movies.json with ${results.found.length} release years`);
    } catch (e) {
      console.error('Error: Could not write movies.json:', e.message);
      process.exit(1);
    }
  } else if (isDryRun && results.found.length > 0) {
    console.log('\n[DRY RUN] No changes written. Run with --write to apply.');
  }
  
  console.log('\n✅ Done!\n');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
