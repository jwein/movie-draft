import { CANONICAL_MEMBER_IDS, getDisplayNameForCanonicalId } from '../utils/identity';
import { YES_COUNT_OPTIONS } from '../utils/rules';

export default function FilterControls({
  selectedPicker,
  onPickerChange,
  yesCountFilter,
  onYesCountChange,
  availabilityFilter,
  onAvailabilityChange,
  onClearAll,
  activeFilterCount,
  disabled = false,
}) {
  // Single-select picker: clicking same picker deselects, clicking different selects it
  const handlePickerClick = (pickerId) => {
    if (selectedPicker === pickerId) {
      onPickerChange(null); // Deselect
    } else {
      onPickerChange(pickerId); // Select (auto-deselects previous)
    }
  };

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Picker Single-select */}
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
          Picker
        </label>
        <div className="flex items-center gap-0.5">
          {CANONICAL_MEMBER_IDS.map(pickerId => {
            const isSelected = selectedPicker === pickerId;
            return (
              <button
                key={pickerId}
                onClick={() => handlePickerClick(pickerId)}
                disabled={disabled}
                title={getDisplayNameForCanonicalId(pickerId)}
                className={`px-2 py-1 text-[10px] font-medium border transition-colors ${
                  disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isSelected
                      ? 'bg-burgundy text-white border-burgundy'
                      : 'bg-white text-text-secondary border-border hover:border-border-dark hover:bg-cream-dark'
                }`}
              >
                {getDisplayNameForCanonicalId(pickerId)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Yes Count Filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
          Yes's
        </label>
        <select
          value={yesCountFilter}
          onChange={(e) => onYesCountChange(e.target.value)}
          disabled={disabled}
          className={`border border-border px-2 py-1 text-xs focus:outline-none focus:border-burgundy ${
            disabled ? 'opacity-50 cursor-not-allowed bg-cream' : 'bg-white text-text-primary'
          }`}
        >
          {YES_COUNT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Availability Filter */}
      <div className="flex items-center gap-1.5">
        <label className="text-[10px] font-medium text-text-muted uppercase tracking-wider whitespace-nowrap">
          Show
        </label>
        <div className="flex items-center border border-border">
          <button
            onClick={() => onAvailabilityChange('all')}
            disabled={disabled}
            className={`px-2 py-1 text-[10px] font-medium transition-colors ${
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : availabilityFilter === 'all'
                  ? 'bg-burgundy text-white'
                  : 'bg-white text-text-secondary hover:bg-cream-dark'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onAvailabilityChange('available')}
            disabled={disabled}
            className={`px-2 py-1 text-[10px] font-medium border-l border-border transition-colors ${
              disabled
                ? 'opacity-50 cursor-not-allowed'
                : availabilityFilter === 'available'
                  ? 'bg-burgundy text-white'
                  : 'bg-white text-text-secondary hover:bg-cream-dark'
            }`}
          >
            Available to Me
          </button>
        </div>
      </div>

      {/* Clear All + Active Count Badge */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <button
            onClick={onClearAll}
            disabled={disabled}
            className={`text-[10px] font-medium text-burgundy hover:text-burgundy-light transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Clear All
          </button>
          <span className="bg-burgundy text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {activeFilterCount}
          </span>
        </div>
      )}
    </div>
  );
}

