import React, { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';

const ChatInterface = ({ onActionTaken }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'agent', text: 'Hello! I am your AI Git Agent. How can I help you manage your repository today?' }
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
        text: 'Error communicating with the backend. Is the server running?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const helpCommands = [
    { cmd: "upload my code", desc: "Stages, commits, and pushes all changes" },
    { cmd: "status", desc: "Shows modified files and current branch" },
    { cmd: "create branch <name>", desc: "Creates and switches to a new branch" },
    { cmd: "switch to <name>", desc: "Checks out an existing branch" },
    { cmd: "undo last commit", desc: "Soft resets the most recent commit" },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', position: 'relative' }}>
      <div className="chat-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--panel-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="panel-title" style={{ margin: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
          Chat Interaction
        </h2>
        <button 
          onClick={() => setShowHelp(true)}
          style={{ 
            background: 'var(--accent-bg)', 
            color: 'var(--accent-color)', 
            border: '1px solid var(--accent-border)',
            borderRadius: '50%', width: '32px', height: '32px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s'
          }}
          title="Show Supported Commands"
        >
          ?
        </button>
      </div>

      <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((msg) => (
          <div key={msg.id} style={{ 
            display: 'flex', 
            justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            width: '100%'
          }}>
            <div style={{ 
              maxWidth: '80%', 
              padding: '12px 16px', 
              borderRadius: '12px',
              backgroundColor: msg.sender === 'user' ? 'var(--accent-color)' : msg.sender === 'system' ? 'rgba(239, 68, 68, 0.1)' : 'var(--code-bg)',
              border: msg.sender === 'agent' ? '1px solid var(--panel-border)' : msg.sender === 'system' ? '1px solid rgba(239,68,68,0.3)' : 'none',
              boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(99, 102, 241, 0.25)' : 'none',
              color: msg.sender === 'user' ? '#fff' : msg.sender === 'system' ? 'var(--error-color)' : 'var(--text-primary)'
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{msg.text}</p>
              
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: '600' }}>Actions Executed:</span>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {msg.actions.map((act, i) => <li key={i}>{act}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: '12px',
              backgroundColor: 'var(--code-bg)',
              border: '1px solid var(--panel-border)',
              display: 'flex', gap: '6px', alignItems: 'center', height: '40px'
            }}>
              <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></span>
              <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.2s' }}></span>
              <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area" style={{ padding: '20px 24px', borderTop: '1px solid var(--panel-border)', background: 'rgba(255,255,255,0.5)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you want to do (e.g., 'upload my code')..."
            style={{ 
              flex: 1, 
              padding: '14px 16px', 
              borderRadius: '10px', 
              border: '1px solid var(--panel-border)',
              backgroundColor: '#fff',
              color: 'var(--text-primary)',
              fontSize: '1rem',
              outline: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.boxShadow = 'var(--shadow-glow)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--panel-border)'; e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)'; }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            style={{
              padding: '0 24px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-color)',
              color: '#fff',
              fontWeight: '600',
              opacity: (!input.trim() || isLoading) ? 0.6 : 1,
              transition: 'background-color 0.2s, transform 0.1s, box-shadow 0.2s',
              cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (!input.trim() || isLoading) ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}
            onMouseEnter={(e) => { if (input.trim() && !isLoading) e.target.style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = 'var(--accent-color)'; }}
            onMouseDown={(e) => { if (input.trim() && !isLoading) e.target.style.transform = 'scale(0.96)'; }}
            onMouseUp={(e) => { if (input.trim() && !isLoading) e.target.style.transform = 'scale(1)'; }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>

      {showHelp && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.2s ease-out', zIndex: 10
        }}>
          <div style={{
            background: '#fff', padding: '32px', borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', width: '80%', maxWidth: '400px',
            border: '1px solid var(--panel-border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.25rem' }}>Supported Commands</h3>
              <button 
                onClick={() => setShowHelp(false)}
                style={{ color: 'var(--text-tertiary)', cursor: 'pointer', background: 'none' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {helpCommands.map((item, idx) => (
                <div key={idx} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--panel-border)' }}>
                  <div style={{ 
                    fontFamily: 'var(--font-mono)', fontSize: '0.9rem', 
                    color: 'var(--accent-color)', fontWeight: '600', marginBottom: '4px' 
                  }}>
                    "{item.cmd}"
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              style={{ width: '100%', padding: '12px', background: 'var(--code-bg)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', borderRadius: '8px', marginTop: '20px', fontWeight: '500' }}
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
