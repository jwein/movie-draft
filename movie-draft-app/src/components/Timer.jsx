export default function Timer({ timer }) {
  const { formattedTime, isPaused, isTimeUp, togglePause } = timer;
  
  // Color based on time remaining
  let timerColor = 'text-text-primary';
  let bgColor = 'bg-cream-dark';
  if (timer.seconds <= 30) {
    timerColor = 'text-burgundy';
    bgColor = 'bg-burgundy/5';
  } else if (timer.seconds <= 60) {
    timerColor = 'text-gold';
  }

  return (
    <div className={`flex items-center justify-between ${bgColor} border border-border p-4`}>
      <div className="flex items-center gap-4">
        <span className={`font-display text-4xl font-light tracking-tight ${timerColor}`}>
          {formattedTime}
        </span>
        {isPaused && (
          <span className="text-xs font-medium bg-gold text-charcoal px-2 py-1 uppercase tracking-wider">
            Paused
          </span>
        )}
        {isTimeUp && (
          <span className="text-xs font-medium bg-burgundy text-white px-2 py-1 uppercase tracking-wider animate-pulse">
            Time's Up
          </span>
        )}
      </div>
      <button
        onClick={togglePause}
        className="border border-border bg-white text-text-secondary py-2 px-4 text-sm font-medium hover:bg-cream-dark hover:border-border-dark transition-colors"
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
}
