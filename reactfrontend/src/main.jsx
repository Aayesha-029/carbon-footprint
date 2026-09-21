import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import './styles/globals.css';

console.log('🚀 Starting React app...');

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('🔄 New version available');
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline');
  },
  onRegisteredSW(swUrl, registration) {
    console.log('📦 Service worker registered:', swUrl);
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
    }
  },
  onRegisterError(error) {
    console.error('❌ Service worker registration failed:', error);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);