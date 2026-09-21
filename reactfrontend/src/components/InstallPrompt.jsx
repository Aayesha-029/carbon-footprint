import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);

    try {
      const dismissed = localStorage.getItem('pwaInstallDismissed');
      if (dismissed) {
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(dismissed, 10) < thirtyDays) return;
      }
    } catch (_) {}

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      console.log('PWA install outcome:', outcome);
    } catch (err) {
      console.warn('Install prompt failed:', err);
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    try { localStorage.setItem('pwaInstallDismissed', String(Date.now())); } catch (_) {}
    setShow(false);
  };

  if (!show || isStandalone) return null;

  return (
    <div className="pwa-install-banner">
      <div className="pwa-install-banner__icon"><Download size={20} /></div>
      <div className="pwa-install-banner__text">
        <div className="pwa-install-banner__title">Install CarbonTrack</div>
        <div className="pwa-install-banner__sub">Faster access · works offline</div>
      </div>
      <button className="pwa-install-banner__cta" onClick={handleInstall}>Install</button>
      <button className="pwa-install-banner__close" onClick={handleDismiss} aria-label="Dismiss"><X size={16} /></button>

      <style>{`
        .pwa-install-banner {
          position: fixed; left: 50%; bottom: 24px; transform: translateX(-50%);
          z-index: 9000; display: flex; align-items: center; gap: 12px;
          padding: 12px 14px;
          background: var(--bg-surface, #ffffff);
          border: 1px solid var(--border, #e2e8f0);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,.15);
          animation: pwaSlideUp .35s cubic-bezier(.16,1,.3,1) both;
          max-width: calc(100vw - 32px);
        }
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        .pwa-install-banner__icon {
          width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #ffffff; display: grid; place-items: center;
          box-shadow: 0 4px 12px rgba(22,163,74,.32);
        }
        .pwa-install-banner__text { min-width: 0; }
        .pwa-install-banner__title { font-size: 14px; font-weight: 800; color: var(--text-strong, #0f172a); }
        .pwa-install-banner__sub { font-size: 12px; color: var(--text-muted, #64748b); font-weight: 500; }
        .pwa-install-banner__cta {
          padding: 8px 16px; border: none; border-radius: 10px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #ffffff; font-size: 13px; font-weight: 700;
          cursor: pointer; font-family: inherit;
          box-shadow: 0 4px 12px rgba(22,163,74,.28);
          transition: all .2s ease; white-space: nowrap;
        }
        .pwa-install-banner__cta:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(22,163,74,.42); }
        .pwa-install-banner__close {
          width: 28px; height: 28px; border: none; background: transparent;
          border-radius: 8px; color: var(--text-muted, #64748b);
          cursor: pointer; display: grid; place-items: center;
          transition: all .15s ease; flex-shrink: 0;
        }
        .pwa-install-banner__close:hover { background: var(--tint-1, #f0fdf4); color: var(--green-600, #16a34a); }
        body.dark-theme .pwa-install-banner { background: #121a17; border-color: #24312b; box-shadow: 0 12px 40px rgba(0,0,0,.6); }
        body.dark-theme .pwa-install-banner__title { color: #f2f7f4; }
        body.dark-theme .pwa-install-banner__sub { color: #8fa39a; }
        body.dark-theme .pwa-install-banner__close { color: #8fa39a; }
        body.dark-theme .pwa-install-banner__close:hover { background: rgba(34,197,94,.14); color: #4ade80; }
        @media (max-width: 640px) {
          .pwa-install-banner { bottom: 16px; left: 16px; right: 16px; transform: none; }
          .pwa-install-banner__sub { display: none; }
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt;