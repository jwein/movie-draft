import React, { useMemo } from 'react';

export default function PickerStats({ draftState }) {
  const { movies, picksOrder } = draftState;

  const stats = useMemo(() => {
    const totals = new Map();
    const drafted = new Map();

    // Tally totals per picker from the movie pool
    for (const m of movies) {
      const picker = m.picker || 'Unknown';
      totals.set(picker, (totals.get(picker) || 0) + 1);
    }

    // Tally drafted per picker using picksOrder
    for (const p of (picksOrder || [])) {
      const movie = movies.find(m => m.id === p.movieId);
      if (!movie) continue;
      const picker = movie.picker || 'Unknown';
      drafted.set(picker, (drafted.get(picker) || 0) + 1);
    }

    // Build sorted array by drafted desc then name
    const rows = Array.from(totals.entries()).map(([picker, total]) => {
      const draftedCount = drafted.get(picker) || 0;
      const percent = total > 0 ? Math.round((draftedCount / total) * 100) : 0;
      return { picker, total, drafted: draftedCount, percent };
    }).sort((a,b) => b.drafted - a.drafted || a.picker.localeCompare(b.picker));

    const totalsDrafted = rows.reduce((acc, r) => acc + r.drafted, 0);

    return { rows, totalsDrafted };
  }, [movies, picksOrder]);

  if (!stats.rows.length) return null;

  return (
    <div className="bg-white border border-border p-8">
      <h3 className="font-display text-2xl font-semibold text-text-primary mb-6">Original Picker Statistics</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 pr-4 text-xs font-medium text-text-muted uppercase tracking-wider">Picker</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Drafted</th>
              <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">Total in Pool</th>
              <th className="text-right py-3 pl-4 text-xs font-medium text-text-muted uppercase tracking-wider">Percent</th>
            </tr>
          </thead>
          <tbody>
            {stats.rows.map(row => (
              <tr key={row.picker} className="border-b border-border last:border-0">
                <td className="py-3 pr-4 text-text-primary">{row.picker}</td>
                <td className="py-3 px-4 text-right font-display font-medium text-text-primary">{row.drafted}</td>
                <td className="py-3 px-4 text-right text-text-secondary">{row.total}</td>
                <td className="py-3 pl-4 text-right text-burgundy font-medium">{row.percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-text-muted mt-6 pt-4 border-t border-border">
        {stats.totalsDrafted} of {movies.length} films drafted in total.
      </p>
    </div>
  );
}
