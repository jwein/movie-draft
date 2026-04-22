import { useState } from 'react';
import { useSessionContext } from '../context/SessionContext';
import { createSessionURL, copyToClipboard } from '../utils/sessionUtils';

export default function SetupScreen({ draftState, onStart }) {
  const { members, updateMemberName, randomizeOrder, startDraft } = draftState;
  const [hasRandomized, setHasRandomized] = useState(false);
  const [joinSessionId, setJoinSessionId] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  const session = useSessionContext();

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

  const handleHostSession = async () => {
    try {
      await session.hostSession();
    } catch (error) {
      console.error('Error hosting session:', error);
      alert('Failed to host session. Please try again.');
    }
  };

  const handleJoinSession = async () => {
    if (!joinSessionId.trim()) {
      alert('Please enter a session ID');
      return;
    }
    
    const success = await session.joinSession(joinSessionId.trim());
    if (!success) {
      alert('Session not found. Please check the session ID and try again.');
    } else {
      setJoinSessionId('');
    }
  };

  const handleCopyLink = async () => {
    if (!session.sessionId) return;
    
    const sessionURL = createSessionURL(session.sessionId);
    const copied = await copyToClipboard(sessionURL);
    
    if (copied) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      alert('Failed to copy link. Please copy manually: ' + sessionURL);
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

        {/* Session Management Section */}
        <div className="mb-10 p-6 border-2 border-forest bg-cream-dark rounded-lg">
          {session.isHosting ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1.5 bg-forest text-white text-xs font-semibold uppercase tracking-wider rounded">
                  Hosting Session
                </span>
                {session.connectionStatus === 'connected' && (
                  <span className="text-xs text-forest font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-forest rounded-full animate-pulse"></span>
                    Connected
                  </span>
                )}
              </div>
              
              {/* Session ID - More Prominent */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                  Session ID
                </label>
                <div className="font-mono text-xl font-bold text-text-primary mb-4 p-3 bg-white border border-border rounded">
                  {session.sessionId}
                </div>
              </div>

              {/* Shareable Link - Enhanced */}
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                  Shareable Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createSessionURL(session.sessionId)}
                    className="flex-1 bg-white border-2 border-border px-3 py-2 text-sm text-text-primary font-mono focus:outline-none focus:border-forest rounded"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-forest text-white text-sm font-semibold hover:opacity-90 transition-colors rounded whitespace-nowrap"
                  >
                    {copySuccess ? '✓ Copied!' : 'Copy Link'}
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-xs text-forest mt-2">Link copied to clipboard!</p>
                )}
              </div>

              <button
                onClick={session.leaveSession}
                className="w-full border-2 border-border bg-transparent text-text-secondary font-medium py-2 px-4 hover:bg-cream hover:border-border-dark transition-colors rounded"
              >
                Leave Session
              </button>
            </div>
          ) : session.sessionId && session.userRole === 'viewer' ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1.5 bg-text-muted text-white text-xs font-semibold uppercase tracking-wider rounded">
                  Connected as Viewer
                </span>
                {session.connectionStatus === 'connected' && (
                  <span className="text-xs text-forest font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-forest rounded-full animate-pulse"></span>
                    Connected
                  </span>
                )}
              </div>
              
              <div>
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider block mb-2">
                  Session ID
                </label>
                <div className="font-mono text-sm text-text-primary mb-4 p-2 bg-white border border-border rounded">
                  {session.sessionId}
                </div>
              </div>

              {session.connectionStatus === 'connecting' && (
                <p className="text-sm text-text-muted flex items-center gap-1">
                  <span className="w-2 h-2 bg-gold rounded-full"></span>
                  Connecting to session...
                </p>
              )}

              <button
                onClick={session.leaveSession}
                className="w-full border-2 border-border bg-transparent text-text-secondary font-medium py-2 px-4 hover:bg-cream hover:border-border-dark transition-colors rounded"
              >
                Leave Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-4">
                Session Options
              </h2>
              
              <button
                onClick={handleHostSession}
                disabled={session.connectionStatus === 'connecting'}
                className="w-full bg-burgundy text-white font-medium py-3 px-6 hover:bg-burgundy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                {session.connectionStatus === 'connecting' ? 'Connecting...' : 'Host Session'}
              </button>

              <div className="pt-4 border-t border-border">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-widest block mb-2">
                  Join Session
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinSessionId}
                    onChange={(e) => setJoinSessionId(e.target.value)}
                    placeholder="Enter Session ID"
                    className="flex-1 bg-white border border-border px-3 py-2 text-text-primary focus:outline-none focus:border-burgundy placeholder:text-text-muted rounded"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleJoinSession();
                      }
                    }}
                  />
                  <button
                    onClick={handleJoinSession}
                    disabled={session.connectionStatus === 'connecting' || !joinSessionId.trim()}
                    className="px-4 py-2 bg-burgundy text-white font-medium hover:bg-burgundy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap rounded"
                  >
                    Join
                  </button>
                </div>
                {session.connectionStatus === 'error' && (
                  <p className="text-sm text-burgundy mt-2">Failed to join session. Please check the session ID.</p>
                )}
              </div>
            </div>
          )}
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
            className="flex-1 border border-border bg-transparent text-text-secondary font-medium py-3 px-6 hover:bg-cream-dark hover:border-border-dark transition-colors rounded"
          >
            Randomize Order
          </button>
          <button
            onClick={handleStart}
            className="flex-1 bg-burgundy text-white font-medium py-3 px-6 hover:bg-burgundy-light transition-colors rounded"
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
