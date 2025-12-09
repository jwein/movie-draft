import { useState, useEffect } from 'react';
import { useDraftState } from './hooks/useDraftState';
import { useTimer } from './hooks/useTimer';
import { VIEWS } from './data/constants';
import SetupScreen from './components/SetupScreen';
import DraftBoard from './components/DraftBoard';
import DraftBoardGrid from './components/DraftBoardGrid';
import MemberTeamView from './components/MemberTeamView';
import MatrixView from './components/MatrixView';
import CategoryView from './components/CategoryView';
import Navigation from './components/Navigation';

function App() {
  const draftState = useDraftState();
  const timer = useTimer();
  const [currentView, setCurrentView] = useState(
    draftState.isSetupComplete ? VIEWS.DRAFT_BOARD : VIEWS.SETUP
  );

  // Reset timer when pick changes
  useEffect(() => {
    timer.reset();
  }, [draftState.currentPickIndex]);

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

export default App;
