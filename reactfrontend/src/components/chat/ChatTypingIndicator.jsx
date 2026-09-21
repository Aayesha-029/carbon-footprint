import React from 'react';

const ChatTypingIndicator = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px 12px',
        background: '#ffffff',
        borderRadius: '16px 16px 16px 4px',
        border: '1px solid #e2e8f0',
        alignSelf: 'flex-start',
        maxWidth: '80px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <span style={{ fontSize: '14px', color: '#94a3b8' }}>EcoAI is thinking</span>
      <div style={{ display: 'flex', gap: '4px', marginLeft: '4px' }}>
        <span className="typing-dot" style={{ animationDelay: '0s' }}>●</span>
        <span className="typing-dot" style={{ animationDelay: '0.2s' }}>●</span>
        <span className="typing-dot" style={{ animationDelay: '0.4s' }}>●</span>
      </div>
    </div>
  );
};

// Add global styles for typing dots if not already present
const style = document.createElement('style');
style.textContent = `
  .typing-dot {
    font-size: 10px;
    color: #94a3b8;
    animation: dotPulse 1.4s infinite ease-in-out;
  }
  @keyframes dotPulse {
    0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
    30% { opacity: 1; transform: scale(1.2); }
  }
`;
document.head.appendChild(style);

export default ChatTypingIndicator;