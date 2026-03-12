import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

const GitVisualizer = ({ refreshTrigger }) => {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  const fetchGraph = async () => {
    try {
      setLoading(true);
      const data = await apiService.getGraph();
      if (data.error) {
         setError(data.error);
         setCommits([]);
      } else {
         setCommits(data.commits || []);
         setError(null);
      }
    } catch (err) {
      setError('Failed to load git graph.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [refreshTrigger]);

  // Simple topological drawing logic
  useEffect(() => {
    if (!commits.length || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = Math.max(commits.length * 60 + 40, 400);
    canvas.height = height;
    
    ctx.clearRect(0, 0, width, height);

    const nodeRadius = 8;
    const spacingY = 60;
    const startX = 40;
    const startY = 30;
    
    // Map commits by ID to easily find parents
    const commitMap = {};
    commits.forEach((c, i) => {
        commitMap[c.id] = { ...c, index: i, x: startX, y: startY + (i * spacingY) };
    });

    // Draw Edges First
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cbd5e1'; // Tailwind slate-300
    
    commits.forEach(commit => {
        const node = commitMap[commit.id];
        commit.parents.forEach(parentId => {
            const parentNode = commitMap[parentId];
            if (parentNode) {
                ctx.beginPath();
                ctx.moveTo(node.x, node.y + nodeRadius);
                ctx.lineTo(parentNode.x, parentNode.y - nodeRadius);
                ctx.stroke();
            }
        });
    });

    // Draw Nodes and Text
    commits.forEach(commit => {
        const node = commitMap[commit.id];
        
        // Draw primary node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
        
        // Highlight HEAD if present
        const isHead = commit.refs.some(r => r.includes('HEAD'));
        ctx.fillStyle = isHead ? '#6366f1' : '#fff';
        ctx.fill();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = isHead ? '#4f46e5' : '#94a3b8';
        ctx.stroke();

        // Draw text: Hash only (cleaner graph)
        ctx.font = '600 13px Inter, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`${commit.id}`, node.x + 20, node.y + 4);
        
        // Draw refs (Branches/Tags)
        if (commit.refs.length > 0) {
            let badgeX = node.x + 20 + ctx.measureText(`${commit.id}`).width + 12;
            
            commit.refs.forEach(ref => {
                ctx.font = '500 11px Inter, sans-serif';
                // Clean up ref display: "HEAD -> main" -> "main"
                const displayRef = ref.replace('HEAD -> ', '');
                const textWidth = ctx.measureText(displayRef).width;
                
                // Background badge
                ctx.fillStyle = ref.includes('HEAD') ? '#fee2e2' : '#e0e7ff';
                ctx.beginPath();
                ctx.roundRect(badgeX, node.y - 12, textWidth + 12, 18, 4);
                ctx.fill();
                
                ctx.fillStyle = ref.includes('HEAD') ? '#ef4444' : '#4f46e5';
                ctx.fillText(displayRef, badgeX + 6, node.y + 1);
                
                badgeX += textWidth + 20;
            });
        }
    });
  }, [commits]);

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
         Loading graph...
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--panel-border)' }}>
        <h2 className="panel-title" style={{ margin: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M13 6h3a2 2 0 0 1 2 2v7"/><line x1="6" y1="9" x2="6" y2="21"/></svg>
          Commit Visualization
        </h2>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '24px', background: 'transparent' }}>
         {error ? (
           <div style={{ color: 'var(--text-secondary)' }}>Initialize a repository to see the graph.</div>
         ) : commits.length === 0 ? (
           <div style={{ color: 'var(--text-secondary)' }}>No commits found.</div>
         ) : (
           <canvas 
             ref={canvasRef} 
             width={800} 
             style={{ display: 'block' }} 
           />
         )}
      </div>
    </div>
  );
};

export default GitVisualizer;
