import React, { useEffect, useRef } from 'react';

const GitLogs = ({ logs }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', position: 'relative' }}>
      <h2 className="panel-title" style={{ marginBottom: '16px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
        Activity Log
      </h2>
      
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          background: 'var(--code-bg)', 
          borderRadius: '8px', 
          padding: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
        className="terminal-shell"
      >
        <div style={{ color: 'var(--text-tertiary)' }}>$ AI Git Agent Initialized</div>
        {logs.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '8px' }}>Waiting for actions...</div>
        )}
        
        {logs.map((log, index) => (
          <div key={index} style={{ animation: 'fadeIn 0.3s ease-out' }}>
            <span style={{ color: 'var(--success-color)', marginRight: '8px' }}>➜</span> 
            <span style={{ color: '#fff' }}>{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GitLogs;
