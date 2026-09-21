import React, { createContext, useState, useContext, useCallback, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendMessage } from '../api/chatApi';
import { pageSuggestions, defaultSuggestions } from '../config/suggestedQuestions';

const ChatContext = createContext();
export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const location = useLocation(); // <-- React Router hook for current route
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [hasStarted, setHasStarted] = useState(false);
  const abortControllerRef = useRef(null);

  // Load suggestions based on current path (longest match)
  const loadSuggestions = useCallback(() => {
    const path = location.pathname;
    console.log('📍 Current path:', path);
    // Find all matching keys and pick the longest one
    const matchedKey = Object.keys(pageSuggestions)
      .filter(key => path.startsWith(key))
      .sort((a, b) => b.length - a.length)[0];
    console.log('🔑 Matched key:', matchedKey);
    const suggestionsForPage = matchedKey ? pageSuggestions[matchedKey] : defaultSuggestions;
    console.log('💡 Suggestions loaded:', suggestionsForPage);
    setSuggestions(suggestionsForPage);
  }, [location.pathname]);

  // Refresh suggestions when route changes (if chat has started)
  useEffect(() => {
    if (hasStarted) {
      loadSuggestions();
    }
  }, [location.pathname, hasStarted, loadSuggestions]);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => {
      const newState = !prev;
      if (newState && !hasStarted) {
        setHasStarted(true);
        loadSuggestions();
        if (messages.length === 0) {
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: "👋 Hi! I'm EcoAI, your sustainability assistant. Ask me anything about your carbon footprint, activities, goals, or eco-friendly tips!",
              timestamp: new Date().toISOString(),
            }
          ]);
        }
      }
      return newState;
    });
  }, [hasStarted, loadSuggestions, messages.length]);

  const sendUserMessage = useCallback(async (text) => {
    if (!text || !text.trim()) return;
    const trimmed = text.trim();
    const userMsg = {
      id: Date.now() + '-user',
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      const response = await sendMessage(trimmed);
      if (response.isError) {
        setError(response.errorMessage || 'Something went wrong.');
        const errMsg = {
          id: Date.now() + '-error',
          role: 'assistant',
          content: response.message || response.errorMessage || 'I apologize, but I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages(prev => [...prev, errMsg]);
      } else {
        const assistantMsg = {
          id: Date.now() + '-assistant',
          role: 'assistant',
          content: response.message,
          timestamp: response.timestamp || new Date().toISOString(),
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        id: Date.now() + '-error',
        role: 'assistant',
        content: err.response?.data?.message || err.message || 'Unable to connect. Please try again later.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMsg]);
      setError(err.message);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setError(null);
    setHasStarted(false);
    setSuggestions([]);
  }, []);

  const value = {
    messages,
    isOpen,
    isLoading,
    error,
    suggestions,
    hasStarted,
    toggleOpen,
    sendUserMessage,
    clearConversation,
    loadSuggestions,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};