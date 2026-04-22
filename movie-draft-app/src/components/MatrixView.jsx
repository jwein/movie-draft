export default function MatrixView({ draftState }) {
  const { members, picks, categories, getMovieById } = draftState;

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold text-text-primary mb-8">Draft Matrix</h2>
      
      <div className="bg-white border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-cream-dark border-b border-border">
                <th className="px-4 py-4 text-left text-xs font-medium text-text-muted uppercase tracking-wider sticky left-0 bg-cream-dark z-10">
                  Category
                </th>
                {members.map(member => (
                  <th key={member.id} className="px-4 py-4 text-center text-xs font-medium text-text-muted uppercase tracking-wider min-w-[140px]">
                    {member.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category, categoryIndex) => (
                <tr
                  key={category.id}
                  className={`border-b border-border ${categoryIndex % 2 === 0 ? 'bg-white' : 'bg-cream/30'}`}
                >
                  <td className="px-4 py-4 font-display font-medium text-text-primary sticky left-0 bg-inherit z-10 border-r border-border">
                    {category.name}
                  </td>
                  {members.map(member => {
                    const memberPicks = picks[member.id] || {};
                    const movieId = memberPicks[category.id];
                    const movie = movieId ? getMovieById(movieId) : null;

                    return (
                      <td key={member.id} className="px-3 py-3 text-center">
                        {movie ? (
                          <div className="flex flex-col items-center gap-2">
                            {/* Poster with mat */}
                            <div className="w-16 bg-cream-dark p-1">
                              {movie.posterUrl ? (
                                <img
                                  src={movie.posterUrl}
                                  alt={movie.title}
                                  className="w-full aspect-[2/3] object-cover"
                                />
                              ) : (
                                <div className="w-full aspect-[2/3] bg-border flex items-center justify-center">
                                  <span className="text-text-muted text-xs">?</span>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-text-secondary max-w-[120px] truncate" title={movie.title}>
                              {movie.title}
                            </p>
                          </div>
                        ) : (
                          <span className="text-text-muted text-sm">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
