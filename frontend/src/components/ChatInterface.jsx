import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import GitVisualizer from './GitVisualizer';

const ChatInterface = ({ onActionTaken }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: 'Initialize system... Ready to assist with your Git operations. How can I facilitate your workflow today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await apiService.sendChatMessage(userMessage, context);
      
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'agent', 
        text: response.response,
        actions: response.actions_taken
      }]);
      
      if (response.context) setContext(response.context);
      
      if (response.actions_taken && response.actions_taken.length > 0 && onActionTaken) {
        onActionTaken(response.actions_taken);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        sender: 'system', 
        text: 'System Link Failure. Please ensure the backend engine is operational.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const helpCommands = [
    { cmd: "upload my code", desc: "Stage, commit (AI-powered), and push changes." },
    { cmd: "status", desc: "Retrieve repository status and branch info." },
    { cmd: "create branch <name>", desc: "Branch initialization." },
    { cmd: "switch to <name>", desc: "Checkout existing branch." },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
      <header style={{ padding: '24px 32px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.2)' }}>
        <h2 style={{ fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-tertiary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-color)' }}></div>
          Neural Command Center
        </h2>
        <button 
          onClick={() => setShowHelp(true)}
          style={{ 
            color: 'var(--text-tertiary)', 
            fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.2s', padding: '4px'
          }}
          title="Manual"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
      </header>

      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', scrollBehavior: 'smooth' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            width: '100%'
          }}>
            <div style={{ 
              maxWidth: '85%', 
              padding: '16px 20px', 
              borderRadius: msg.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              background: msg.sender === 'user' ? 'linear-gradient(135deg, var(--accent-color), #4f46e5)' : 'var(--panel-bg)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--panel-border)',
              boxShadow: msg.sender === 'user' ? '0 10px 20px -5px rgba(99, 102, 241, 0.4)' : 'var(--shadow-lg)',
              color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
              position: 'relative', overflow: 'hidden'
            }}>
              {msg.sender === 'agent' && <div style={{ position: 'absolute', top: 0, left: 0, width: '2px', height: '100%', background: 'var(--accent-color)' }}></div>}
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.6' }}>{msg.text}</p>
              
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--panel-border)' }}>
                  <div style={{ fontSize: '0.75rem', color: msg.sender === 'user' ? '#fff' : 'var(--accent-color)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Operation Logs</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {msg.actions.map((act, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        {act}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '8px', padding: '0 8px' }}>{msg.sender === 'agent' ? 'AGENT CORE' : 'USER'}</span>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: '4px', padding: '12px' }}>
            <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--accent-color)', borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></span>
            <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--accent-color)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.2s' }}></span>
            <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--accent-color)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.4s' }}></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Integrated Visualization + Input — stacked, no overlap */}
      <div style={{ padding: '0 32px 32px 32px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>
        <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)', maxHeight: '260px', overflow: 'hidden' }}>
           <GitVisualizer refreshTrigger={messages.length} />
        </div>

        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', gap: '12px', background: 'var(--panel-bg)', padding: '10px', 
          borderRadius: '20px', border: '1px solid var(--panel-border)', boxShadow: 'var(--shadow-lg)',
          flexShrink: 0
        }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Issue command..."
            style={{ 
              flex: 1, padding: '12px 20px', borderRadius: '14px', border: 'none',
              background: 'transparent', color: 'var(--text-primary)', fontSize: '1rem', outline: 'none'
            }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            style={{
              padding: '0 24px', borderRadius: '14px', background: 'var(--accent-color)',
              color: '#fff', fontWeight: '700', opacity: (!input.trim() || isLoading) ? 0.4 : 1,
              boxShadow: '0 4px 15px var(--accent-glow)'
            }}
          >
            SEND
          </button>
        </form>
      </div>

      {showHelp && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="glass-panel" style={{ padding: '40px', width: '90%', maxWidth: '450px', background: 'var(--bg-color)', border: '1px solid var(--panel-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>Directives</h3>
              <button onClick={() => setShowHelp(false)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {helpCommands.map((item, idx) => (
                <div key={idx}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: 'var(--accent-color)', fontWeight: '700', marginBottom: '4px' }}>{item.cmd}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              style={{ width: '100%', padding: '14px', background: 'var(--accent-color)', color: '#fff', borderRadius: '12px', marginTop: '32px', fontWeight: '700', boxShadow: '0 4px 15px var(--accent-glow)' }}
            >
              CLOSE
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.2; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
