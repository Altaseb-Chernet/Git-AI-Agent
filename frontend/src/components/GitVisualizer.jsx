import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

const GitVisualizer = ({ refreshTrigger }) => {
  const canvasRef = useRef(null);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await apiService.getGraph();
        setCommits(data.commits || []);
      } catch (err) {
        console.error('Core visualization link failed.');
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!canvasRef.current || commits.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    const container = canvas.parentElement;
    canvas.width = container.clientWidth * dpr;
    canvas.height = 300 * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const nodeRadius = 10;
    const spacing = 140;
    const startX = 60;
    const centerY = 150;

    // Draw Edges
    ctx.beginPath();
    ctx.strokeStyle = '#d0d7de';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    commits.forEach((commit, i) => {
      if (i < commits.length - 1) {
        ctx.moveTo(startX + i * spacing + nodeRadius, centerY);
        ctx.lineTo(startX + (i + 1) * spacing - nodeRadius, centerY);
      }
    });
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Nodes
    commits.forEach((commit, i) => {
      const x = startX + i * spacing;
      const y = centerY;

      // Outer circle
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? '#0969da' : '#ffffff';
      ctx.fill();
      ctx.strokeStyle = i === 0 ? '#0969da' : '#57606a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Labels
      ctx.fillStyle = 'var(--text-primary)';
      ctx.font = '600 0.8rem var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.fillText(commit.id.substring(0, 7), x, y + 25);

      ctx.fillStyle = 'var(--text-secondary)';
      ctx.font = '400 0.75rem var(--font-sans)';
      let msg = commit.message || 'No message';
      if (msg.length > 20) msg = msg.substring(0, 17) + '...';
      ctx.fillText(msg, x, y + 42);

      if (i === 0) {
        ctx.fillStyle = '#1a7f37';
        ctx.font = '600 0.7rem var(--font-sans)';
        ctx.fillText('HEAD', x, y - 20);
      }
    });

  }, [commits]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--secondary-accent)', borderRadius: '50%' }}></div>
          Registry
        </h2>
        {loading && <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '600' }}>Syncing...</div>}
      </header>
      
      <div style={{ flex: 1, minHeight: '300px', width: '100%', overflowX: 'auto', background: '#f6f8fa', borderRadius: '6px', padding: '20px', border: '1px solid var(--panel-border)' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '300px', display: 'block' }} />
      </div>
    </div>
  );
};

export default GitVisualizer;
