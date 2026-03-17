import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

const GitVisualizer = ({ refreshTrigger }) => {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const data = await apiService.getGraph();
        setCommits(data.commits || []);
      } catch {
        console.error('Core visualization link failed.');
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, [refreshTrigger]);

  useEffect(() => {
    if (!canvasRef.current || !wrapRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const render = () => {
      const container = wrapRef.current;
      const logicalWidth = Math.max(container.clientWidth, 740);
      const nodeRadius = 8;
      const xSpacing = 46;
      const ySpacing = 44;
      const marginLeft = 26;
      const marginTop = 26;
      const labelXOffset = 18;

      // Reset transform each draw (important when re-rendering)
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (!commits || commits.length === 0) {
        canvas.width = logicalWidth * dpr;
        canvas.height = 220 * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, logicalWidth, 220);
        ctx.fillStyle = 'rgba(230,237,243,0.62)';
        ctx.font = '650 13px var(--font-sans)';
        ctx.fillText('No commits yet', 26, 60);
        return;
      }

      // Layout (simple lane assignment similar to Tkinter version)
      const assignedCols = new Map();
      let nextCol = 0;
      const coords = new Map();

      let y = marginTop;
      for (const c of commits) {
        const h = c.id;
        if (!assignedCols.has(h)) {
          assignedCols.set(h, nextCol++);
        }
        const col = assignedCols.get(h);
        coords.set(h, { x: marginLeft + col * xSpacing, y });

        // Propagate columns to parents (branch/merge hints)
        const parents = Array.isArray(c.parents) ? c.parents : [];
        parents.forEach((p, idx) => {
          if (!assignedCols.has(p)) {
            assignedCols.set(p, idx === 0 ? col : nextCol++);
          }
        });

        y += ySpacing;
      }

      const logicalHeight = Math.max(y + 18, 260);
      canvas.width = logicalWidth * dpr;
      canvas.height = logicalHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      // Edges
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.setLineDash([]);
      for (const c of commits) {
        const from = coords.get(c.id);
        if (!from) continue;
        const parents = Array.isArray(c.parents) ? c.parents : [];
        for (const p of parents) {
          const to = coords.get(p);
          ctx.beginPath();
          if (to) {
            ctx.moveTo(from.x, from.y + nodeRadius);
            ctx.bezierCurveTo(from.x, from.y + 22, to.x, to.y - 22, to.x, to.y - nodeRadius);
          } else {
            // parent not in the current window, draw dashed continuation
            ctx.setLineDash([4, 6]);
            ctx.moveTo(from.x, from.y + nodeRadius);
            ctx.lineTo(from.x, from.y + 26);
            ctx.setLineDash([]);
          }
          ctx.stroke();
        }
      }

      // Nodes + labels
      for (const c of commits) {
        const at = coords.get(c.id);
        if (!at) continue;

        const refs = Array.isArray(c.refs) ? c.refs.join(', ') : '';
        const isHead = refs.includes('HEAD');
        const nodeFill = isHead ? '#4c8dff' : 'rgba(11, 15, 20, 0.92)';
        const nodeStroke = isHead ? '#4c8dff' : 'rgba(255,255,255,0.22)';

        ctx.beginPath();
        ctx.arc(at.x, at.y, nodeRadius, 0, Math.PI * 2);
        ctx.fillStyle = nodeFill;
        ctx.fill();
        ctx.strokeStyle = nodeStroke;
        ctx.stroke();

        // Refs pill
        let xText = at.x + labelXOffset;
        if (refs) {
          const pillText = refs.replace(/[()]/g, '');
          ctx.font = '750 11px var(--font-mono)';
          const padX = 10;
          const w = Math.min(ctx.measureText(pillText).width + padX * 2, logicalWidth - xText - 20);
          const h = 18;
          ctx.fillStyle = 'rgba(255,255,255,0.08)';
          ctx.strokeStyle = 'rgba(255,255,255,0.12)';
          ctx.beginPath();
          ctx.roundRect(xText, at.y - 11, w, h, 10);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#a8c1ff';
          ctx.fillText(pillText, xText + padX, at.y + 3);
          xText += w + 10;
        }

        // Hash + message
        const short = (c.id || '').slice(0, 7);
        const msg = (c.message || '').trim();
        const text = `${short} ${msg}`;
        ctx.font = '600 12px var(--font-mono)';
        ctx.fillStyle = '#e6edf3';
        const maxW = logicalWidth - xText - 20;
        let drawn = text;
        if (ctx.measureText(drawn).width > maxW) {
          while (drawn.length > 10 && ctx.measureText(drawn + '…').width > maxW) {
            drawn = drawn.slice(0, -1);
          }
          drawn = drawn + '…';
        }
        ctx.fillText(drawn, xText, at.y + 4);
      }
    };

    render();
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);

  }, [commits]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '0.75rem', fontWeight: '850', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '9px', height: '9px', background: 'var(--secondary-accent)', borderRadius: '999px', boxShadow: '0 0 0 4px rgba(63,185,80,0.15)' }}></div>
          Graph
        </h2>
        {loading && <div style={{ fontSize: '0.78rem', color: 'var(--accent-color)', fontWeight: '800' }}>Syncing...</div>}
      </header>
      
      <div ref={wrapRef} style={{ flex: 1, minHeight: '260px', width: '100%', overflow: 'auto', background: 'rgba(2, 6, 23, 0.22)', borderRadius: '16px', padding: '16px', border: '1px solid var(--panel-border)' }}>
        <canvas ref={canvasRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
    </div>
  );
};

export default GitVisualizer;
