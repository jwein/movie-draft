// Draft Configuration
export const DRAFT_CONFIG = {
  TIMER_SECONDS: 120, // 2 minutes per pick
  TOTAL_ROUNDS: 6,    // 6 categories = 6 rounds
  TOTAL_MEMBERS: 6,
};

// Default member names
export const DEFAULT_MEMBERS = [
  { id: 1, name: 'Doodie (G)' },
  { id: 2, name: 'Doodie (Z)' },
  { id: 3, name: 'Coach Josh' },
  { id: 4, name: 'Relvis' },
  { id: 5, name: 'Pittsburgh Matt' },
  { id: 6, name: 'Question Marc' },
];

// Draft categories
export const CATEGORIES = [
  { id: 1, name: 'Airplane Movies' },
  { id: 2, name: 'All Nos' },
  { id: 3, name: 'Slow/Boring' },
  { id: 4, name: 'Ex US' },
  { id: 5, name: "Ilan's Picks" },
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
