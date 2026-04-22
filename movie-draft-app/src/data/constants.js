// Draft Configuration
export const DRAFT_CONFIG = {
  TIMER_SECONDS: 120, // 2 minutes per pick
  TOTAL_ROUNDS: 6,    // 6 categories = 6 rounds
  TOTAL_MEMBERS: 6,
};

// Default member names
export const DEFAULT_MEMBERS = [
  { id: 1, name: 'Member A', canonicalId: 'member_a' },
  { id: 2, name: 'Member B', canonicalId: 'member_b' },
  { id: 3, name: 'Member C', canonicalId: 'member_c' },
  { id: 4, name: 'Member D', canonicalId: 'member_d' },
  { id: 5, name: 'Member E', canonicalId: 'member_e' },
  { id: 6, name: 'Member F', canonicalId: 'member_f' },
];

// Draft categories
export const CATEGORIES = [
  { id: 1, name: 'Airplane Movies' },
  { id: 2, name: 'All Nos' },
  { id: 3, name: 'Slow/Boring' },
  { id: 4, name: 'Ex US' },
  { id: 5, name: 'Curated Picks' },
  { id: 6, name: 'Wildcard/Faves' },
];

// Local storage key
export const STORAGE_KEY = 'movie-draft-state';

// View types for navigation
export const VIEWS = {
  SETUP: 'setup',
  DRAFT_BOARD: 'draft-board',
  DRAFT_BOARD_GRID: 'draft-board-grid',
  MEMBER_TEAM: 'member-team',
  MATRIX: 'matrix',
  CATEGORY: 'category',
};
