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
      <header style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', margin: 0 }}>
          Activity Registry
        </h2>
      </header>
      
      <div 
        ref={containerRef}
        style={{ 
          background: '#ffffff', 
          borderRadius: '6px', 
          padding: '12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--text-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          border: '1px solid var(--panel-border)',
          minHeight: '120px'
        }}
        className="terminal-shell"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1a7f37', fontWeight: '600' }}>
          <span style={{ fontSize: '0.6rem' }}>●</span> Ready
        </div>
        {logs.length === 0 && (
          <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '4px' }}>Waiting for operations...</div>
        )}
        
        {logs.map((log, index) => (
          <div key={index} style={{ animation: 'fadeIn 0.2s ease-out', display: 'flex', gap: '8px', borderTop: index === 0 ? '1px solid #f0f0f0' : 'none', paddingTop: index === 0 ? '8px' : '0' }}>
            <span style={{ color: 'var(--accent-color)', fontWeight: 'bold' }}>»</span> 
            <span style={{ color: 'var(--text-secondary)', wordBreak: 'break-all', lineHeight: '1.4' }}>{log}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GitLogs;
