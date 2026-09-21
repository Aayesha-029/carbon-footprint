import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBack(true);
      setTimeout(() => setShowBack(false), 2200);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBack(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showBack) return null;

  return (
    <div className={`offline-banner ${isOnline ? 'is-online' : 'is-offline'}`}>
      <span className="offline-banner__icon">
        {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
      </span>
      <span>
        {isOnline ? "You're back online" : "You're offline — showing cached data"}
      </span>

      <style>{`
        .offline-banner {
          position: fixed; top: 0; left: 0; right: 0; z-index: 9998;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 8px 16px; font-size: 13px; font-weight: 700;
          font-family: inherit; color: #ffffff; pointer-events: none;
          animation: offlineSlideDown .28s cubic-bezier(.16,1,.3,1) both;
        }
        @keyframes offlineSlideDown {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .offline-banner.is-offline {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          box-shadow: 0 4px 14px rgba(245,158,11,.35);
        }
        .offline-banner.is-online {
          background: linear-gradient(135deg, #16a34a, #15803d);
          box-shadow: 0 4px 14px rgba(22,163,74,.35);
        }
        .offline-banner__icon { display: inline-flex; }
      `}</style>
    </div>
  );
};

export default OfflineBanner;