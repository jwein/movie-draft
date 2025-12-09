export default function MovieCard({ movie, isSelected, onClick, size = 'normal', showTitle = true }) {
  const sizeClasses = {
    small: 'w-full',
    normal: 'w-full',
    large: 'w-full',
  };

  const posterPadding = {
    small: 'p-1',
    normal: 'p-2',
    large: 'p-3',
  };

  const titleSizeClasses = {
    small: 'text-xs',
    normal: 'text-sm',
    large: 'text-base',
  };

  return (
    <button
      onClick={onClick}
      className={`relative bg-white border transition-all duration-300 group ${sizeClasses[size]} ${
        isSelected 
          ? 'border-burgundy border-2 shadow-md' 
          : 'border-border hover:border-border-dark hover:shadow-md'
      }`}
    >
      {/* Mat/frame effect - cream padding around poster */}
      <div className={`bg-cream-dark ${posterPadding[size]}`}>
        <div className="aspect-[2/3] overflow-hidden">
          {movie.posterUrl ? (
            <img
              src={movie.posterUrl}
              alt={`${movie.title}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-border flex items-center justify-center">
              <span className="text-text-muted text-xs text-center px-2">No poster</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Title and metadata */}
      {showTitle && (
        <div className="p-3 text-left border-t border-border">
          <p className={`font-display font-medium text-text-primary truncate ${titleSizeClasses[size]}`}>
            {movie.title}
          </p>
          {movie.year && (
            <p className="text-text-muted text-xs mt-1">
              {movie.year}
            </p>
          )}
        </div>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 w-6 h-6 bg-burgundy text-white flex items-center justify-center text-xs font-medium">
          ✓
        </div>
      )}
    </button>
  );
}
