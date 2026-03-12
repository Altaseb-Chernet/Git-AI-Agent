import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const RepoConnector = ({ refreshTrigger }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStatus();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError('Failed to connect to agent backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [refreshTrigger]);

  if (loading && !status) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <h2 className="panel-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Repository Status
        </h2>
        <div style={{ color: 'var(--text-tertiary)', marginTop: '20px' }}>Checking repository status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
        <h2 className="panel-title" style={{ color: 'var(--error-color)' }}>
          Connection Error
        </h2>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{error}</div>
        <button onClick={fetchStatus} style={{ marginTop: '16px', padding: '8px 16px', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: '#fff' }}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
      <h2 className="panel-title" style={{ marginBottom: '24px' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Repository Tracker
      </h2>
      
      {!status?.is_repo ? (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
          <div style={{ color: 'var(--error-color)', fontWeight: '600', marginBottom: '4px' }}>Not a Git Repository</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>The agent is not running inside a valid git repository. Please initialize git first.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Cards */}
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: '0 0 8px var(--success-color)' }}></div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '500', fontSize: '0.95rem' }}>Active Workspace</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Git tracking enabled</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Current Branch</span>
              <span style={{ 
                background: 'var(--accent-bg)', 
                color: 'var(--accent-color)', 
                padding: '4px 10px', 
                borderRadius: 'full',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: '1px solid var(--accent-border)'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                {status.branch || 'unknown'}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Remote Origin</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                {status.remote_url || 'No remote configured'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Pending Changes</span>
              <span style={{ color: status.changed_files?.length > 0 ? 'var(--warning-color)' : 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: '500' }}>
                {status.changed_files?.length || 0} files
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoConnector;
