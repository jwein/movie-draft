#!/usr/bin/env node
/**
 * Votes Import Script
 * 
 * Imports votes from CSV or JSON, merges into movies.json, computes yesCount,
 * and updates All No's eligibility.
 * 
 * Usage:
 *   node scripts/import-votes.js --input votes.csv --dry-run
 *   node scripts/import-votes.js --input votes.json --write
 * 
 * CSV Format:
 *   title,member_a,member_b,member_c,member_d,member_e,member_f
 *   "Le Samourai",yes,yes,yes,yes,yes,yes
 *   "Starman",no,no,no,no,no,no
 * 
 * JSON Format:
 *   [
 *     { "title": "Le Samourai", "votes": { "member_a": "yes", ... } },
 *     ...
 *   ]
 * 
 * Features:
 *   - Idempotent (safe to re-run)
 *   - Conflict logging when votes differ
 *   - Computes yesCount from votes
 *   - Updates isAllNos based on yesCount === 0
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const MOVIES_PATH = path.join(__dirname, '../src/data/movies.json');

// Canonical member IDs (must match identity.js)
const CANONICAL_MEMBER_IDS = ['member_a', 'member_b', 'member_c', 'member_d', 'member_e', 'member_f'];

// Parse CLI args
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const inputPath = inputIndex !== -1 ? args[inputIndex + 1] : null;
const isDryRun = args.includes('--dry-run');
const isWrite = args.includes('--write');

if (!inputPath || (!isDryRun && !isWrite)) {
  console.log('Usage: node scripts/import-votes.js --input <file> [--dry-run | --write]');
  console.log('');
  console.log('Options:');
  console.log('  --input <file>  Path to votes file (CSV or JSON)');
  console.log('  --dry-run       Preview changes without writing');
  console.log('  --write         Apply changes to movies.json');
  console.log('');
  console.log('CSV Format:');
  console.log('  title,member_a,member_b,member_c,member_d,member_e,member_f');
  console.log('  "Le Samourai",yes,yes,yes,yes,yes,yes');
  console.log('');
  console.log('JSON Format:');
  console.log('  [{ "title": "Movie", "votes": { "member_a": "yes", ... } }]');
  process.exit(1);
}

// Normalize vote value to 'yes' or 'no'
function normalizeVote(value) {
  if (value === true || value === 'yes' || value === 'y' || value === '1' || value === 1) {
    return 'yes';
  }
  return 'no';
}

// Compute yesCount from votes object
function computeYesCount(votes) {
  if (!votes || typeof votes !== 'object') return 0;
  return Object.values(votes).filter(v => v === 'yes').length;
}

// Parse CSV content
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have header row and at least one data row');
  }
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  const titleIndex = header.findIndex(h => h.toLowerCase() === 'title');
  if (titleIndex === -1) {
    throw new Error('CSV must have a "title" column');
  }
  
  // Find member columns
  const memberColumns = {};
  CANONICAL_MEMBER_IDS.forEach(memberId => {
    const colIndex = header.findIndex(h => h.toLowerCase() === memberId);
    if (colIndex !== -1) {
      memberColumns[memberId] = colIndex;
    }
  });
  
  if (Object.keys(memberColumns).length === 0) {
    throw new Error('CSV must have at least one member column (member_a through member_f)');
  }
  
  // Parse data rows
  const result = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    const title = values[titleIndex]?.trim();
    if (!title) continue;
    
    const votes = {};
    for (const [memberId, colIndex] of Object.entries(memberColumns)) {
      const rawVote = values[colIndex]?.trim().toLowerCase();
      votes[memberId] = normalizeVote(rawVote);
    }
    
    result.push({ title, votes });
  }
  
  return result;
}

// Parse a single CSV line (handles quoted fields)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

// Parse JSON content
function parseJSON(content) {
  const data = JSON.parse(content);
  
  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of vote objects');
  }
  
  return data.map(item => {
    if (!item.title) {
      throw new Error('Each JSON item must have a "title" field');
    }
    
    // Normalize votes
    const votes = {};
    if (item.votes && typeof item.votes === 'object') {
      for (const [key, value] of Object.entries(item.votes)) {
        const memberId = key.toLowerCase();
        if (CANONICAL_MEMBER_IDS.includes(memberId)) {
          votes[memberId] = normalizeVote(value);
        }
      }
    }
    
    return { 
      title: item.title, 
      votes,
      datePicked: item.datePicked || null,
      picker: item.picker || null,
    };
  });
}

// Load and parse input file
function loadVotesFile(filePath) {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }
  
  const content = fs.readFileSync(absolutePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.csv') {
    return parseCSV(content);
  } else if (ext === '.json') {
    return parseJSON(content);
  } else {
    throw new Error(`Unsupported file type: ${ext}. Use .csv or .json`);
  }
}

// Find movie by title (case-insensitive, fuzzy)
function findMovieByTitle(movies, title) {
  const normalizedTitle = title.toLowerCase().trim();
  
  // Exact match first
  let match = movies.find(m => m.title.toLowerCase() === normalizedTitle);
  if (match) return match;
  
  // Try without "The " prefix
  if (normalizedTitle.startsWith('the ')) {
    const withoutThe = normalizedTitle.substring(4);
    match = movies.find(m => m.title.toLowerCase() === withoutThe);
    if (match) return match;
  }
  
  // Try adding "The " prefix
  match = movies.find(m => m.title.toLowerCase() === `the ${normalizedTitle}`);
  if (match) return match;
  
  return null;
}

// Check if votes are equal
function votesEqual(votes1, votes2) {
  if (!votes1 && !votes2) return true;
  if (!votes1 || !votes2) return false;
  
  for (const memberId of CANONICAL_MEMBER_IDS) {
    if (votes1[memberId] !== votes2[memberId]) {
      return false;
    }
  }
  return true;
}

// Main
async function main() {
  console.log(`\n🗳️  Votes Import`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN (preview only)' : 'WRITE (will update movies.json)'}`);
  console.log(`Input: ${inputPath}\n`);
  
  // Load movies
  let movies;
  try {
    movies = JSON.parse(fs.readFileSync(MOVIES_PATH, 'utf-8'));
  } catch (e) {
    console.error('Error: Could not load movies.json:', e.message);
    process.exit(1);
  }
  
  // Load votes file
  let votesData;
  try {
    votesData = loadVotesFile(inputPath);
  } catch (e) {
    console.error('Error: Could not load votes file:', e.message);
    process.exit(1);
  }
  
  console.log(`Movies in database: ${movies.length}`);
  console.log(`Votes to import: ${votesData.length}\n`);
  
  // Process votes
  const results = {
    updated: [],
    unchanged: [],
    conflicts: [],
    notFound: [],
  };
  
  for (const voteEntry of votesData) {
    const movie = findMovieByTitle(movies, voteEntry.title);
    
    if (!movie) {
      results.notFound.push(voteEntry.title);
      continue;
    }
    
    const newYesCount = computeYesCount(voteEntry.votes);
    const existingVotes = movie.votes;
    const existingYesCount = movie.yesCount;
    
    // Check for conflicts (different votes for same movie)
    if (existingVotes && !votesEqual(existingVotes, voteEntry.votes)) {
      results.conflicts.push({
        title: movie.title,
        existing: existingVotes,
        new: voteEntry.votes,
      });
      // Still update with new data (last write wins)
    }
    
    // Check if anything changed
    const votesChanged = !votesEqual(existingVotes, voteEntry.votes);
    const yesCountChanged = existingYesCount !== newYesCount;
    const allNosChanged = movie.isAllNos !== (newYesCount === 0);
    const datePickedChanged = voteEntry.datePicked && (!movie.datePicked || movie.datePicked !== voteEntry.datePicked);
    const pickerChanged = voteEntry.picker && movie.pickerId !== voteEntry.picker;
    
    if (votesChanged || yesCountChanged || allNosChanged || datePickedChanged || pickerChanged) {
      // Update movie
      movie.votes = voteEntry.votes;
      movie.yesCount = newYesCount;
      movie.isAllNos = newYesCount === 0;
      
      // Update datePicked if provided
      if (voteEntry.datePicked) {
        movie.datePicked = voteEntry.datePicked;
      }
      
      // Update pickerId if provided
      if (voteEntry.picker) {
        movie.pickerId = voteEntry.picker;
      }
      
      results.updated.push({
        title: movie.title,
        yesCount: newYesCount,
        isAllNos: movie.isAllNos,
        datePicked: voteEntry.datePicked || movie.datePicked,
      });
    } else {
      results.unchanged.push(movie.title);
    }
  }
  
  // Summary report
  console.log('='.repeat(50));
  console.log('SUMMARY REPORT');
  console.log('='.repeat(50));
  
  console.log(`\n✓ Updated: ${results.updated.length}`);
  console.log(`○ Unchanged: ${results.unchanged.length}`);
  console.log(`⚠ Conflicts: ${results.conflicts.length}`);
  console.log(`✗ Not found: ${results.notFound.length}`);
  
  if (results.updated.length > 0) {
    console.log('\nMovies updated:');
    results.updated.forEach(m => {
      const allNosLabel = m.isAllNos ? ' [All Nos]' : '';
      console.log(`  - ${m.title}: yesCount=${m.yesCount}${allNosLabel}`);
    });
  }
  
  if (results.conflicts.length > 0) {
    console.log('\n⚠️  Vote conflicts (new values applied):');
    results.conflicts.forEach(c => {
      console.log(`  - ${c.title}`);
      console.log(`    Existing: ${JSON.stringify(c.existing)}`);
      console.log(`    New:      ${JSON.stringify(c.new)}`);
    });
  }
  
  if (results.notFound.length > 0) {
    console.log('\nMovies not found in database:');
    results.notFound.forEach(title => {
      console.log(`  - ${title}`);
    });
  }
  
  // Write changes
  if (isWrite && results.updated.length > 0) {
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
      console.log(`✓ Updated movies.json with ${results.updated.length} vote records`);
    } catch (e) {
      console.error('Error: Could not write movies.json:', e.message);
      process.exit(1);
    }
  } else if (isDryRun && results.updated.length > 0) {
    console.log('\n[DRY RUN] No changes written. Run with --write to apply.');
  }
  
  console.log('\n✅ Done!\n');
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});

