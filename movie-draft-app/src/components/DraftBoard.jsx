import { useState, useEffect, useMemo } from 'react';
import { CATEGORIES } from '../data/constants';
import MovieCard from './MovieCard';
import Timer from './Timer';
import PickerStats from './PickerStats';

export default function DraftBoard({ draftState, timer }) {
  const {
    members,
    currentMember,
    currentCategory,
    currentCategoryIndex,
    availableMovies,
    picks,
    makePick,
    undoPick,
    canUndo,
    categories,
    getMovieById,
    getAvailableCategories,
    setSelectedCategory,
    selectedCategoryId,
    isDraftComplete,
    currentPickIndex,
    draftOrder,
    resetDraft,
    getAvailableMoviesForCategory,
  } = draftState;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  
  // Auto-select first available category when pick changes
  // Memoize available categories based on current member's picks
  const availableCategoriesForMember = useMemo(() => {
    if (!currentMember) return [];
    const memberPicks = picks[currentMember.id] || {};
    const available = categories.filter(cat => !memberPicks[cat.id]);

    // Debug logging for pick 7
    if (currentPickIndex === 6) {
      console.log('[DraftBoard] Available categories for member 6:', {
        memberPicks,
        availableCategoryIds: available.map(c => c.id),
        availableCategoryNames: available.map(c => c.name),
        allCategories: categories.map(c => ({ id: c.id, name: c.name })),
        currentMember: currentMember.name,
      });
    }

    return available;
  }, [currentMember?.id, categories, picks, currentPickIndex]);
  
  useEffect(() => {
    // Always clear category selection when pick changes to avoid stale state
    setSelectedCategory(null);
  }, [currentPickIndex]);

  // Auto-select first available category when transitioning to a new member
  useEffect(() => {
    if (!currentMember || selectedCategoryId) {
      return;
    }

    // Find the first unfilled category for this member
    const memberPicks = picks[currentMember.id] || {};
    const available = categories.filter(cat => !memberPicks[cat.id]);

    if (available.length > 0) {
      console.log(`[DraftBoard] Auto-selecting category ${available[0].id} for member ${currentMember.name}`);
      setSelectedCategory(available[0].id);
    }
  }, [currentMember?.id, selectedCategoryId, picks, categories]);

  // Filter movies by category eligibility (for restricted categories), then by search
  const eligibleMovies = getAvailableMoviesForCategory(selectedCategoryId, availableMovies);
  const filteredMovies = eligibleMovies.filter(movie =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get available categories for current member (categories they haven't filled yet)
  const availableCategories = currentMember 
    ? getAvailableCategories(currentMember.id)
    : [];
  
  // Debug logging for pick 7 issue
  useEffect(() => {
    if (currentPickIndex === 6) {
      const expectedMemberId = draftOrder[6];
      const foundMember = members.find(m => m.id === expectedMemberId);
      console.log('[DraftBoard] Pick 7 Debug:', {
        currentPickIndex,
        draftOrderAt6: draftOrder[6],
        expectedMemberId,
        currentMemberId: currentMember?.id,
        currentMemberName: currentMember?.name,
        foundMemberId: foundMember?.id,
        foundMemberName: foundMember?.name,
        selectedCategoryId,
        allMembers: members.map(m => ({ id: m.id, name: m.name })),
        draftOrderFirst12: draftOrder.slice(0, 12),
        mismatch: currentMember?.id !== expectedMemberId || currentMember?.name !== foundMember?.name,
      });

      if (currentMember?.id !== expectedMemberId) {
        console.error(
          `[DraftBoard] MEMBER ID MISMATCH at pick 7!\n` +
          `  draftOrder[6] = ${expectedMemberId}\n` +
          `  currentMember.id = ${currentMember?.id}\n` +
          `  This suggests draftOrder was generated with different member IDs than current members array.`
        );
      }
    }
  }, [currentPickIndex, currentMember, draftOrder, members, selectedCategoryId]);

  const handlePick = () => {
    if (!selectedMovieId) {
      alert('Please select a movie first');
      return;
    }
    if (!selectedCategoryId) {
      alert('Please select a category first');
      return;
    }
    makePick(selectedMovieId, selectedCategoryId);
    setSelectedMovieId(null);
    setSearchQuery('');
  };

  const handleUndo = () => {
    undoPick();
    setSelectedMovieId(null);
  };

  // Get pick number (1-36)
  const pickNumber = currentPickIndex + 1;
  const roundNumber = currentCategoryIndex + 1;
  const totalPicks = draftOrder.length;

  if (isDraftComplete) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <h2 className="font-display text-4xl font-semibold text-text-primary mb-4">Draft Complete</h2>
          <p className="text-text-muted mb-8 max-w-md mx-auto">
            All 36 selections have been made. Review the results below, or explore the Collections and Matrix views.
          </p>
          <button
            onClick={resetDraft}
            className="bg-burgundy hover:bg-burgundy-light text-white font-medium py-3 px-8 transition-colors"
          >
            Start New Draft
          </button>
        </div>
        <PickerStats draftState={draftState} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Combined Control Bar */}
      <div className="bg-white border border-border p-3">
        {/* Row 1: Upcoming Picks */}
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
          <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">Upcoming Picks</h3>
          <div className="flex items-center gap-1.5">
            {draftOrder.slice(currentPickIndex, currentPickIndex + 7).map((memberId, idx) => {
              const member = members.find(m => m.id === memberId);
              const pickNum = currentPickIndex + idx + 1;
              const isCurrentPick = idx === 0;
              return (
                <div
                  key={`pick-${pickNum}`}
                  className={`px-2 py-1 text-xs font-medium border transition-all ${
                    isCurrentPick
                      ? 'bg-gold text-charcoal border-gold'
                      : 'bg-white text-text-secondary border-border'
                  }`}
                >
                  {pickNum}. {member?.name || '?'}
                </div>
              );
            })}
          </div>
        </div>

        {/* Row 2: Now Selecting + Timer + Category + Search + Preview + Actions */}
        <div className="flex items-center gap-4">
          {/* Now Selecting */}
          <div className="border-l-4 border-gold bg-cream-dark px-3 py-2">
            <p className="text-[10px] font-medium text-gold uppercase tracking-wider">Now Selecting</p>
            <p className="font-display text-lg font-medium text-text-primary">{currentMember?.name}</p>
          </div>

          {/* Timer */}
          <div className="flex-shrink-0">
            <Timer timer={timer} />
          </div>

          {/* Category */}
          <div className="w-40">
            <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategoryId || ''}
              onChange={(e) => {
                console.log(`[DraftBoard] Manual category selection: ${e.target.value}`);
                setSelectedCategory(Number(e.target.value));
              }}
              className="w-full bg-white border border-border px-2 py-1.5 text-text-primary text-sm focus:outline-none focus:border-burgundy"
              disabled={!currentMember || availableCategories.length === 0}
            >
              <option value="">Choose...</option>
              {availableCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Search */}
          <div className="w-48">
            <label className="block text-[10px] font-medium text-text-muted uppercase tracking-wider mb-1">
              Search Films
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title..."
              className="w-full bg-white border border-border px-2 py-1.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-burgundy"
            />
          </div>

          {/* Selected Movie Preview */}
          <div className="flex-1 min-w-0">
            {selectedMovieId ? (
              (() => {
                const selectedMovie = availableMovies.find(m => m.id === selectedMovieId);
                if (!selectedMovie) return null;
                return (
                  <div className="flex gap-2 items-center">
                    <div className="w-10 flex-shrink-0 bg-cream-dark p-0.5">
                      {selectedMovie.posterUrl ? (
                        <img
                          src={selectedMovie.posterUrl}
                          alt={selectedMovie.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-border" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-burgundy truncate" title={selectedMovie.title}>
                        {selectedMovie.title}
                      </p>
                      {selectedMovie.year && (
                        <p className="text-[10px] text-text-muted">{selectedMovie.year}</p>
                      )}
                    </div>
                  </div>
                );
              })()
            ) : (
              <p className="text-xs text-text-muted italic">No film selected</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handlePick}
              disabled={!selectedMovieId || !selectedCategoryId}
              className="bg-burgundy hover:bg-burgundy-light disabled:bg-border disabled:text-text-muted disabled:cursor-not-allowed text-white font-medium py-2 px-5 text-sm transition-colors whitespace-nowrap"
            >
              Confirm Selection
            </button>
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="border border-border bg-white text-text-secondary py-2 px-3 text-xs font-medium hover:bg-cream-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Undo
            </button>
            <button
              onClick={resetDraft}
              className="border border-burgundy/30 bg-burgundy/5 text-burgundy py-2 px-3 text-xs font-medium hover:bg-burgundy/10 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Available Films Grid - Full Width */}
      <div className="bg-white border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-lg font-medium text-text-primary">
            Available Films
          </h3>
          <span className="text-sm text-text-muted">
            {filteredMovies.length} {filteredMovies.length === 1 ? 'film' : 'films'}
            {(selectedCategoryId === 2 || selectedCategoryId === 4 || selectedCategoryId === 5) && 
              ` eligible for ${categories.find(c => c.id === selectedCategoryId)?.name}`
            }
          </span>
        </div>
        
        {/* 5-column grid for posters */}
        <div className="grid grid-cols-5 gap-4 max-h-[calc(100vh-220px)] overflow-y-auto pr-2">
          {filteredMovies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isSelected={selectedMovieId === movie.id}
              onClick={() => setSelectedMovieId(movie.id)}
              size="normal"
            />
          ))}
        </div>

        {filteredMovies.length === 0 && (
          <p className="text-center text-text-muted py-12">
            {searchQuery ? 'No films match your search' : (eligibleMovies.length === 0 && (selectedCategoryId === 2 || selectedCategoryId === 4 || selectedCategoryId === 5))
              ? `No eligible films remaining for this category.`
              : 'No films available'}
          </p>
        )}
      </div>
    </div>
  );
}
