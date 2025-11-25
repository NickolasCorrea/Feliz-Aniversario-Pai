import React, { useState } from 'react';
import { Menu } from './components/Menu';
import { Game } from './components/Game';
import { Exit } from './components/Exit';
import { Gallery } from './components/Gallery';
import { AppState } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.MENU);

  return (
    <div className="antialiased text-slate-100 bg-slate-900 min-h-screen selection:bg-amber-500/30 selection:text-amber-200">
      {appState === AppState.MENU && <Menu setAppState={setAppState} />}
      {appState === AppState.GAME && <Game setAppState={setAppState} />}
      {appState === AppState.PHOTOS && <Gallery setAppState={setAppState} />}
      {appState === AppState.EXIT && <Exit setAppState={setAppState} />}
    </div>
  );
};

export default App;