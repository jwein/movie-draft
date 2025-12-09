import { useState } from 'react';

export default function SetupScreen({ draftState, onStart }) {
  const { members, updateMemberName, randomizeOrder, startDraft } = draftState;
  const [hasRandomized, setHasRandomized] = useState(false);

  const handleRandomize = () => {
    randomizeOrder();
    setHasRandomized(true);
  };

  const handleStart = () => {
    startDraft();
    onStart();
  };

  const handleClearStorage = () => {
    if (confirm('Clear all saved draft data? This will reset everything and you\'ll need to start a new draft.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="bg-white shadow-lg p-12 max-w-xl w-full border border-border">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-semibold text-text-primary mb-3">
            Movie Draft
          </h1>
          <p className="text-text-muted text-base italic">
            Curate your collection.
          </p>
        </div>

        {/* Draft Order Section */}
        <div className="mb-10">
          <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-6">
            Draft Order
          </h2>
          <div className="space-y-4">
            {members.map((member, index) => (
              <div key={member.id} className="flex items-center gap-5">
                <span className="w-8 h-8 flex items-center justify-center border border-text-primary text-text-primary font-display text-sm">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMemberName(member.id, e.target.value)}
                  className="flex-1 bg-transparent border-0 border-b border-border px-0 py-2 text-text-primary text-base focus:outline-none focus:border-burgundy placeholder:text-text-muted"
                  placeholder={`Member ${index + 1}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleRandomize}
            className="flex-1 border border-border bg-transparent text-text-secondary font-medium py-3 px-6 hover:bg-cream-dark hover:border-border-dark transition-colors"
          >
            Randomize Order
          </button>
          <button
            onClick={handleStart}
            className="flex-1 bg-burgundy text-white font-medium py-3 px-6 hover:bg-burgundy-light transition-colors"
          >
            Begin Draft
          </button>
        </div>

        {hasRandomized && (
          <p className="text-center text-forest mt-4 text-sm">
            ✓ Order randomized
          </p>
        )}

        {/* Draft Info */}
        <div className="mt-10 pt-8 border-t border-border">
          <div className="flex justify-center gap-8 text-sm text-text-muted">
            <span>Snake draft</span>
            <span>•</span>
            <span>6 rounds</span>
            <span>•</span>
            <span>100 films</span>
          </div>
        </div>

        {/* Clear Storage */}
        <div className="mt-6 text-center">
          <button
            onClick={handleClearStorage}
            className="text-xs text-text-muted hover:text-burgundy underline underline-offset-2"
          >
            Clear Saved Data
          </button>
        </div>
      </div>
    </div>
  );
}
