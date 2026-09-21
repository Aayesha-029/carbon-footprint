import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatMessage from './ChatMessage';
import ChatTypingIndicator from './ChatTypingIndicator';

const ChatMessageList = () => {
  const { messages, isLoading } = useChat();
  const containerRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when messages change or loading changes
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#f8fafc',
      }}
    >
      {messages.length === 0 && !isLoading && (
        <div
          style={{
            textAlign: 'center',
            color: '#94a3b8',
            fontSize: '14px',
            marginTop: '40px',
          }}
        >
          <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🌱</span>
          Ask me anything about your carbon footprint!
        </div>
      )}
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {isLoading && <ChatTypingIndicator />}
    </div>
  );
};

export default ChatMessageList;