import { SORT_FIELDS, SORT_DIRECTIONS, SORT_DEFAULTS } from '../utils/rules';

const SORT_OPTIONS = [
  { value: SORT_FIELDS.DATE_PICKED, label: 'Date Picked' },
  { value: SORT_FIELDS.TITLE, label: 'Title' },
  { value: SORT_FIELDS.YES_COUNT, label: "Most Yes's" },
  { value: SORT_FIELDS.RELEASE_YEAR, label: 'Release Year' },
];

export default function SortControls({ sortField, sortDirection, onSortChange, disabled = false }) {
  const handleFieldChange = (e) => {
    const newField = e.target.value;
    // Reset to default direction for new field
    const newDirection = SORT_DEFAULTS[newField] || SORT_DIRECTIONS.ASC;
    onSortChange(newField, newDirection);
  };

  const handleDirectionToggle = () => {
    const newDirection = sortDirection === SORT_DIRECTIONS.ASC 
      ? SORT_DIRECTIONS.DESC 
      : SORT_DIRECTIONS.ASC;
    onSortChange(sortField, newDirection);
  };

  // Get display text for current direction
  const getDirectionLabel = () => {
    switch (sortField) {
      case SORT_FIELDS.DATE_PICKED:
        return sortDirection === SORT_DIRECTIONS.ASC ? 'Oldest First' : 'Newest First';
      case SORT_FIELDS.TITLE:
        return sortDirection === SORT_DIRECTIONS.ASC ? 'A → Z' : 'Z → A';
      case SORT_FIELDS.YES_COUNT:
        return sortDirection === SORT_DIRECTIONS.DESC ? 'Most First' : 'Least First';
      case SORT_FIELDS.RELEASE_YEAR:
        return sortDirection === SORT_DIRECTIONS.ASC ? 'Oldest First' : 'Newest First';
      default:
        return sortDirection === SORT_DIRECTIONS.ASC ? 'Asc' : 'Desc';
    }
  };

  // Get arrow indicator
  const getArrowIcon = () => {
    return sortDirection === SORT_DIRECTIONS.ASC ? '↑' : '↓';
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
        Sort
      </label>
      <select
        value={sortField}
        onChange={handleFieldChange}
        disabled={disabled}
        className={`border border-border px-2 py-1 text-text-primary text-xs focus:outline-none focus:border-burgundy ${
          disabled ? 'opacity-50 cursor-not-allowed bg-cream' : 'bg-white'
        }`}
      >
        {SORT_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleDirectionToggle}
        disabled={disabled}
        title={`Currently: ${getDirectionLabel()}. Click to toggle.`}
        className={`flex items-center gap-1 border border-border px-2 py-1 text-xs font-medium transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed bg-cream text-text-muted' 
            : 'bg-white text-text-secondary hover:bg-cream-dark hover:border-border-dark'
        }`}
      >
        <span>{getArrowIcon()}</span>
        <span className="hidden sm:inline">{getDirectionLabel()}</span>
      </button>
    </div>
  );
}

