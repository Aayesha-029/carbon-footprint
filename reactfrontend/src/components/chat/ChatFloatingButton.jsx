import React from 'react';
import { useChat } from '../../contexts/ChatContext'; // ✅ fixed
import { MessageCircle, X } from 'lucide-react';

const ChatFloatingButton = () => {
  const { isOpen, toggleOpen } = useChat();

  return (
    <button
      onClick={toggleOpen}
      style={{
        position: 'fixed',
        bottom: '28px',
        right: '28px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #22c55e, #15803d)',
        border: 'none',
        boxShadow: '0 8px 32px rgba(34, 197, 94, 0.4)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        transition: 'all 0.3s ease',
        zIndex: 999,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(34, 197, 94, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(34, 197, 94, 0.4)';
      }}
      aria-label="Toggle EcoAI Chat"
    >
      {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
    </button>
  );
};

export default ChatFloatingButton;