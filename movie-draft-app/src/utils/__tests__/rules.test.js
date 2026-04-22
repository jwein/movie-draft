import { 
  countOwnPicksForMember, 
  getMoviePickerCanonicalId, 
  isMovieEligibleForAllNos, 
  isMovieEligibleForExUS, 
  isMovieEligibleForCategory,
  computeYesCountFromVotes,
  normalizeMovieData,
  normalizeMoviesData
} from '../rules';

describe('rules helpers', () => {
  test('getMoviePickerCanonicalId derives from pickerName and flags', () => {
    expect(getMoviePickerCanonicalId({ pickerName: 'Member A' })).toBe('member_a');
    expect(getMoviePickerCanonicalId({ pickerName: 'Member C' })).toBe('member_c');
    expect(getMoviePickerCanonicalId({})).toBe(null);
  });

  test('getMoviePickerCanonicalId derives from picker field', () => {
    expect(getMoviePickerCanonicalId({ picker: 'Member B' })).toBe('member_b');
    expect(getMoviePickerCanonicalId({ picker: 'Member F' })).toBe('member_f');
    expect(getMoviePickerCanonicalId({ picker: 'Member C' })).toBe('member_c');
  });

  test('getMoviePickerCanonicalId prefers pickerId over picker', () => {
    expect(getMoviePickerCanonicalId({ pickerId: 'member_c', picker: 'Member A' })).toBe('member_c');
  });

  test('isMovieEligibleForAllNos uses yesCount with fallback', () => {
    expect(isMovieEligibleForAllNos({ yesCount: 0 })).toBe(true);
    expect(isMovieEligibleForAllNos({ yesCount: 1 })).toBe(false);
    expect(isMovieEligibleForAllNos({ isAllNos: true })).toBe(true);
    expect(isMovieEligibleForAllNos({ isAllNos: false })).toBe(false);
  });

  test('isMovieEligibleForExUS checks isExUS flag', () => {
    expect(isMovieEligibleForExUS({ isExUS: true })).toBe(true);
    expect(isMovieEligibleForExUS({ isExUS: false })).toBe(false);
    expect(isMovieEligibleForExUS({})).toBe(false);
    expect(isMovieEligibleForExUS(null)).toBe(false);
  });

  test('isMovieEligibleForCategory routes to correct checker', () => {
    // All Nos category
    expect(isMovieEligibleForCategory({ isAllNos: true }, 'All Nos')).toBe(true);
    expect(isMovieEligibleForCategory({ isAllNos: false }, 'All Nos')).toBe(false);
    expect(isMovieEligibleForCategory({ isAllNos: false }, "All No's")).toBe(false);
    // Curated Picks category
    expect(isMovieEligibleForCategory({ isCuratedPick: true }, 'Curated Picks')).toBe(true);
    expect(isMovieEligibleForCategory({ isCuratedPick: false }, 'Curated Picks')).toBe(false);
    // Ex US category
    expect(isMovieEligibleForCategory({ isExUS: true }, 'Ex US')).toBe(true);
    expect(isMovieEligibleForCategory({ isExUS: false }, 'Ex US')).toBe(false);
    // Standard categories (always eligible)
    expect(isMovieEligibleForCategory({}, 'Airplane Movies')).toBe(true);
    expect(isMovieEligibleForCategory({}, null)).toBe(true);
  });

  test('countOwnPicksForMember counts member own picks from current picks', () => {
    const draftState = {
      members: [
        { id: 1, name: 'Member A', canonicalId: 'member_a' },
        { id: 2, name: 'Member B', canonicalId: 'member_b' },
      ],
      movies: [
        { id: 100, title: 'Movie A', pickerName: 'Member A' },
        { id: 101, title: 'Movie B', pickerName: 'Member B' },
        { id: 102, title: 'Movie C', pickerName: 'Member A' },
      ],
      picks: {
        1: { 1: 100, 2: 101 },
        2: { 1: 102 },
      },
    };
    expect(countOwnPicksForMember(draftState, 'member_a')).toBe(1);
    expect(countOwnPicksForMember(draftState, 'member_b')).toBe(0);
  });
});

// Data model extension tests
describe('computeYesCountFromVotes', () => {
  test('counts yes votes correctly', () => {
    expect(computeYesCountFromVotes({ member_a: 'yes', member_b: 'yes', member_c: 'no' })).toBe(2);
    expect(computeYesCountFromVotes({ member_a: 'yes', member_b: 'yes', member_c: 'yes', member_d: 'yes', member_e: 'yes', member_f: 'yes' })).toBe(6);
    expect(computeYesCountFromVotes({ member_a: 'no', member_b: 'no', member_c: 'no' })).toBe(0);
  });

  test('handles boolean votes', () => {
    expect(computeYesCountFromVotes({ member_a: true, member_b: false, member_c: true })).toBe(2);
  });

  test('handles empty or invalid input', () => {
    expect(computeYesCountFromVotes(null)).toBe(0);
    expect(computeYesCountFromVotes(undefined)).toBe(0);
    expect(computeYesCountFromVotes({})).toBe(0);
  });
});

describe('normalizeMovieData', () => {
  test('derives pickerId from picker field', () => {
    const movie = { id: 1, title: 'Test', picker: 'Member B' };
    const normalized = normalizeMovieData(movie);
    expect(normalized.pickerId).toBe('member_b');
  });

  test('computes yesCount from votes', () => {
    const movie = { id: 1, title: 'Test', votes: { member_a: 'yes', member_b: 'no', member_c: 'yes' } };
    const normalized = normalizeMovieData(movie);
    expect(normalized.yesCount).toBe(2);
  });

  test('does not override existing pickerId', () => {
    const movie = { id: 1, title: 'Test', pickerId: 'member_f', picker: 'Member B' };
    const normalized = normalizeMovieData(movie);
    expect(normalized.pickerId).toBe('member_f');
  });

  test('does not override existing yesCount', () => {
    const movie = { id: 1, title: 'Test', yesCount: 5, votes: { member_a: 'yes' } };
    const normalized = normalizeMovieData(movie);
    expect(normalized.yesCount).toBe(5);
  });

  test('handles null input', () => {
    expect(normalizeMovieData(null)).toBe(null);
  });
});

describe('normalizeMoviesData', () => {
  test('normalizes array of movies', () => {
    const movies = [
      { id: 1, title: 'A', picker: 'Member A' },
      { id: 2, title: 'B', picker: 'Member B', votes: { member_a: 'yes', member_b: 'yes' } },
    ];
    const normalized = normalizeMoviesData(movies);
    expect(normalized[0].pickerId).toBe('member_a');
    expect(normalized[1].pickerId).toBe('member_b');
    expect(normalized[1].yesCount).toBe(2);
  });

  test('handles non-array input', () => {
    expect(normalizeMoviesData(null)).toEqual([]);
    expect(normalizeMoviesData(undefined)).toEqual([]);
  });
});

// Sorting tests (PRD 2.1-2.4)
import { sortMovies, createMovieSortComparator, SORT_FIELDS, SORT_DIRECTIONS } from '../rules';

describe('sorting helpers', () => {
  const testMovies = [
    { id: 1, title: 'Zebra', datePicked: '2023-06-01', releaseYear: 2020, yesCount: 3 },
    { id: 2, title: 'Apple', datePicked: '2023-01-15', releaseYear: 1995, yesCount: 5 },
    { id: 3, title: 'Mango', datePicked: null, releaseYear: 2010, yesCount: 0 },
    { id: 4, title: 'Banana', datePicked: '2023-03-20', releaseYear: null, yesCount: null },
  ];

  test('sortMovies by title ascending', () => {
    const sorted = sortMovies(testMovies, SORT_FIELDS.TITLE, SORT_DIRECTIONS.ASC);
    expect(sorted.map(m => m.title)).toEqual(['Apple', 'Banana', 'Mango', 'Zebra']);
  });

  test('sortMovies by title descending', () => {
    const sorted = sortMovies(testMovies, SORT_FIELDS.TITLE, SORT_DIRECTIONS.DESC);
    expect(sorted.map(m => m.title)).toEqual(['Zebra', 'Mango', 'Banana', 'Apple']);
  });

  test('sortMovies by datePicked ascending - missing dates go first (PRD 2.3)', () => {
    const sorted = sortMovies(testMovies, SORT_FIELDS.DATE_PICKED, SORT_DIRECTIONS.ASC);
    // Missing datePicked (Mango) should be first, then oldest to newest
    expect(sorted.map(m => m.title)).toEqual(['Mango', 'Apple', 'Banana', 'Zebra']);
  });

  test('sortMovies by datePicked descending - missing dates still go first (PRD 2.3)', () => {
    const sorted = sortMovies(testMovies, SORT_FIELDS.DATE_PICKED, SORT_DIRECTIONS.DESC);
    // Newest first, but missing datePicked (Mango) always treated as oldest (goes first)
    expect(sorted.map(m => m.title)).toEqual(['Mango', 'Zebra', 'Banana', 'Apple']);
  });

  test('sortMovies by yesCount descending - missing yesCount treated as 0 (PRD 2.3)', () => {
    const sorted = sortMovies(testMovies, SORT_FIELDS.YES_COUNT, SORT_DIRECTIONS.DESC);
    // Highest first: Apple(5), Zebra(3), Banana(0/null), Mango(0)
    // Tie-breaker by title for Banana and Mango
    expect(sorted.map(m => m.title)).toEqual(['Apple', 'Zebra', 'Banana', 'Mango']);
  });

  test('sortMovies by yesCount ascending', () => {
    const sorted = sortMovies(testMovies, SORT_FIELDS.YES_COUNT, SORT_DIRECTIONS.ASC);
    // Lowest first, tie-breaker by title
    expect(sorted.map(m => m.title)).toEqual(['Banana', 'Mango', 'Zebra', 'Apple']);
  });

  test('sortMovies by releaseYear ascending - missing years go last (PRD 2.3)', () => {
    const sorted = sortMovies(testMovies, SORT_FIELDS.RELEASE_YEAR, SORT_DIRECTIONS.ASC);
    // Oldest first, missing releaseYear (Banana) goes last
    expect(sorted.map(m => m.title)).toEqual(['Apple', 'Mango', 'Zebra', 'Banana']);
  });

  test('sortMovies by releaseYear descending - missing years still go last (PRD 2.3)', () => {
    const sorted = sortMovies(testMovies, SORT_FIELDS.RELEASE_YEAR, SORT_DIRECTIONS.DESC);
    // Newest first, but missing releaseYear (Banana) always goes last per PRD 2.3
    expect(sorted.map(m => m.title)).toEqual(['Zebra', 'Mango', 'Apple', 'Banana']);
  });

  test('sortMovies returns empty array for non-array input', () => {
    expect(sortMovies(null, SORT_FIELDS.TITLE, SORT_DIRECTIONS.ASC)).toEqual([]);
    expect(sortMovies(undefined, SORT_FIELDS.TITLE, SORT_DIRECTIONS.ASC)).toEqual([]);
  });

  test('sortMovies does not mutate original array', () => {
    const original = [...testMovies];
    const sorted = sortMovies(testMovies, SORT_FIELDS.TITLE, SORT_DIRECTIONS.ASC);
    expect(testMovies).toEqual(original);
    expect(sorted).not.toBe(testMovies);
  });

  test('tie-breaker by title when primary sort values are equal', () => {
    const moviesWithSameYear = [
      { id: 1, title: 'Zebra', releaseYear: 2020 },
      { id: 2, title: 'Apple', releaseYear: 2020 },
      { id: 3, title: 'Mango', releaseYear: 2020 },
    ];
    const sorted = sortMovies(moviesWithSameYear, SORT_FIELDS.RELEASE_YEAR, SORT_DIRECTIONS.ASC);
    // Same year, so should be sorted by title
    expect(sorted.map(m => m.title)).toEqual(['Apple', 'Mango', 'Zebra']);
  });
});

// Filtering tests (PRD 3.1-3.3)
import { 
  filterMoviesByPicker, 
  filterMoviesByYesCount, 
  filterMoviesByAvailability, 
  applyMovieFilters, 
  countActiveFilters,
  getMovieYesCount 
} from '../rules';

describe('filtering helpers', () => {
  const testMovies = [
    { id: 1, title: 'Movie A', picker: 'Member A', yesCount: 3, isAllNos: false },
    { id: 2, title: 'Movie B', picker: 'Member B', yesCount: 0, isAllNos: true },
    { id: 3, title: 'Movie C', picker: 'Member F', yesCount: 6, isAllNos: false },
    { id: 4, title: 'Movie D', picker: 'Member A', yesCount: null, isAllNos: false },
    { id: 5, title: 'Movie E', picker: 'Member E', yesCount: 2, isAllNos: false },
  ];

  describe('getMovieYesCount', () => {
    test('returns yesCount when present', () => {
      expect(getMovieYesCount({ yesCount: 5 })).toBe(5);
      expect(getMovieYesCount({ yesCount: 0 })).toBe(0);
    });

    test('returns 0 for missing yesCount', () => {
      expect(getMovieYesCount({ yesCount: null })).toBe(0);
      expect(getMovieYesCount({ yesCount: undefined })).toBe(0);
      expect(getMovieYesCount({})).toBe(0);
      expect(getMovieYesCount(null)).toBe(0);
    });
  });

  describe('filterMoviesByPicker', () => {
    test('returns all movies when no picker selected', () => {
      expect(filterMoviesByPicker(testMovies, null)).toEqual(testMovies);
    });

    test('filters by single picker', () => {
      const filtered = filterMoviesByPicker(testMovies, 'member_a');
      expect(filtered.map(m => m.title)).toEqual(['Movie A', 'Movie D']);
    });

    test('filters by member_f picker', () => {
      const filtered = filterMoviesByPicker(testMovies, 'member_f');
      expect(filtered.map(m => m.title)).toEqual(['Movie C']);
    });

    test('returns empty for non-matching picker', () => {
      const filtered = filterMoviesByPicker(testMovies, 'member_c');
      expect(filtered).toEqual([]);
    });
  });

  describe('filterMoviesByYesCount', () => {
    test('returns all movies when filter is any', () => {
      expect(filterMoviesByYesCount(testMovies, 'any')).toEqual(testMovies);
      expect(filterMoviesByYesCount(testMovies, null)).toEqual(testMovies);
    });

    test('filters by exact 0 (All Nos)', () => {
      const filtered = filterMoviesByYesCount(testMovies, '0');
      // Movie B has yesCount: 0, Movie D has yesCount: null (treated as 0)
      expect(filtered.map(m => m.title)).toEqual(['Movie B', 'Movie D']);
    });

    test('filters by 1+', () => {
      const filtered = filterMoviesByYesCount(testMovies, '1+');
      expect(filtered.map(m => m.title)).toEqual(['Movie A', 'Movie C', 'Movie E']);
    });

    test('filters by 3+', () => {
      const filtered = filterMoviesByYesCount(testMovies, '3+');
      expect(filtered.map(m => m.title)).toEqual(['Movie A', 'Movie C']);
    });

    test('filters by exact 6 (Unanimous)', () => {
      const filtered = filterMoviesByYesCount(testMovies, '6');
      expect(filtered.map(m => m.title)).toEqual(['Movie C']);
    });
  });

  describe('filterMoviesByAvailability', () => {
    test('returns all movies when filter is all', () => {
      expect(filterMoviesByAvailability(testMovies, 'all', 'member_a', null, {})).toEqual(testMovies);
    });

    test('returns all movies when no member specified', () => {
      expect(filterMoviesByAvailability(testMovies, 'available', null, null, {})).toEqual(testMovies);
    });
  });

  describe('countActiveFilters', () => {
    test('returns 0 when no filters active', () => {
      expect(countActiveFilters(null, 'any', 'all')).toBe(0);
    });

    test('counts picker filter', () => {
      expect(countActiveFilters('member_a', 'any', 'all')).toBe(1);
    });

    test('counts yesCount filter', () => {
      expect(countActiveFilters(null, '1+', 'all')).toBe(1);
    });

    test('counts availability filter', () => {
      expect(countActiveFilters(null, 'any', 'available')).toBe(1);
    });

    test('counts all filters combined', () => {
      expect(countActiveFilters('member_a', '3+', 'available')).toBe(3);
    });
  });

  describe('applyMovieFilters', () => {
    test('applies all filters in combination', () => {
      const filtered = applyMovieFilters(testMovies, {
        selectedPicker: 'member_a',
        yesCountFilter: '1+',
        availabilityFilter: 'all',
      });
      // Josh's movies with yesCount >= 1: Movie A (3), Movie D excluded (null = 0)
      expect(filtered.map(m => m.title)).toEqual(['Movie A']);
    });

    test('returns all movies with default options', () => {
      const filtered = applyMovieFilters(testMovies, {});
      expect(filtered).toEqual(testMovies);
    });

    test('returns empty array for non-array input', () => {
      expect(applyMovieFilters(null, {})).toEqual([]);
    });
  });
});
