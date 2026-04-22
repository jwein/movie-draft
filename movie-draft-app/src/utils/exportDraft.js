export function csvCell(value) {
  const str = value == null ? '' : String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function generateDraftCSV(draftState) {
  const { members, picks, picksOrder, movies, isDraftComplete, draftOrder, categories } = draftState;
  const totalPicks = draftOrder?.length || (members.length * categories.length);

  const lines = [];

  // Metadata header
  lines.push('Movie Draft Results');
  lines.push(`Date Exported,${new Date().toISOString().split('T')[0]}`);
  lines.push(`Draft Status,${isDraftComplete ? 'Complete' : `In Progress - ${picksOrder.length}/${totalPicks} picks`}`);
  lines.push(`Members,${csvCell(members.map(m => m.name).join(', '))}`);
  lines.push('');

  // Matrix format (Categories as rows, Members as columns)
  lines.push('MATRIX (BY CATEGORY AND MEMBER)');
  const header = ['Category', ...members.map(m => csvCell(m.name))];
  lines.push(header.join(','));
  categories.forEach(category => {
    const row = [csvCell(category.name)];
    members.forEach(member => {
      const memberPicks = picks[member.id] || {};
      const movieId = memberPicks[category.id];
      const movie = movies.find(m => m.id === movieId);
      row.push(csvCell(movie ? movie.title : ''));
    });
    lines.push(row.join(','));
  });

  // Blank row
  lines.push('');

  // Picks by draft order
  lines.push('PICKS BY DRAFT ORDER');
  lines.push('Pick #,Round,Member,Category,Movie Title,Movie Year');
  const totalMembers = members.length || 6;
  picksOrder.forEach((pick, index) => {
    const member = members.find(m => m.id === pick.memberId);
    const category = categories.find(c => c.id === pick.categoryId);
    const movie = movies.find(m => m.id === pick.movieId);
    const round = Math.floor(index / totalMembers) + 1;
    lines.push([
      index + 1,
      round,
      csvCell(member?.name || ''),
      csvCell(category?.name || ''),
      csvCell(movie?.title || ''),
      movie?.year || ''
    ].join(','));
  });

  return lines.join('\n');
}

export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
}
