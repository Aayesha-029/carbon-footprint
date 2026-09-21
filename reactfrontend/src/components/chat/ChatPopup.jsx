import React, { useRef, useEffect } from 'react';
import { useChat } from '../../contexts/ChatContext';
import ChatMessageList from './ChatMessageList';
import ChatInput from './ChatInput';
import SuggestedQuestions from './SuggestedQuestions';
import { X } from 'lucide-react';

const ChatPopup = () => {
  const { isOpen, toggleOpen, messages, isLoading, suggestions } = useChat();
  const popupRef = useRef(null);

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      style={{
        position: 'fixed',
        bottom: '100px',
        right: '28px',
        width: '420px',
        maxWidth: 'calc(100vw - 56px)',
        height: '600px',
        maxHeight: 'calc(100vh - 140px)',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        animation: 'slideUp 0.3s ease',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #22c55e, #15803d)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
            }}
          >
            🌿
          </div>
          <span style={{ fontWeight: 600, fontSize: '16px' }}>EcoAI Assistant</span>
        </div>
        <button
          onClick={toggleOpen}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer',
            color: '#ffffff',
          }}
          aria-label="Close chat"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <ChatMessageList />

      {/* Suggestions - ALWAYS show if there are any, even with messages */}
      {suggestions.length > 0 && !isLoading && <SuggestedQuestions />}

      {/* Input */}
      <ChatInput />
    </div>
  );
};

export default ChatPopup;