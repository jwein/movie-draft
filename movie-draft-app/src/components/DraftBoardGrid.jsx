import { useMemo } from 'react';

export default function DraftBoardGrid({ draftState }) {
  const {
    members,
    picks,
    categories,
    getMovieById,
    currentMember,
    currentPickIndex,
    draftOrder,
    picksOrder,
    selectedCategoryId,
  } = draftState;

  const totalPicks = draftOrder.length;
  const pickNumber = Math.min(currentPickIndex + 1, totalPicks);

  const picksByIndex = useMemo(() => {
    const map = new Map();
    (picksOrder || []).forEach(p => {
      map.set(p.pickIndex, p);
    });
    return map;
  }, [picksOrder]);

  const getMemberNameById = (memberId) => {
    return members.find(m => m.id === memberId)?.name || '';
  };

  const getCategoryNameById = (categoryId) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  return (
    <div>
      {/* Header with Draft Info */}
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold text-text-primary mb-2">Draft Board</h2>
        <div className="flex items-center gap-6 text-sm text-text-muted">
          <span>Pick {pickNumber} of {totalPicks}</span>
          {currentMember && (
            <span className="text-gold">
              Now Selecting: <span className="font-medium text-text-primary">{currentMember.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Draft Order Indicator */}
      <div className="bg-white border border-border p-5 mb-8">
        <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">Draft Order (Snake)</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {members.map((member, index) => {
            const isCurrentPicker = member.id === currentMember?.id;
            return (
              <div key={member.id} className="flex items-center gap-2">
                <div
                  className={`w-9 h-9 flex items-center justify-center font-display text-sm ${
                    isCurrentPicker
                      ? 'bg-gold text-charcoal font-medium'
                      : 'bg-cream-dark text-text-secondary border border-border'
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`text-sm ${isCurrentPicker ? 'text-gold font-medium' : 'text-text-secondary'}`}>
                  {member.name}
                </span>
                {index < members.length - 1 && (
                  <span className="text-border-dark ml-1">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Draft Board Grid - Sequential Snake Order */}
      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full">
            {/* Member Columns */}
            {members.map((member, memberIdx) => {
              const isCurrentPicker = member.id === currentMember?.id;

              return (
                <div
                  key={member.id}
                  className={`flex-1 min-w-[200px] border-r border-border last:border-r-0 ${
                    isCurrentPicker ? 'bg-gold/5' : ''
                  }`}
                >
                  {/* Member Header */}
                  <div
                    className={`h-16 flex items-center justify-center px-4 border-b border-border ${
                      isCurrentPicker
                        ? 'bg-gold/10'
                        : 'bg-cream-dark'
                    }`}
                  >
                    <div className="text-center">
                      <p className={`text-sm font-medium ${isCurrentPicker ? 'text-gold' : 'text-text-primary'}`}>
                        {member.name}
                      </p>
                      {isCurrentPicker && (
                        <p className="text-xs text-gold mt-0.5">(Selecting)</p>
                      )}
                    </div>
                  </div>

                  {/* Round Slots (6) - Snake order across rows */}
                  {[0,1,2,3,4,5].map((roundIdx) => {
                    const startPick = roundIdx * members.length;
                    const pickIndex = roundIdx % 2 === 0
                      ? startPick + memberIdx
                      : startPick + (members.length - 1 - memberIdx);
                    const pickNum = pickIndex + 1;
                    const isCurrentPick = pickIndex === currentPickIndex;
                    const pickData = picksByIndex.get(pickIndex);

                    // Determine display data
                    let movie = null;
                    let categoryName = '';
                    let memberName = member.name;

                    if (pickData) {
                      movie = pickData.movieId ? getMovieById(pickData.movieId) : null;
                      categoryName = pickData.categoryId ? getCategoryNameById(pickData.categoryId) : '';
                      memberName = getMemberNameById(pickData.memberId) || member.name;
                    }

                    return (
                      <div
                        key={`${member.id}-r${roundIdx}`}
                        className={`border-b border-border p-3 ${
                          roundIdx % 2 === 0 ? 'bg-white' : 'bg-cream/50'
                        }`}
                      >
                        {/* Filled pick */}
                        {movie ? (
                          <div className={`relative overflow-hidden aspect-[2/3] transition-all ${
                            isCurrentPick ? 'ring-2 ring-gold' : ''
                          }`}>
                            {/* Mat/frame effect */}
                            <div className="absolute inset-0 bg-cream-dark p-1">
                              {movie.posterUrl ? (
                                <img
                                  src={movie.posterUrl}
                                  alt={movie.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-border flex items-center justify-center">
                                  <span className="text-text-muted text-xs text-center">No poster</span>
                                </div>
                              )}
                            </div>

                            {/* Pick number badge */}
                            <div className="absolute top-2 left-2 bg-charcoal text-cream text-xs font-medium px-2 py-0.5">
                              #{pickNum}
                            </div>

                            {/* Bottom info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/90 to-transparent p-2 pt-6">
                              <p className="font-display text-cream font-medium text-xs truncate">{movie.title}</p>
                              {categoryName && (
                                <p className="text-gold text-[10px] font-medium truncate mt-0.5">{categoryName}</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          // Empty slot
                          <div className={`relative aspect-[2/3] border border-dashed ${
                            isCurrentPick ? 'border-gold bg-gold/5' : 'border-border-dark'
                          } bg-cream-dark/50 flex flex-col items-center justify-center transition-all`}>
                            {/* Pick number */}
                            <div className={`w-8 h-8 flex items-center justify-center border font-display text-sm mb-2 ${
                              isCurrentPick ? 'border-gold text-gold' : 'border-text-muted text-text-muted'
                            }`}>
                              {pickNum}
                            </div>
                            
                            <p className="text-xs text-text-muted">{member.name}</p>
                            <p className="text-[10px] text-text-muted mt-1">
                              {isCurrentPick
                                ? (selectedCategoryId
                                    ? getCategoryNameById(selectedCategoryId)
                                    : 'Awaiting selection')
                                : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-6 gap-4">
        {members.map(member => {
          const memberPicks = picks[member.id] || {};
          const pickCount = Object.keys(memberPicks).length;
          return (
            <div key={member.id} className="bg-white border border-border p-4 text-center">
              <p className="text-xs text-text-muted mb-1">{member.name}</p>
              <p className="font-display text-xl font-medium text-text-primary">{pickCount} / 6</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
