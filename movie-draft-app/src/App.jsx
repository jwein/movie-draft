import { useState, useEffect } from 'react';
import { useDraftState } from './hooks/useDraftState';
import { useTimer } from './hooks/useTimer';
import { VIEWS } from './data/constants';
import { SessionProvider } from './context/SessionContext';
import SetupScreen from './components/SetupScreen';
import DraftBoard from './components/DraftBoard';
import DraftBoardGrid from './components/DraftBoardGrid';
import MemberTeamView from './components/MemberTeamView';
import MatrixView from './components/MatrixView';
import CategoryView from './components/CategoryView';
import Navigation from './components/Navigation';

function AppContent() {
  const draftState = useDraftState();
  const timer = useTimer();
  const [currentView, setCurrentView] = useState(
    draftState.isSetupComplete ? VIEWS.DRAFT_BOARD : VIEWS.SETUP
  );

  // Reset and start timer when pick changes (only if draft is in progress)
  useEffect(() => {
    // Only start timer if draft is complete with setup AND we're on an active pick
    // Don't start timer if draft hasn't actually begun (no picks made yet)
    if (draftState.isSetupComplete && !draftState.isDraftComplete) {
      // Check if we're actually on a pick (not before first pick)
      const hasStartedPicking = draftState.picksOrder && draftState.picksOrder.length > 0;
      const isOnActivePick = hasStartedPicking || draftState.currentPickIndex >= 0;
      
      if (isOnActivePick) {
        timer.reset();
        timer.start();
      } else {
        // Draft setup complete but no picks yet - keep timer paused
        timer.reset();
        timer.pause();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftState.currentPickIndex, draftState.isSetupComplete, draftState.isDraftComplete]);

  // If setup not complete, show setup screen
  if (!draftState.isSetupComplete) {
    return <SetupScreen draftState={draftState} onStart={() => setCurrentView(VIEWS.DRAFT_BOARD)} />;
  }

  return (
    <div className="min-h-screen bg-cream text-text-primary">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isDraftComplete={draftState.isDraftComplete}
        draftState={draftState}
      />
      
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {currentView === VIEWS.DRAFT_BOARD && (
          <DraftBoard draftState={draftState} timer={timer} />
        )}
        {currentView === VIEWS.DRAFT_BOARD_GRID && (
          <DraftBoardGrid draftState={draftState} />
        )}
        {currentView === VIEWS.MEMBER_TEAM && (
          <MemberTeamView draftState={draftState} />
        )}
        {currentView === VIEWS.MATRIX && (
          <MatrixView draftState={draftState} />
        )}
        {currentView === VIEWS.CATEGORY && (
          <CategoryView draftState={draftState} />
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}

export default App;
