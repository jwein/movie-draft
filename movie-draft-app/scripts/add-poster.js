/**
 * Helper script to manually add a poster URL to a movie
 * 
 * Usage:
 * node scripts/add-poster.js "Movie Title" "https://image.tmdb.org/t/p/w500/poster.jpg"
 * 
 * Or just the movie title to get search instructions:
 * node scripts/add-poster.js "Movie Title"
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const moviesPath = path.join(__dirname, '..', 'src', 'data', 'movies.json');

const movieTitle = process.argv[2];
const posterUrl = process.argv[3];

if (!movieTitle) {
  console.error('❌ Please provide a movie title');
  console.error('   Usage: node scripts/add-poster.js "Movie Title" "poster_url"');
  process.exit(1);
}

const movies = JSON.parse(fs.readFileSync(moviesPath, 'utf8'));

// Find the movie (case-insensitive, partial match)
const movie = movies.find(m => 
  m.title.toLowerCase().includes(movieTitle.toLowerCase())
);

if (!movie) {
  console.error(`❌ Movie not found: "${movieTitle}"`);
  console.error('   Available movies:');
  movies.slice(0, 10).forEach(m => console.error(`   - ${m.title}`));
  console.error('   ...');
  process.exit(1);
}

if (!posterUrl) {
  console.log(`\n📽️  Found: "${movie.title}" (ID: ${movie.id})`);
  console.log(`\n🔍 To find the poster:`);
  console.log(`   1. Go to: https://www.themoviedb.org/search/movie?query=${encodeURIComponent(movie.title)}`);
  console.log(`   2. Click on the correct movie`);
  console.log(`   3. Right-click the poster → Copy Image Address`);
  console.log(`   4. Run this command again with the URL:`);
  console.log(`      node scripts/add-poster.js "${movie.title}" "paste_url_here"`);
  process.exit(0);
}

// Validate and normalize URL format
if (!posterUrl.startsWith('https://image.tmdb.org/') && !posterUrl.startsWith('https://media.themoviedb.org/')) {
  console.error('❌ Invalid poster URL. Should start with:');
  console.error('   https://image.tmdb.org/');
  console.error('   or');
  console.error('   https://media.themoviedb.org/');
  process.exit(1);
}

// Convert media.themoviedb.org to image.tmdb.org (standardize)
let normalizedUrl = posterUrl;
if (posterUrl.startsWith('https://media.themoviedb.org/')) {
  normalizedUrl = posterUrl.replace('https://media.themoviedb.org/', 'https://image.tmdb.org/');
  console.log(`ℹ️  Converted media URL to image URL format`);
}

// Update the movie
movie.posterUrl = normalizedUrl;

// Write back to file
fs.writeFileSync(moviesPath, JSON.stringify(movies, null, 2));

console.log(`✅ Updated "${movie.title}" with poster URL`);
console.log(`   ${posterUrl}`);
console.log(`\n🔄 Refresh your browser to see the poster!`);

