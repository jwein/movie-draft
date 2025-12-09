import React from 'react';
import { generateDraftCSV, downloadCSV } from '../utils/exportDraft';

export default function ExportButton({ draftState }) {
  const { picksOrder, isSetupComplete } = draftState;
  const hasStarted = !!isSetupComplete;
  const hasPicks = (picksOrder?.length || 0) > 0;

  const handleExport = () => {
    const csv = generateDraftCSV(draftState);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `movie-draft-results-${dateStr}.csv`;
    downloadCSV(csv, filename);
  };

  if (!hasStarted) return null;

  return (
    <button
      onClick={handleExport}
      disabled={!hasPicks}
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        hasPicks
          ? 'bg-forest text-white hover:bg-forest/90'
          : 'bg-charcoal-light text-text-muted cursor-not-allowed opacity-60'
      }`}
      title={hasPicks ? 'Export draft as CSV' : 'Export disabled until at least one pick is made'}
    >
      Export CSV
    </button>
  );
}
