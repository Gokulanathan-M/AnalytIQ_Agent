import React, { useState, useRef, useEffect } from 'react';
import { chatWithData } from '../api/client';
import './ChatPanel.css';

const SUGGESTED_QUESTIONS = [
  'What are the top 5 most correlated features?',
  'Show me the distribution of the target column.',
  'Which columns have the most missing values?',
  'What are the key outliers in the numeric columns?',
  'Summarize the dataset in one paragraph.',
];

export default function ChatPanel({ sessionId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I\'m your AI data analyst. Ask me anything about your dataset — statistics, trends, patterns, or comparisons.',
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const q = text || query.trim();
    if (!q || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await chatWithData(sessionId, q);
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.response?.data?.detail || 'Something went wrong. Please try again.'}`,
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-section fade-in-delay-4">
      <div className="section-title">
        <span className="icon">💬</span>
        Chat with Your Data
      </div>
      <p className="chat-description">
        Ask natural language questions. The AI will query your dataset and explain the results.
      </p>

      {/* Suggested questions */}
      <div className="suggestions">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={i}
            className="suggestion-chip"
            onClick={() => sendMessage(q)}
            disabled={loading}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Message window */}
      <div className="chat-window glass-card">
        <div className="chat-messages" id="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message message--${msg.role} ${msg.isError ? 'message--error' : ''}`}>
              <div className="message-avatar">
                {msg.role === 'assistant' ? '🤖' : '👤'}
              </div>
              <div className="message-bubble">
                <p className="message-role">
                  {msg.role === 'assistant' ? 'AnalytIQ AI' : 'You'}
                </p>
                <p className="message-text">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="message message--assistant">
              <div className="message-avatar">🤖</div>
              <div className="message-bubble">
                <p className="message-role">AnalytIQ AI</p>
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div className="chat-input-row">
          <textarea
            className="input chat-textarea"
            placeholder="Ask anything about your dataset…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            id="chat-input"
          />
          <button
            className="btn btn-primary send-btn"
            onClick={() => sendMessage()}
            disabled={loading || !query.trim()}
            id="chat-send-btn"
          >
            {loading ? <div className="spinner" /> : <span>↑</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
