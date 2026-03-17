import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';

const ChatInterface = ({ onActionTaken }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: 'Initialize system... Ready to assist with your Git operations. How can I facilitate your workflow today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
    } catch {
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
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', position: 'relative' }}>
      <header style={{ padding: '18px 18px 10px 18px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '0.8rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '9px', height: '9px', background: 'var(--accent-color)', borderRadius: '999px', boxShadow: '0 0 0 4px rgba(76,141,255,0.15)' }}></div>
          Command Center
        </h2>
        <button 
          onClick={() => setShowHelp(true)}
          style={{ 
            color: 'var(--text-tertiary)', 
            fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s', padding: '6px', borderRadius: '10px'
          }}
          title="Manual"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
      </header>

      {/* Page scroll (no fixed-height inner scroll box) */}
      <div className="chat-messages" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            width: '100%'
          }}>
            <div style={{ 
              maxWidth: '85%', 
              padding: '12px 16px', 
              borderRadius: '14px',
              background: msg.sender === 'user' ? 'linear-gradient(135deg, rgba(76,141,255,0.95), rgba(196,161,255,0.85))' : 'rgba(255,255,255,0.06)',
              border: '1px solid var(--panel-border)',
              boxShadow: '0 18px 44px rgba(0,0,0,0.18)',
              color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
              position: 'relative'
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.9rem', fontWeight: '400', lineHeight: '1.5' }}>{msg.text}</p>
              
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--panel-border)' }}>
                  <div style={{ fontSize: '0.7rem', color: msg.sender === 'user' ? '#fff' : 'var(--accent-color)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Operation Logs</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {msg.actions.map((act, i) => (
                      <div key={i} style={{ fontSize: '0.75rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        {act}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '6px', padding: '0 6px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.08em' }}>{msg.sender === 'agent' ? 'AGENT' : 'USER'}</span>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', gap: '4px', padding: '12px' }}>
            <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></span>
            <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.2s' }}></span>
            <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.4s' }}></span>
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* Input form — below messages (page scroll) */}
        <form onSubmit={handleSubmit} style={{ 
          display: 'flex', gap: '12px',
          background: 'rgba(2, 6, 23, 0.22)',
          padding: '10px',
          borderRadius: '16px',
          border: '1px solid var(--panel-border)',
          marginTop: '10px'
        }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a command..."
            style={{ 
              flex: 1, padding: '10px 12px', borderRadius: '12px', border: 'none',
              background: 'transparent', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none'
            }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            style={{
              padding: '0 16px', borderRadius: '14px',
              background: 'linear-gradient(135deg, rgba(63,185,80,0.95), rgba(76,141,255,0.55))',
              color: '#fff', fontWeight: '800', opacity: (!input.trim() || isLoading) ? 0.6 : 1,
              fontSize: '0.85rem', letterSpacing: '0.02em'
            }}
          >
            Send
          </button>
        </form>
      </div>

      {showHelp && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{ padding: '40px', width: '90%', maxWidth: '450px', background: '#fff', border: '1px solid var(--panel-border)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: '600' }}>Directives</h3>
              <button onClick={() => setShowHelp(false)} style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {helpCommands.map((item, idx) => (
                <div key={idx}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--accent-color)', fontWeight: '600', marginBottom: '4px' }}>{item.cmd}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              style={{ width: '100%', padding: '12px', background: '#f6f8fa', border: '1px solid var(--panel-border)', color: 'var(--text-primary)', borderRadius: '6px', marginTop: '32px', fontWeight: '600' }}
            >
              Close
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
