import React from 'react';
import { useChat } from '../../contexts/ChatContext';

const SuggestedQuestions = () => {
  const { suggestions, sendUserMessage, isLoading } = useChat();

  if (suggestions.length === 0) return null;

  return (
    <div
      style={{
        padding: '12px 16px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        flexShrink: 0,
        justifyContent: 'center',
        maxHeight: '120px',
        overflowY: 'auto',
      }}
    >
      {suggestions.map((q, idx) => (
        <button
          key={idx}
          onClick={() => sendUserMessage(q)}
          disabled={isLoading}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            background: '#f1f5f9',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#0f172a',
            cursor: isLoading ? 'default' : 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = '#22c55e';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = '#22c55e';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.color = '#0f172a';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }
          }}
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;