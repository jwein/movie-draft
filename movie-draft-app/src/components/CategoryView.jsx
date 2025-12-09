import { useState } from 'react';

export default function CategoryView({ draftState }) {
  const { members, picks, categories, getMovieById } = draftState;
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div>
      {/* Category Selector */}
      <div className="bg-white border border-border p-6 mb-8">
        <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-3">
          Select Category
        </label>
        <select
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
          className="w-full max-w-xs bg-white border border-border px-4 py-3 text-text-primary focus:outline-none focus:border-burgundy"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category Header */}
      <div className="mb-8">
        <h2 className="font-display text-3xl font-semibold text-text-primary">{selectedCategory?.name}</h2>
        <p className="text-text-muted mt-1">All selections for this category</p>
      </div>

      {/* Member Picks Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {members.map(member => {
          const memberPicks = picks[member.id] || {};
          const movieId = memberPicks[selectedCategoryId];
          const movie = movieId ? getMovieById(movieId) : null;

          return (
            <div
              key={member.id}
              className="bg-white border border-border overflow-hidden"
            >
              {/* Member Header */}
              <div className="bg-cream-dark px-3 py-2 text-center border-b border-border">
                <h3 className="text-xs font-medium text-text-muted uppercase tracking-wider truncate">{member.name}</h3>
              </div>
              
              {/* Movie Pick */}
              <div className="p-3">
                {movie ? (
                  <div className="flex flex-col items-center">
                    {/* Poster with mat effect */}
                    <div className="w-full bg-cream-dark p-1.5 mb-3">
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
                    <p className="text-xs text-text-primary text-center font-medium truncate w-full" title={movie.title}>
                      {movie.title}
                    </p>
                    {movie.year && (
                      <p className="text-xs text-text-muted mt-0.5">{movie.year}</p>
                    )}
                  </div>
                ) : (
                  <div className="aspect-[2/3] flex items-center justify-center text-text-muted text-sm">
                    —
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
