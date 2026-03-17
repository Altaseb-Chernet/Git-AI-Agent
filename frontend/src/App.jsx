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
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title">Git <span className="text-gradient">AI Agent</span></div>
            <div className="brand-subtitle">Smart workspace for commits, branches, and automation</div>
          </div>
        </div>

        <div className="topbar-meta">
          <div className="pill">Live status</div>
          <div className="pill pill-muted">Port 8080</div>
        </div>
      </header>

      <div className="workspace">
        <main className="panel panel-main" aria-label="Chat">
          <ChatInterface onActionTaken={handleActionTaken} />
        </main>

        <aside className="panel panel-right" aria-label="Repository">
          <RepoConnector refreshTrigger={refreshTrigger} />
          <div className="divider" />
          <GitLogs logs={logs} />
        </aside>

        <section className="panel panel-bottom" aria-label="Commit graph">
          <div className="section-title">
            <div className="section-title-left">
              <span className="section-dot" />
              Commit visualization
            </div>
            <div className="section-title-right">Scroll the page • Graph stays readable</div>
          </div>
          <GitVisualizer refreshTrigger={refreshTrigger} />
        </section>
      </div>
    </div>
  );
}

export default App;
