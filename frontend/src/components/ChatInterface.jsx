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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div className="chat-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--panel-border)' }}>
        <h2 className="panel-title" style={{ margin: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>
          Chat Interaction
        </h2>
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
              backgroundColor: msg.sender === 'user' ? 'var(--accent-color)' : msg.sender === 'system' ? 'var(--error-color)' : 'rgba(255, 255, 255, 0.05)',
              border: msg.sender === 'agent' ? '1px solid var(--panel-border)' : 'none',
              boxShadow: msg.sender === 'user' ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none',
              color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)'
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>{msg.text}</p>
              
              {msg.actions && msg.actions.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-glow)' }}>Actions Executed:</span>
                  <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
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
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--panel-border)',
              display: 'flex', gap: '4px'
            }}>
              <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both' }}></span>
              <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.2s' }}></span>
              <span className="dot" style={{ width: '6px', height: '6px', background: 'var(--text-tertiary)', borderRadius: '50%', animation: 'blink 1.4s infinite both 0.4s' }}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area" style={{ padding: '20px 24px', borderTop: '1px solid var(--panel-border)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell me what you want to do (e.g., 'upload my code to github')"
            style={{ 
              flex: 1, 
              padding: '14px 16px', 
              borderRadius: '8px', 
              border: '1px solid var(--panel-border)',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: '#fff',
              fontSize: '1rem',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-color)'; e.target.style.boxShadow = 'var(--shadow-glow)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--panel-border)'; e.target.style.boxShadow = 'none'; }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            style={{
              padding: '0 24px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-color)',
              color: '#fff',
              fontWeight: '600',
              opacity: (!input.trim() || isLoading) ? 0.6 : 1,
              transition: 'background-color 0.2s, transform 0.1s',
              cursor: (!input.trim() || isLoading) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => { if (input.trim() && !isLoading) e.target.style.backgroundColor = 'var(--accent-hover)'; }}
            onMouseLeave={(e) => { e.target.style.backgroundColor = 'var(--accent-color)'; }}
            onMouseDown={(e) => { if (input.trim() && !isLoading) e.target.style.transform = 'scale(0.96)'; }}
            onMouseUp={(e) => { if (input.trim() && !isLoading) e.target.style.transform = 'scale(1)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
      <style>{`
        @keyframes blink {
          0% { opacity: 0.2; }
          20% { opacity: 1; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
