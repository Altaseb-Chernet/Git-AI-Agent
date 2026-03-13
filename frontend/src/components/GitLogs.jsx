import React, { useEffect, useRef } from 'react';

const GitLogs = ({ logs }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', margin: 0 }}>
          Activity Log
        </h2>
      </header>
      
      <div 
        ref={containerRef}
        style={{ 
          height: '180px',
          overflowY: 'auto', 
          background: 'rgba(15, 23, 42, 0.4)', 
          borderRadius: '12px', 
          padding: '16px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          border: '1px solid var(--panel-border)'
        }}
        className="terminal-shell"
      >
        <div style={{ color: 'var(--text-tertiary)' }}>$ System Ready.</div>
        {logs.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', opacity: 0.6 }}>No active operations.</div>
        )}
        
        {logs.map((log, index) => (
          <div key={index} style={{ animation: 'fadeIn 0.2s ease-out', display: 'flex', gap: '8px' }}>
            <span style={{ color: 'var(--accent-color)' }}>➜</span> 
            <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GitLogs;
