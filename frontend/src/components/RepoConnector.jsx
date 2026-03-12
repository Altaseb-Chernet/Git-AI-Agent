import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const RepoConnector = ({ refreshTrigger }) => {
  const [repoPath, setRepoPath] = useState('');
  const [isChangingRepo, setIsChangingRepo] = useState(false);

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

  const handleSetRepo = async (e) => {
    e.preventDefault();
    if (!repoPath.trim()) return;
    
    setIsChangingRepo(true);
    try {
      await apiService.setRepo(repoPath);
      await fetchStatus();
      setRepoPath('');
    } catch (err) {
      setError('Failed to switch repository path.');
    } finally {
      setIsChangingRepo(false);
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
        <div style={{ color: 'var(--text-tertiary)', marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="dot" style={{ width: '8px', height: '8px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite' }}></span>
          Checking repo...
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
      <h2 className="panel-title" style={{ marginBottom: '24px', color: 'var(--text-primary)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Repository Tracker
      </h2>
      
      {error && (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', marginBottom: '16px' }}>
          <div style={{ color: 'var(--error-color)', fontWeight: '600', fontSize: '0.9rem' }}>Connection Error</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{error}</div>
          <button onClick={fetchStatus} style={{ marginTop: '8px', padding: '6px 12px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>Retry Connection</button>
        </div>
      )}

      {/* Repo Selection / Upload Form */}
      <form onSubmit={handleSetRepo} style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>Active Workspace Folder</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder={status?.repo_path || "E.g. C:/Projects/MyWebApp"}
            style={{ 
              flex: 1, padding: '10px 12px', borderRadius: '8px', 
              border: '1px solid var(--panel-border)', background: 'var(--code-bg)',
              color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
              fontFamily: 'var(--font-mono)'
            }}
          />
          <button 
            type="submit"
            disabled={!repoPath.trim() || isChangingRepo}
            style={{
              padding: '0 16px', borderRadius: '8px', background: 'var(--text-primary)',
              color: '#fff', fontSize: '0.85rem', fontWeight: '500', 
              opacity: (!repoPath.trim() || isChangingRepo) ? 0.6 : 1, cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {isChangingRepo ? '...' : 'Load'}
          </button>
        </div>
      </form>

      {!status?.is_repo && !error ? (
        <div style={{ padding: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px' }}>
          <div style={{ color: 'var(--warning-color)', fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Not a Git Repository
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
            The current folder <code>{status?.repo_path || 'unknown'}</code> is not a valid git repository.
          </p>
        </div>
      ) : status?.is_repo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Status Cards */}
          <div style={{ padding: '16px', background: '#fff', border: '1px solid var(--panel-border)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}></div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.95rem' }}>Git Tracking Active</div>
              <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>Monitoring workspace</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--code-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Current Branch</span>
              <span style={{ 
                background: 'var(--accent-bg)', 
                color: 'var(--accent-hover)', 
                padding: '4px 12px', 
                borderRadius: 'full',
                fontSize: '0.8rem',
                fontWeight: '600',
                border: '1px solid var(--accent-border)'
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
                {status.branch || 'unknown'}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingBottom: '12px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Remote Origin</span>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                {status.remote_url || 'No remote configured'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>Pending Changes</span>
              <span style={{ color: status.changed_files?.length > 0 ? '#d97706' : 'var(--text-tertiary)', fontSize: '0.9rem', fontWeight: '600' }}>
                {status.changed_files?.length || 0} files
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
export default RepoConnector;
