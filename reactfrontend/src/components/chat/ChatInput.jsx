import React, { useState, useRef } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { Send } from 'lucide-react';

const ChatInput = () => {
  const [input, setInput] = useState('');
  const { sendUserMessage, isLoading } = useChat();
  const inputRef = useRef(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      sendUserMessage(input.trim());
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid #e2e8f0',
        background: '#ffffff',
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask EcoAI..."
        disabled={isLoading}
        style={{
          flex: 1,
          padding: '10px 14px',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s',
          background: '#f8fafc',
          color: '#0f172a',
        }}
        onFocus={(e) => (e.target.style.borderColor = '#22c55e')}
        onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
      />
      <button
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        style={{
          padding: '10px 12px',
          borderRadius: '50%',
          background: input.trim() && !isLoading ? '#22c55e' : '#e2e8f0',
          border: 'none',
          color: '#ffffff',
          cursor: input.trim() && !isLoading ? 'pointer' : 'default',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px',
          height: '44px',
        }}
        aria-label="Send message"
      >
        <Send size={18} />
      </button>
    </div>
  );
};

export default ChatInput;