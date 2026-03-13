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
        const data = await apiService.getRepoGraph();
        setCommits(data.nodes || []);
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
    ctx.strokeStyle = 'rgba(129, 140, 248, 0.4)';
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);

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

      // Glow 
      ctx.beginPath();
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, nodeRadius * 3);
      gradient.addColorStop(0, 'rgba(129, 140, 248, 0.3)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.arc(x, y, nodeRadius * 3, 0, Math.PI * 2);
      ctx.fill();

      // Main Circle
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      const nodeGrad = ctx.createLinearGradient(x - nodeRadius, y - nodeRadius, x + nodeRadius, y + nodeRadius);
      nodeGrad.addColorStop(0, '#818cf8');
      nodeGrad.addColorStop(1, '#4f46e5');
      ctx.fillStyle = nodeGrad;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Labels
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 0.8rem "JetBrains Mono"';
      ctx.textAlign = 'center';
      ctx.fillText(commit.id.substring(0, 7), x, y + 30);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '500 0.75rem "Outfit"';
      let msg = commit.message || 'No message';
      if (msg.length > 18) msg = msg.substring(0, 15) + '...';
      ctx.fillText(msg, x, y + 48);

      if (i === 0) {
        ctx.fillStyle = '#2dd4bf';
        ctx.font = 'bold 0.65rem "Outfit"';
        ctx.fillText('HEAD', x, y - 24);
      }
    });

  }, [commits]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--secondary-accent)', borderRadius: '50%', boxShadow: '0 0 10px var(--secondary-accent)' }}></div>
          Temporal Registry
        </h2>
        {loading && <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: '700', animation: 'blink 1.4s infinite' }}>SYNCING...</div>}
      </header>
      
      <div style={{ flex: 1, minHeight: '300px', width: '100%', overflowX: 'auto', background: 'rgba(15, 23, 42, 0.2)', borderRadius: '20px', padding: '20px', border: '1px solid var(--panel-border)' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '300px', display: 'block' }} />
      </div>
    </div>
  );
};

export default GitVisualizer;
