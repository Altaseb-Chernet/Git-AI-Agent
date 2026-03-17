import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const RepoConnector = ({ refreshTrigger, onRepoChanged }) => {
  const [repoPath, setRepoPath] = useState('');
  const [isChangingRepo, setIsChangingRepo] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await apiService.getStatus();
      setStatus(data);
      setError(null);
    } catch {
      setError('Connection link severed.');
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
      onRepoChanged?.(repoPath);
      setRepoPath('');
    } catch {
      setError('Failed to resolve path.');
    } finally {
      setIsChangingRepo(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [refreshTrigger]);

  if (loading && !status) {
    return (
      <div style={{ padding: '24px', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
        <div className="dot" style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%', marginBottom: '12px', animation: 'blink 1.4s infinite' }}></div>
        Initializing...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '18px' }}>
      <h2 style={{ fontSize: '0.75rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        Repository & Status
      </h2>
      
      {error && (
        <div className="glass-panel" style={{ padding: '12px', background: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.2)', marginBottom: '16px' }}>
          <div style={{ color: 'var(--error-color)', fontWeight: '600', fontSize: '0.8rem' }}>Error</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{error}</div>
        </div>
      )}

      <form onSubmit={handleSetRepo} style={{ marginBottom: '24px' }}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            type="text" 
            value={repoPath}
            onChange={(e) => setRepoPath(e.target.value)}
            placeholder={status?.repo_path || "Path to repo..."}
            style={{ 
              width: '100%', padding: '12px 14px', borderRadius: '14px', 
              border: '1px solid var(--panel-border)', background: 'rgba(2, 6, 23, 0.22)',
              color: 'var(--text-primary)', fontSize: '0.85rem', outline: 'none',
              fontFamily: 'var(--font-mono)', transition: 'all 0.2s'
            }}
          />
          <button 
            type="button"
            onClick={async () => {
              try {
                 setIsChangingRepo(true);
                 const res = await apiService.selectDirectory();
                 if (res.path) {
                    await apiService.setRepo(res.path);
                    await fetchStatus();
                    onRepoChanged?.(res.path);
                 }
              } catch (e) {
                 const detail = e?.message || 'Dialog failed.';
                 setError(detail);
              } finally {
                 setIsChangingRepo(false);
              }
            }}
            style={{
              padding: '12px', borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(76,141,255,0.95), rgba(196,161,255,0.65))',
              color: '#fff', fontSize: '0.82rem', fontWeight: '850', cursor: 'pointer',
              boxShadow: '0 18px 44px rgba(0,0,0,0.22)'
            }}
          >
            {isChangingRepo ? 'Opening...' : 'Browse Location'}
          </button>
          {status?.repo_path && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
              Open project: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{status.repo_path}</span>
            </div>
          )}
        </div>
      </form>

      {status?.is_repo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '14px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(63, 185, 80, 0.08)', borderColor: 'rgba(63, 185, 80, 0.20)' }}>
            <div style={{ width: '9px', height: '9px', borderRadius: '999px', background: 'var(--success-color)', boxShadow: '0 0 0 4px rgba(63,185,80,0.15)' }}></div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem' }}>Active Branch</div>
              <div style={{ color: 'var(--success-color)', fontSize: '0.85rem', fontWeight: '850', fontFamily: 'var(--font-mono)' }}>{status.branch}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <h3 style={{ fontSize: '0.7rem', fontWeight: '850', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.08em' }}>Working Tree</h3>
             
             {Object.entries(status.categories || {}).map(([cat, files]) => (
               files.length > 0 && (
                 <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                       <span style={{ 
                         color: cat === 'staged' ? 'var(--success-color)' : 
                                cat === 'modified' ? '#60a5fa' : 
                                cat === 'untracked' ? '#a78bfa' : 'var(--error-color)', 
                         fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase'
                       }}>{cat}</span>
                       <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{files.length}</span>
                    </div>
                    <div>
                       {files.slice(0, 5).map(f => (
                         <div key={f} style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', padding: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {f.split('/').pop()}
                         </div>
                       ))}
                       {files.length > 5 && <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', paddingTop: '2px' }}>+ {files.length - 5} more</div>}
                    </div>
                 </div>
               )
             ))}
             {Object.values(status.categories || {}).every(v => v.length === 0) && (
               <div style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', textAlign: 'center' }}>Clean tree</div>
             )}
          </div>
        </div>
      ) : (
        <div style={{ color: 'var(--warning-color)', fontSize: '0.8rem', textAlign: 'center' }}>No repository detected.</div>
      )}
    </div>
  );
};
export default RepoConnector;
