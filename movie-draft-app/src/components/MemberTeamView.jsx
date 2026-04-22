import { useState } from 'react';

export default function MemberTeamView({ draftState }) {
  const { members, picks, categories, getMovieById } = draftState;
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id);

  const selectedMember = members.find(m => m.id === selectedMemberId);
  const memberPicks = picks[selectedMemberId] || {};

  return (
    <div>
      {/* Member Selector */}
      <div className="bg-white border border-border p-6 mb-8">
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
          Select Collector
        </label>
        <select
          value={selectedMemberId}
          onChange={(e) => setSelectedMemberId(Number(e.target.value))}
          className="w-full max-w-xs bg-white border border-border px-4 py-3 text-text-primary focus:outline-none focus:border-burgundy"
        >
          {members.map(member => (
            <option key={member.id} value={member.id}>
              {member.name}
            </option>
          ))}
        </select>
      </div>

      {/* Collection Header */}
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold text-text-primary">{selectedMember?.name}'s Collection</h2>
        <p className="text-text-muted mt-1">
          {Object.keys(memberPicks).length} of {categories.length} selections made
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {categories.map(category => {
          const movieId = memberPicks[category.id];
          const movie = movieId ? getMovieById(movieId) : null;

          return (
            <div
              key={category.id}
              className="bg-white border border-border overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-cream-dark px-4 py-3 border-b border-border">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider">{category.name}</h3>
              </div>
              
              <div className="p-4">
                {movie ? (
                  <div className="flex gap-4">
                    {/* Poster with mat effect */}
                    <div className="w-24 flex-shrink-0 bg-cream-dark p-1.5">
                      {movie.posterUrl ? (
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-full aspect-[2/3] object-cover"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] bg-border flex items-center justify-center">
                          <span className="text-text-muted text-xs text-center">No poster</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <p className="font-display font-medium text-text-primary">{movie.title}</p>
                      {movie.year && (
                        <p className="text-sm text-text-muted mt-1">{movie.year}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-28 text-text-muted text-sm">
                    Awaiting selection
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
