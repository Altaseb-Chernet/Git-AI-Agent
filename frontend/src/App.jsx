import React, { useState } from 'react';
import ChatInterface from './components/ChatInterface';
import RepoConnector from './components/RepoConnector';
import GitLogs from './components/GitLogs';
import GitVisualizer from './components/GitVisualizer';
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleActionTaken = (newActions) => {
    setLogs(prev => [...prev, ...newActions]);
    // Trigger RepoConnector & Visualizer to refresh status when an action happens
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="glass-panel brand-header">
          <div className="brand-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </div>
          <h1>
            AI <span className="text-gradient">Git Agent</span>
          </h1>
        </div>
        
        <div className="glass-panel flex-grow" style={{ flex: '1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <RepoConnector refreshTrigger={refreshTrigger} />
        </div>
        
        <div className="glass-panel" style={{ height: '40%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <GitLogs logs={logs} />
        </div>
      </aside>
      
      <main className="main-content">
         <div className="glass-panel chat-container">
             <ChatInterface onActionTaken={handleActionTaken} />
         </div>
         <div className="glass-panel visualizer-container">
             <GitVisualizer refreshTrigger={refreshTrigger} />
         </div>
      </main>
    </div>
  );
}

export default App;
