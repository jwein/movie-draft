import { useReducer, useEffect, useCallback } from 'react';
import { STORAGE_KEY, DRAFT_CONFIG, DEFAULT_MEMBERS, CATEGORIES } from '../data/constants';
import moviesData from '../data/movies.json';

// Generate snake draft order for all picks
// Returns array of member IDs in snake draft order
function generateSnakeDraftOrder(members) {
  const order = [];
  for (let round = 0; round < DRAFT_CONFIG.TOTAL_ROUNDS; round++) {
    const roundOrder = round % 2 === 0 
      ? [...members] 
      : [...members].reverse();
    // Map to member IDs - ensure we capture the ID at generation time
    order.push(...roundOrder.map(m => m.id));
  }
  return order;
}

// Initial state factory
function createInitialState() {
  return {
    // Setup
    isSetupComplete: false,
    members: DEFAULT_MEMBERS,
    
    // Draft state
    draftOrder: [], // Array of member IDs in pick order
    currentPickIndex: 0,
    currentCategoryIndex: 0,
    selectedCategoryId: null, // User-selected category for current pick
    
    // Picks: { memberId: { categoryId: movieId } }
    picks: {},
    
    // Pick order: Array of { pickIndex, memberId, categoryId, movieId } to track exact order
    picksOrder: [],
    
    // Available movies (IDs of movies not yet picked)
    availableMovieIds: moviesData.map(m => m.id),
    
    // All movies data
    movies: moviesData,
    
    // History for undo (array of previous states)
    history: [],
    
    // Draft completion
    isDraftComplete: false,
  };
}

// Load state from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure movies data is always fresh from import
      parsed.movies = moviesData;
      
      // Validate draftOrder if draft is in progress
      if (parsed.isSetupComplete && parsed.draftOrder && parsed.draftOrder.length > 0) {
        const memberIds = new Set(parsed.members.map(m => m.id));
        const invalidIds = parsed.draftOrder.filter(id => !memberIds.has(id));
        
        // Check if all member IDs in draftOrder exist in members array
        // If not, we need to regenerate draftOrder, but we need to preserve pick history
        if (invalidIds.length > 0) {
          console.warn(
            `Invalid member IDs in saved draftOrder: ${invalidIds.join(', ')}. ` +
            `This usually happens after member randomization. Regenerating draftOrder.`
          );
          
          // If picks have been made, we can't safely regenerate draftOrder
          // because the picks are tied to old member IDs
          if (parsed.picksOrder && parsed.picksOrder.length > 0) {
            console.error(
              `Cannot regenerate draftOrder: ${parsed.picksOrder.length} picks have already been made. ` +
              `Member IDs in draftOrder don't match current members. ` +
              `You may need to reset the draft.`
            );
            // For now, try to regenerate anyway - the picks will be misaligned but at least it won't crash
            parsed.draftOrder = generateSnakeDraftOrder(parsed.members);
          } else {
            // No picks made yet, safe to regenerate
            parsed.draftOrder = generateSnakeDraftOrder(parsed.members);
          }
          
          // Reset pick index if it's out of bounds
          if (parsed.currentPickIndex >= parsed.draftOrder.length) {
            parsed.currentPickIndex = 0;
          }
        } else {
          // All IDs are valid, but double-check that the draftOrder matches the expected pattern
          // by verifying the first round matches the current member order
          const firstRoundOrder = parsed.draftOrder.slice(0, parsed.members.length);
          const expectedFirstRound = parsed.members.map(m => m.id);
          if (JSON.stringify(firstRoundOrder) !== JSON.stringify(expectedFirstRound)) {
            console.warn(
              `draftOrder first round doesn't match current member order. ` +
              `This suggests members were reordered after draft started. ` +
              `Regenerating draftOrder.`
            );
            // Only regenerate if no picks have been made
            if (!parsed.picksOrder || parsed.picksOrder.length === 0) {
              parsed.draftOrder = generateSnakeDraftOrder(parsed.members);
            } else {
              console.error(
                `Cannot regenerate draftOrder: picks have been made. ` +
                `Draft order may be incorrect. Consider resetting the draft.`
              );
            }
          }
        }
        
        // Validate snake draft integrity - each member should have at most one pick per round
        if (parsed.picksOrder && parsed.picksOrder.length > 0) {
          const picksByMemberAndRound = {};
          for (const pick of parsed.picksOrder) {
            const round = Math.floor(pick.pickIndex / DRAFT_CONFIG.TOTAL_MEMBERS);
            const key = `${pick.memberId}-${round}`;
            if (picksByMemberAndRound[key]) {
              console.error(`Snake draft integrity violation: Member ${pick.memberId} has multiple picks in round ${round + 1}`);
              console.error('Resetting picks data due to corruption');
              parsed.picks = {};
              parsed.picksOrder = [];
              break;
            }
            picksByMemberAndRound[key] = pick;
          }
        }

        // Validate picks data integrity - ensure picks match picksOrder
        if (parsed.picksOrder && parsed.picksOrder.length > 0) {
          const expectedPicks = {};
          parsed.picksOrder.forEach(pick => {
            if (!expectedPicks[pick.memberId]) {
              expectedPicks[pick.memberId] = {};
            }
            expectedPicks[pick.memberId][pick.categoryId] = pick.movieId;
          });
          
          // Check for discrepancies
          const picksKeys = Object.keys(parsed.picks || {});
          const expectedKeys = Object.keys(expectedPicks);
          if (JSON.stringify(picksKeys.sort()) !== JSON.stringify(expectedKeys.sort())) {
            console.warn('Picks data mismatch detected. Rebuilding from picksOrder.');
            parsed.picks = expectedPicks;
          } else {
            // Check each member's picks
            for (const memberId of expectedKeys) {
              const expectedMemberPicks = expectedPicks[memberId];
              const actualMemberPicks = parsed.picks[memberId] || {};
              if (JSON.stringify(expectedMemberPicks) !== JSON.stringify(actualMemberPicks)) {
                console.warn(`Picks mismatch for member ${memberId}. Rebuilding.`);
                parsed.picks[memberId] = expectedMemberPicks;
              }
            }
          }
        }
      }
      
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load draft state:', e);
  }
  return createInitialState();
}

// Save state to localStorage
function saveState(state) {
  try {
    // Don't save movies array to localStorage (it's large and static)
    const { movies, ...stateToSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Failed to save draft state:', e);
  }
}

// Action types
const ACTIONS = {
  UPDATE_MEMBER_NAME: 'UPDATE_MEMBER_NAME',
  RANDOMIZE_ORDER: 'RANDOMIZE_ORDER',
  START_DRAFT: 'START_DRAFT',
  SET_SELECTED_CATEGORY: 'SET_SELECTED_CATEGORY',
  MAKE_PICK: 'MAKE_PICK',
  UNDO_PICK: 'UNDO_PICK',
  RESET_DRAFT: 'RESET_DRAFT',
};

// Reducer
function draftReducer(state, action) {
  switch (action.type) {
    case ACTIONS.UPDATE_MEMBER_NAME: {
      const { memberId, name } = action.payload;
      return {
        ...state,
        members: state.members.map(m => 
          m.id === memberId ? { ...m, name } : m
        ),
      };
    }
    
    case ACTIONS.RANDOMIZE_ORDER: {
      const shuffled = [...state.members].sort(() => Math.random() - 0.5);
      const newMembers = shuffled.map((m, i) => ({ ...m, id: i + 1 }));
      
      // If draft has started, we need to regenerate draftOrder with new member IDs
      // But we can't do this safely if picks have been made, so we'll just update members
      // and let the validation in loadState handle fixing draftOrder
      return {
        ...state,
        members: newMembers,
        // If draft hasn't started yet, clear draftOrder so it gets regenerated
        // If draft has started, keep draftOrder but it will be validated/fixed on next load
        draftOrder: state.isSetupComplete ? state.draftOrder : [],
      };
    }
    
    case ACTIONS.START_DRAFT: {
      // Validate members array before generating draft order
      if (!state.members || state.members.length !== DRAFT_CONFIG.TOTAL_MEMBERS) {
        console.error(`Invalid members array: expected ${DRAFT_CONFIG.TOTAL_MEMBERS} members, got ${state.members?.length || 0}`);
        return state;
      }
      
      const draftOrder = generateSnakeDraftOrder(state.members);
      
      // Validate draftOrder was generated correctly
      if (!draftOrder || draftOrder.length !== DRAFT_CONFIG.TOTAL_ROUNDS * DRAFT_CONFIG.TOTAL_MEMBERS) {
        console.error(`Invalid draftOrder generated: expected ${DRAFT_CONFIG.TOTAL_ROUNDS * DRAFT_CONFIG.TOTAL_MEMBERS} picks, got ${draftOrder?.length || 0}`);
        return state;
      }
      
      // Validate all member IDs in draftOrder exist in members array
      const memberIds = new Set(state.members.map(m => m.id));
      const invalidIds = draftOrder.filter(id => !memberIds.has(id));
      if (invalidIds.length > 0) {
        console.error(`Invalid member IDs in draftOrder: ${invalidIds.join(', ')}`);
        return state;
      }
      
      // Auto-select first category for first pick
      const firstCategoryId = CATEGORIES[0]?.id || null;
      return {
        ...state,
        isSetupComplete: true,
        draftOrder,
        currentPickIndex: 0,
        currentCategoryIndex: 0,
        selectedCategoryId: firstCategoryId,
        picks: {},
        picksOrder: [],
        availableMovieIds: moviesData.map(m => m.id),
        history: [],
        isDraftComplete: false,
      };
    }
    
    case ACTIONS.SET_SELECTED_CATEGORY: {
      const { categoryId } = action.payload;
      return {
        ...state,
        selectedCategoryId: categoryId,
      };
    }
    
    case ACTIONS.MAKE_PICK: {
      const { movieId, categoryId } = action.payload;
      const currentMemberId = state.draftOrder[state.currentPickIndex];
      const selectedCategoryId = categoryId || state.selectedCategoryId;
      
      // Validate currentMemberId exists in draftOrder
      if (!currentMemberId || currentMemberId === undefined) {
        console.error(`Invalid currentMemberId at pick index ${state.currentPickIndex}. draftOrder length: ${state.draftOrder.length}`);
        return state;
      }
      
      // Validate member exists in members array
      const memberExists = state.members.some(m => m.id === currentMemberId);
      if (!memberExists) {
        console.error(`Member ID ${currentMemberId} not found in members array at pick index ${state.currentPickIndex}`);
        return state;
      }
      
      if (!selectedCategoryId) {
        console.error('No category selected for pick');
        return state;
      }
      
      // Validate: Check if this category is already filled for this member
      const memberPicks = state.picks[currentMemberId] || {};
      if (memberPicks[selectedCategoryId]) {
        console.error(
          `Category ${selectedCategoryId} already filled for member ${currentMemberId}.\n` +
          `  Current pick index: ${state.currentPickIndex}\n` +
          `  Member ${currentMemberId} picks: ${JSON.stringify(memberPicks)}\n` +
          `  Attempting to select category: ${selectedCategoryId}\n` +
          `  Picks order: ${state.picksOrder.length} picks made so far`
        );
        return state;
      }

      
      // Save current state to history for undo - MUST deep copy picks to preserve immutability
      const historyEntry = {
        currentPickIndex: state.currentPickIndex,
        currentCategoryIndex: state.currentCategoryIndex,
        selectedCategoryId: state.selectedCategoryId,
        picks: Object.fromEntries(
          Object.entries(state.picks).map(([memberId, memberPicks]) => [memberId, { ...memberPicks }])
        ),
        picksOrder: [...state.picksOrder],
        availableMovieIds: [...state.availableMovieIds],
      };
      
      // Update picks - MUST create new objects to maintain immutability
      // Shallow spread of state.picks only copies references to nested objects,
      // so we must explicitly create a new object for the member's picks
      const newPicks = { ...state.picks };
      newPicks[currentMemberId] = {
        ...(state.picks[currentMemberId] || {}),
        [selectedCategoryId]: movieId,
      };
      
      // Add to picks order
      const newPicksOrder = [...state.picksOrder, {
        pickIndex: state.currentPickIndex,
        memberId: currentMemberId,
        categoryId: selectedCategoryId,
        movieId: movieId,
      }];
      
      // Remove movie from available
      const newAvailable = state.availableMovieIds.filter(id => id !== movieId);
      
      // Calculate next pick index and category
      const nextPickIndex = state.currentPickIndex + 1;
      // In snake draft, each member gets one pick per round, so category index is round number (0-based)
      const nextCategoryIndex = Math.floor(nextPickIndex / DRAFT_CONFIG.TOTAL_MEMBERS);
      const isDraftComplete = nextPickIndex >= state.draftOrder.length;
      
      // Auto-select first available category for next pick
      const nextMemberId = isDraftComplete ? null : (state.draftOrder[nextPickIndex] || null);
      let nextSelectedCategoryId = null;
      if (nextMemberId) {
        // Find the first unfilled category for the next member
        const nextMemberPicks = newPicks[nextMemberId] || {};
        const availableCategories = CATEGORIES.filter(cat => !nextMemberPicks[cat.id]);
        nextSelectedCategoryId = availableCategories[0]?.id || null;
      }
      
      return {
        ...state,
        picks: newPicks,
        picksOrder: newPicksOrder,
        availableMovieIds: newAvailable,
        currentPickIndex: nextPickIndex,
        currentCategoryIndex: Math.min(nextCategoryIndex, DRAFT_CONFIG.TOTAL_ROUNDS - 1),
        selectedCategoryId: nextSelectedCategoryId,
        history: [...state.history, historyEntry],
        isDraftComplete,
      };
    }
    
    case ACTIONS.UNDO_PICK: {
      if (state.history.length === 0) return state;
      
      const lastState = state.history[state.history.length - 1];
      return {
        ...state,
        currentPickIndex: lastState.currentPickIndex,
        currentCategoryIndex: lastState.currentCategoryIndex,
        selectedCategoryId: lastState.selectedCategoryId,
        picks: lastState.picks,
        picksOrder: lastState.picksOrder,
        availableMovieIds: lastState.availableMovieIds,
        history: state.history.slice(0, -1),
        isDraftComplete: false,
      };
    }
    
    case ACTIONS.RESET_DRAFT: {
      return createInitialState();
    }
    
    default:
      return state;
  }
}

// Custom hook
export function useDraftState() {
  const [state, dispatch] = useReducer(draftReducer, null, loadState);
  
  // Save to localStorage on every state change
  useEffect(() => {
    saveState(state);
  }, [state]);
  
  // Action creators
  const updateMemberName = useCallback((memberId, name) => {
    dispatch({ type: ACTIONS.UPDATE_MEMBER_NAME, payload: { memberId, name } });
  }, []);
  
  const randomizeOrder = useCallback(() => {
    dispatch({ type: ACTIONS.RANDOMIZE_ORDER });
  }, []);
  
  const startDraft = useCallback(() => {
    dispatch({ type: ACTIONS.START_DRAFT });
  }, []);
  
  const setSelectedCategory = useCallback((categoryId) => {
    dispatch({ type: ACTIONS.SET_SELECTED_CATEGORY, payload: { categoryId } });
  }, []);
  
  const makePick = useCallback((movieId, categoryId = null) => {
    dispatch({ type: ACTIONS.MAKE_PICK, payload: { movieId, categoryId } });
  }, []);
  
  const undoPick = useCallback(() => {
    dispatch({ type: ACTIONS.UNDO_PICK });
  }, []);
  
  const resetDraft = useCallback(() => {
    dispatch({ type: ACTIONS.RESET_DRAFT });
  }, []);
  
  // Computed values
  // Get current member ID from draftOrder, then find the member object
  // This decouples position from ID - draftOrder is the source of truth for pick order
  const currentMemberId = state.draftOrder.length > 0 && state.currentPickIndex < state.draftOrder.length
    ? state.draftOrder[state.currentPickIndex]
    : null;
  
  let currentMember = null;
  if (currentMemberId) {
    currentMember = state.members.find(m => m.id === currentMemberId) || null;
    // If member not found, log detailed error - this indicates a data integrity issue
    if (!currentMember && !state.isDraftComplete) {
      console.error(
        `[useDraftState] currentMember lookup failed:\n` +
        `  memberId=${currentMemberId}\n` +
        `  currentPickIndex=${state.currentPickIndex}\n` +
        `  draftOrder.length=${state.draftOrder.length}\n` +
        `  availableMemberIds=[${state.members.map(m => m.id).join(', ')}]\n` +
        `  draftOrder[${state.currentPickIndex}]=${state.draftOrder[state.currentPickIndex]}\n` +
        `  draftOrder slice: [${state.draftOrder.slice(Math.max(0, state.currentPickIndex - 2), state.currentPickIndex + 3).join(', ')}]\n` +
        `  This usually means members were randomized after draft started, causing ID mismatch.`
      );
    } else if (currentMember && state.currentPickIndex === 6) {
      // Special debug logging for pick 7 to catch ID mismatches
      console.log(
        `[useDraftState] Pick 7 member lookup:\n` +
        `  draftOrder[6] = ${currentMemberId}\n` +
        `  Found member: id=${currentMember.id}, name="${currentMember.name}"\n` +
        `  All members: [${state.members.map(m => `${m.id}:"${m.name}"`).join(', ')}]`
      );
    }
  } else if (!state.isDraftComplete && state.draftOrder.length > 0) {
    // Log when currentMemberId is null but draft is still active
    console.warn(
      `[useDraftState] currentMemberId is null:\n` +
      `  currentPickIndex=${state.currentPickIndex}\n` +
      `  draftOrder.length=${state.draftOrder.length}\n` +
      `  isDraftComplete=${state.isDraftComplete}`
    );
  }
  
  const currentCategory = CATEGORIES[state.currentCategoryIndex];
  
  const availableMovies = state.movies.filter(m => 
    state.availableMovieIds.includes(m.id)
  );

  // Filter available movies by category eligibility
  const getAvailableMoviesForCategory = useCallback((categoryId, list = availableMovies) => {
    if (!categoryId) return list;
    if (categoryId === 2) { // All Nos
      return list.filter(m => m.isAllNos);
    }
    if (categoryId === 4) { // Ex US
      return list.filter(m => m.isExUS);
    }
    if (categoryId === 5) { // Ilan's Picks
      return list.filter(m => m.isIlansPicks);
    }
    return list;
  }, [availableMovies]);

  const getMovieById = useCallback((movieId) => {
    return state.movies.find(m => m.id === movieId);
  }, [state.movies]);
  
  const getMemberPicks = useCallback((memberId) => {
    return state.picks[memberId] || {};
  }, [state.picks]);
  
  // Get available categories for a member (categories they haven't filled yet)
  const getAvailableCategories = useCallback((memberId) => {
    const memberPicks = state.picks[memberId] || {};
    return CATEGORIES.filter(cat => !memberPicks[cat.id]);
  }, [state.picks]);
  
  const canUndo = state.history.length > 0;
  
  return {
    // State
    ...state,
    currentMember,
    currentCategory,
    availableMovies,
    canUndo,
    categories: CATEGORIES,
    
    // Actions
    updateMemberName,
    randomizeOrder,
    startDraft,
    setSelectedCategory,
    makePick,
    undoPick,
    resetDraft,
    
    // Helpers
    getMovieById,
    getMemberPicks,
    getAvailableCategories,
    getAvailableMoviesForCategory,
  };
}
