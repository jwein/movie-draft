import { VIEWS } from '../data/constants';
import ExportButton from './ExportButton';

const NAV_ITEMS = [
  { view: VIEWS.DRAFT_BOARD, label: 'Draft Board' },
  { view: VIEWS.DRAFT_BOARD_GRID, label: 'Grid View' },
  { view: VIEWS.MEMBER_TEAM, label: 'Collections' },
  { view: VIEWS.MATRIX, label: 'Matrix' },
  { view: VIEWS.CATEGORY, label: 'Categories' },
];

export default function Navigation({ currentView, onViewChange, isDraftComplete, draftState }) {
  return (
    <header className="bg-charcoal border-b border-charcoal-light sticky top-0 z-50">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="flex items-center justify-between h-18">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <h1 className="font-display text-xl font-semibold text-cream tracking-tight">
              MOVIE DRAFT
            </h1>
            {isDraftComplete && (
              <span className="text-xs font-medium bg-forest text-white px-3 py-1 uppercase tracking-wider">
                Complete
              </span>
            )}
          </div>
          
          {/* Navigation */}
          <div className="flex items-center gap-8">
            <nav className="flex gap-6">
              {NAV_ITEMS.map(({ view, label }) => (
                <button
                  key={view}
                  onClick={() => onViewChange(view)}
                  className={`relative py-2 text-sm font-medium tracking-wide transition-colors ${
                    currentView === view
                      ? 'text-cream'
                      : 'text-text-muted hover:text-cream'
                  }`}
                >
                  {label}
                  {/* Underline indicator */}
                  {currentView === view && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-burgundy" />
                  )}
                </button>
              ))}
            </nav>
            
            <div className="border-l border-charcoal-light h-6" />
            
            <ExportButton draftState={draftState} />
          </div>
        </div>
      </div>
    </header>
  );
}
