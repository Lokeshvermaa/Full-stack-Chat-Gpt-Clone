import React, { useEffect, useRef } from 'react'

export default function ChatMessages({ messages, sending, socketError }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  return (
    <div className="messages-panel">
      {messages.length === 0 && !sending && (
        <div className="empty-state">
          <div className="empty-logo">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="empty-title">ChatGPT Clone</h1>
          <p className="empty-subtitle">How can I help you today?</p>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg._id} className={`message ${msg.role === 'user' ? 'message-user' : 'message-ai'}`}>
          {msg.role !== 'user' && (
            <div className="message-avatar ai-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          )}
          <div className="message-content">
            <div className="message-role">{msg.role === 'user' ? 'You' : 'ChatGPT'}</div>
            <p>{msg.content}</p>
          </div>
          {msg.role === 'user' && (
            <div className="message-avatar user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          )}
        </div>
      ))}

      {sending && (
        <div className="message message-ai">
          <div className="message-avatar ai-avatar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="message-content">
            <div className="message-role">ChatGPT</div>
            <div className="typing-indicator">
              <span /><span /><span />
            </div>
          </div>
        </div>
      )}

      {socketError && (
        <div className="socket-error-banner">
          {socketError}
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
