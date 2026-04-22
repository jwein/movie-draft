// Rule helpers and the central canMemberPickMovie validation
import { getCanonicalMemberIdFromName, getCanonicalMemberIdFromMember, getOwnPickLimitForMember } from './identity';

// Safely get category name by id
export function getCategoryNameById(categoryId, categories) {
  if (!categoryId || !Array.isArray(categories)) return null;
  const found = categories.find(c => c.id === categoryId);
  return found ? found.name : null;
}

// Normalize category name checks to tolerate slight label differences
function isAllNosCategoryName(name) {
  if (!name) return false;
  const n = String(name).toLowerCase();
  return n === 'all nos' || n === "all no's";
}
function isCuratedPicksCategoryName(name) {
  if (!name) return false;
  const n = String(name).toLowerCase();
  return n === 'curated picks';
}
function isExUSCategoryName(name) {
  if (!name) return false;
  const n = String(name).toLowerCase();
  return n === 'ex us' || n === 'ex-us' || n === 'exus';
}

// Determine a movie's picker canonical ID
export function getMoviePickerCanonicalId(movie) {
  if (!movie) return null;
  // Prefer explicit pickerId if present and already canonical
  if (movie.pickerId && typeof movie.pickerId === 'string') {
    const maybeCanonical = movie.pickerId.trim().toLowerCase();
    // accept both canonical and non-canonical, attempt normalization
    const canonicalFromId = getCanonicalMemberIdFromName(maybeCanonical) || maybeCanonical;
    return getCanonicalMemberIdFromName(canonicalFromId) || null;
  }
  // Next, derive from pickerName if present
  if (movie.pickerName && typeof movie.pickerName === 'string') {
    const canonical = getCanonicalMemberIdFromName(movie.pickerName);
    if (canonical) return canonical;
  }
  // Fallback: derive from picker field (display name)
  if (movie.picker && typeof movie.picker === 'string') {
    const canonical = getCanonicalMemberIdFromName(movie.picker);
    if (canonical) return canonical;
  }
  return null;
}

/**
 * Compute yesCount from votes object.
 * votes is expected to be { memberId: 'yes' | 'no' | boolean }
 * Returns the count of 'yes' or true votes.
 */
export function computeYesCountFromVotes(votes) {
  if (!votes || typeof votes !== 'object') return 0;
  return Object.values(votes).filter(v => v === 'yes' || v === true).length;
}

/**
 * Derive pickerId (canonical) from movie data.
 * Uses picker field or pickerName to get canonical ID.
 */
export function derivePickerId(movie) {
  return getMoviePickerCanonicalId(movie);
}

/**
 * Normalize movie data by computing derived fields.
 * - pickerId: canonical member ID derived from picker/pickerName
 * - yesCount: computed from votes if present
 * Returns a new movie object with derived fields.
 */
export function normalizeMovieData(movie) {
  if (!movie) return movie;
  
  const normalized = { ...movie };
  
  // Derive pickerId if not present
  if (!normalized.pickerId) {
    const derivedPickerId = derivePickerId(movie);
    if (derivedPickerId) {
      normalized.pickerId = derivedPickerId;
    }
  }
  
  // Compute yesCount from votes if votes exist and yesCount not already set
  if (normalized.votes && typeof normalized.yesCount !== 'number') {
    normalized.yesCount = computeYesCountFromVotes(normalized.votes);
  }
  
  return normalized;
}

/**
 * Normalize an array of movies.
 */
export function normalizeMoviesData(movies) {
  if (!Array.isArray(movies)) return [];
  return movies.map(normalizeMovieData);
}

// Category eligibility checks
export function isMovieEligibleForAllNos(movie) {
  if (!movie) return false;
  // If votes have been aggregated, use yesCount
  if (typeof movie.yesCount === 'number') {
    return movie.yesCount === 0;
  }
  // Fallback to legacy flag until votes exist
  return !!movie.isAllNos;
}

export function isMovieEligibleForCuratedPicks(movie) {
  if (!movie) return false;
  return !!movie.isCuratedPick;
}

export function isMovieEligibleForExUS(movie) {
  if (!movie) return false;
  return !!movie.isExUS;
}

export function isMovieEligibleForCategory(movie, categoryName) {
  if (!categoryName) return true; // treat as standard category
  if (isAllNosCategoryName(categoryName)) return isMovieEligibleForAllNos(movie);
  if (isCuratedPicksCategoryName(categoryName)) return isMovieEligibleForCuratedPicks(movie);
  if (isExUSCategoryName(categoryName)) return isMovieEligibleForExUS(movie);
  return true;
}

// Count existing own-picks used by a member (canonical) from current draft state
export function countOwnPicksForMember(draftState, memberCanonicalId) {
  if (!draftState || !memberCanonicalId) return 0;
  const { picks, movies, members } = draftState;
  if (!picks || !movies || !members) return 0;

  // Find numeric memberId for the given canonical member
  const member = members.find(m => getCanonicalMemberIdFromMember(m) === memberCanonicalId);
  if (!member) return 0;
  const memberId = member.id;
  const memberPicks = picks[memberId] || {};

  let count = 0;
  for (const pickedMovieId of Object.values(memberPicks)) {
    const movie = movies.find(m => m.id === pickedMovieId);
    if (!movie) continue;
    const pickerCanonical = getMoviePickerCanonicalId(movie);
    if (pickerCanonical && pickerCanonical === memberCanonicalId) {
      count += 1;
    }
  }
  return count;
}

export function canMemberPickMovie(memberCanonicalId, movie, categoryName, draftState) {
  // Rule 1: Category-specific eligibility
  if (!isMovieEligibleForCategory(movie, categoryName)) {
    if (isAllNosCategoryName(categoryName)) {
      return {
        allowed: false,
        reason: "Movie has Yes votes - ineligible for All No's category",
      };
    }
    if (isCuratedPicksCategoryName(categoryName)) {
      return {
        allowed: false,
        reason: 'Only curated picks are allowed in this category',
      };
    }
    if (isExUSCategoryName(categoryName)) {
      return {
        allowed: false,
        reason: "Only non-US films allowed in Ex US category",
      };
    }
    return { allowed: false, reason: 'Movie is not eligible for the selected category' };
  }

  // Rule 2: Own-pick limit
  const moviePickerCanonical = getMoviePickerCanonicalId(movie);
  if (moviePickerCanonical && moviePickerCanonical === memberCanonicalId) {
    const used = countOwnPicksForMember(draftState, memberCanonicalId);
    const limit = getOwnPickLimitForMember(memberCanonicalId);
    if (used >= limit) {
      return {
        allowed: false,
        reason: `You've already used your own-pick allowance (${used}/${limit})`,
      };
    }
  }

  return { allowed: true };
}

// ============================================================================
// Sorting Helpers - PRD 2.1-2.4
// ============================================================================

export const SORT_FIELDS = {
  DATE_PICKED: 'datePicked',
  TITLE: 'title',
  YES_COUNT: 'yesCount',
  RELEASE_YEAR: 'releaseYear',
};

export const SORT_DIRECTIONS = {
  ASC: 'asc',
  DESC: 'desc',
};

// Default sort configurations per PRD 2.1
export const SORT_DEFAULTS = {
  [SORT_FIELDS.DATE_PICKED]: SORT_DIRECTIONS.ASC,   // oldest first
  [SORT_FIELDS.TITLE]: SORT_DIRECTIONS.ASC,         // A → Z
  [SORT_FIELDS.YES_COUNT]: SORT_DIRECTIONS.DESC,    // highest first
  [SORT_FIELDS.RELEASE_YEAR]: SORT_DIRECTIONS.ASC,  // oldest first
};

// Compare two strings alphabetically (case-insensitive)
function compareStrings(a, b) {
  const strA = (a || '').toLowerCase();
  const strB = (b || '').toLowerCase();
  return strA.localeCompare(strB);
}

// Compare by title (tie-breaker for all other sorts)
function compareByTitle(a, b) {
  return compareStrings(a.title, b.title);
}

// Parse date string to timestamp for comparison
function parseDatePicked(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Create a sort comparator for movies based on field and direction.
 * Implements PRD 2.3 edge cases:
 * - Missing datePicked → sort to beginning (treated as oldest)
 * - Missing releaseYear → sort to end (regardless of direction)
 * - Missing yesCount → treat as 0
 * - Ties → secondary sort by title alphabetically
 */
export function createMovieSortComparator(field, direction) {
  const dir = direction === SORT_DIRECTIONS.DESC ? -1 : 1;

  return (a, b) => {
    let result = 0;
    let nullHandled = false; // Track if we handled nulls specially (don't apply direction)

    switch (field) {
      case SORT_FIELDS.DATE_PICKED: {
        const dateA = parseDatePicked(a.datePicked);
        const dateB = parseDatePicked(b.datePicked);
        // PRD 2.3: Missing datePicked → sort to beginning (treated as oldest)
        // This null handling is direction-independent
        if (dateA === null && dateB === null) {
          result = 0;
        } else if (dateA === null) {
          result = -1; // a goes first (oldest)
          nullHandled = true;
        } else if (dateB === null) {
          result = 1;  // b goes first (oldest)
          nullHandled = true;
        } else {
          result = dateA - dateB;
        }
        break;
      }

      case SORT_FIELDS.TITLE: {
        result = compareStrings(a.title, b.title);
        break;
      }

      case SORT_FIELDS.YES_COUNT: {
        // PRD 2.3: Missing yesCount → treat as 0
        const countA = typeof a.yesCount === 'number' ? a.yesCount : 0;
        const countB = typeof b.yesCount === 'number' ? b.yesCount : 0;
        result = countA - countB;
        break;
      }

      case SORT_FIELDS.RELEASE_YEAR: {
        const yearA = typeof a.releaseYear === 'number' ? a.releaseYear : null;
        const yearB = typeof b.releaseYear === 'number' ? b.releaseYear : null;
        // PRD 2.3: Missing releaseYear → sort to end (regardless of direction)
        // This null handling is direction-independent
        if (yearA === null && yearB === null) {
          result = 0;
        } else if (yearA === null) {
          result = 1;  // a goes last (always)
          nullHandled = true;
        } else if (yearB === null) {
          result = -1; // b goes last (always)
          nullHandled = true;
        } else {
          result = yearA - yearB;
        }
        break;
      }

      default:
        result = 0;
    }

    // Apply direction only if we didn't handle nulls specially
    if (!nullHandled) {
      result *= dir;
    }

    // PRD 2.1: Tie-breaker by title (except for title sort itself)
    if (result === 0 && field !== SORT_FIELDS.TITLE) {
      result = compareByTitle(a, b);
    }

    return result;
  };
}

/**
 * Sort movies array by specified field and direction.
 * Returns a new sorted array (does not mutate original).
 */
export function sortMovies(movies, field, direction) {
  if (!Array.isArray(movies)) return [];
  const comparator = createMovieSortComparator(field, direction);
  return [...movies].sort(comparator);
}

// ============================================================================
// Filtering Helpers - PRD 3.1-3.3
// ============================================================================

// Yes count filter options per PRD 3.1
export const YES_COUNT_OPTIONS = [
  { value: 'any', label: 'Any' },
  { value: '0', label: '0 (All Nos)' },
  { value: '1+', label: '1+' },
  { value: '2+', label: '2+' },
  { value: '3+', label: '3+' },
  { value: '4+', label: '4+' },
  { value: '5+', label: '5+' },
  { value: '6', label: '6 (Unanimous)' },
];

/**
 * Safely get a movie's yesCount, treating missing as 0.
 * Also considers legacy isAllNos flag when yesCount is missing.
 */
export function getMovieYesCount(movie) {
  if (!movie) return 0;
  if (typeof movie.yesCount === 'number') return movie.yesCount;
  // Fallback: if isAllNos is true, treat as 0; otherwise unknown (treat as 0)
  return 0;
}

/**
 * Filter movies by picker canonical IDs.
 * If selectedPickers is empty, all movies pass.
 */
/**
 * Filter movies by picker (single select).
 * @param {string|null} selectedPicker - Single canonical picker ID or null for all
 */
export function filterMoviesByPicker(movies, selectedPicker) {
  if (!Array.isArray(movies)) return [];
  if (!selectedPicker) return movies;
  
  return movies.filter(movie => {
    const moviePicker = getMoviePickerCanonicalId(movie);
    // Also check movie.picker field directly (may be display name)
    const pickerFromField = movie.picker ? getCanonicalMemberIdFromName(movie.picker) : null;
    const effectivePicker = moviePicker || pickerFromField;
    return effectivePicker === selectedPicker;
  });
}

/**
 * Filter movies by yes count threshold.
 * @param {string} yesCountFilter - 'any', '0', '1+', '2+', '3+', '4+', '5+', '6'
 */
export function filterMoviesByYesCount(movies, yesCountFilter) {
  if (!Array.isArray(movies)) return [];
  if (!yesCountFilter || yesCountFilter === 'any') return movies;
  
  return movies.filter(movie => {
    const count = getMovieYesCount(movie);
    
    switch (yesCountFilter) {
      case '0':
        return count === 0;
      case '1+':
        return count >= 1;
      case '2+':
        return count >= 2;
      case '3+':
        return count >= 3;
      case '4+':
        return count >= 4;
      case '5+':
        return count >= 5;
      case '6':
        return count === 6;
      default:
        return true;
    }
  });
}

/**
 * Filter movies by availability for current member.
 * Uses canMemberPickMovie to determine if a movie can be picked.
 * @param {string} availabilityFilter - 'all' or 'available'
 * @param {string} memberCanonicalId - Current member's canonical ID
 * @param {string} categoryName - Currently selected category name
 * @param {object} draftState - Current draft state for rule checking
 */
export function filterMoviesByAvailability(movies, availabilityFilter, memberCanonicalId, categoryName, draftState) {
  if (!Array.isArray(movies)) return [];
  if (!availabilityFilter || availabilityFilter === 'all') return movies;
  if (!memberCanonicalId) return movies; // Can't filter without knowing the member
  
  return movies.filter(movie => {
    const validation = canMemberPickMovie(memberCanonicalId, movie, categoryName, draftState);
    return validation.allowed;
  });
}

/**
 * Apply all filters to a movies array.
 * Filters are combined (AND logic).
 */
export function applyMovieFilters(movies, {
  selectedPicker = null,
  yesCountFilter = 'any',
  availabilityFilter = 'all',
  memberCanonicalId = null,
  categoryName = null,
  draftState = null,
} = {}) {
  if (!Array.isArray(movies)) return [];
  
  let filtered = movies;
  
  // Apply picker filter (single select)
  filtered = filterMoviesByPicker(filtered, selectedPicker);
  
  // Apply yes count filter
  filtered = filterMoviesByYesCount(filtered, yesCountFilter);
  
  // Apply availability filter
  filtered = filterMoviesByAvailability(filtered, availabilityFilter, memberCanonicalId, categoryName, draftState);
  
  return filtered;
}

/**
 * Count active filters for badge display.
 */
/**
 * Count active filters for badge display.
 * @param {string|null} selectedPicker - Single picker or null
 */
export function countActiveFilters(selectedPicker, yesCountFilter, availabilityFilter) {
  let count = 0;
  if (selectedPicker) count++;
  if (yesCountFilter && yesCountFilter !== 'any') count++;
  if (availabilityFilter && availabilityFilter !== 'all') count++;
  return count;
}
