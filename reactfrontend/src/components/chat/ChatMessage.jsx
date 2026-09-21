import React from 'react';
import ChatMessageContent from './ChatMessageContent';

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user';
  const isError = message.isError || false;

  const time = message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '4px',
      }}
    >
      <div
        style={{
          maxWidth: '80%',
          padding: '12px 16px',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? '#22c55e' : (isError ? '#fee2e2' : '#ffffff'),
          color: isUser ? '#ffffff' : (isError ? '#991b1b' : '#0f172a'),
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          border: isError ? '1px solid #fecaca' : (isUser ? 'none' : '1px solid #e2e8f0'),
          wordBreak: 'break-word',
          fontSize: '14px',
          lineHeight: 1.5,
        }}
      >
        {isUser ? message.content : <ChatMessageContent text={message.content} />}
        {time && (
          <div
            style={{
              fontSize: '10px',
              color: isUser ? 'rgba(255,255,255,0.7)' : '#94a3b8',
              marginTop: '6px',
              textAlign: 'right',
            }}
          >
            {time}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;