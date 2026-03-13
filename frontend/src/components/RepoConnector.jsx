import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';

const RepoConnector = ({ refreshTrigger }) => {
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
    } catch (err) {
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
      setRepoPath('');
    } catch (err) {
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
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0 24px 24px 24px' }}>
      <h2 style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        Repository
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
              width: '100%', padding: '12px 16px', borderRadius: '12px', 
              border: '1px solid var(--panel-border)', background: 'rgba(15, 23, 42, 0.3)',
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
                 }
              } catch (e) {
                 setError('Dialog failed.');
              } finally {
                 setIsChangingRepo(false);
              }
            }}
            style={{
              padding: '10px', borderRadius: '10px', background: 'var(--accent-color)',
              color: '#fff', fontSize: '0.8rem', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 12px var(--accent-glow)'
            }}
          >
            {isChangingRepo ? 'Opening...' : 'Browse Location'}
          </button>
        </div>
      </form>

      {status?.is_repo ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success-color)', boxShadow: '0 0 10px var(--success-color)' }}></div>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: '600', fontSize: '0.85rem' }}>Active Branch</div>
              <div style={{ color: 'var(--success-color)', fontSize: '0.8rem', fontWeight: '700' }}>{status.branch}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <h3 style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>Changes</h3>
             
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
                       <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{files.length}</span>
                    </div>
                    <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
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
