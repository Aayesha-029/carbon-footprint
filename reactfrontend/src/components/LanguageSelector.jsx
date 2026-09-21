import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, Check, ChevronDown } from 'lucide-react';

const LanguageSelector = () => {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'Hindi',   flag: '🇮🇳' },
    { code: 'es', label: 'Spanish', flag: '🇪🇸' },
    { code: 'de', label: 'German',  flag: '🇩🇪' },
    { code: 'fr', label: 'French',  flag: '🇫🇷' },
  ];

  const currentLanguage = languages.find(l => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    console.log('🔄 Language selected:', langCode);
    changeLanguage(langCode);
    setIsOpen(false);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <div className="lang-wrap" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lang-btn ${isOpen ? 'is-open' : ''}`}
        aria-label="Select language"
      >
        <Globe size={16} color={isOpen ? 'var(--green-600)' : 'var(--text-muted)'} />
        <span className="lang-btn__label">{currentLanguage.label}</span>
        <ChevronDown
          size={14}
          className={`lang-btn__chev ${isOpen ? 'is-open' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="lang-dropdown">
          <div className="lang-dropdown__head">Select Language</div>

          {languages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`lang-option ${isActive ? 'is-active' : ''}`}
              >
                <span className="lang-option__flag">{lang.flag}</span>
                <span className="lang-option__label">{lang.label}</span>
                {isActive && (
                  <Check size={16} color="#16a34a" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        .lang-wrap { position: relative; }

        /* ---- trigger ---- */
        .lang-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: var(--bg-surface);
          color: var(--text-strong);
          cursor: pointer;
          font-family: inherit;
          font-size: 13.5px;
          font-weight: 600;
          letter-spacing: -.1px;
          transition: all .2s var(--ease);
        }
        .lang-btn:hover {
          border-color: var(--green-400);
          background: var(--tint-1);
          transform: translateY(-1px);
        }
        .lang-btn.is-open {
          border-color: var(--green-500);
          background: var(--tint-1);
          box-shadow: 0 0 0 3px rgba(34,197,94,.14);
        }
        .lang-btn__label { min-width: 58px; text-align: left; }
        .lang-btn__chev {
          color: var(--text-muted);
          transition: transform .2s var(--ease);
        }
        .lang-btn__chev.is-open { transform: rotate(180deg); }

        /* ---- dropdown ---- */
        .lang-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 210px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 14px;
          box-shadow: 0 12px 40px rgba(0,0,0,.12), 0 4px 12px rgba(0,0,0,.06);
          padding: 8px;
          z-index: 1000;
          animation: langSlide .2s var(--ease-out);
        }

        .lang-dropdown__head {
          padding: 8px 12px 6px;
          font-size: 11px;
          font-weight: 800;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: .8px;
        }

        /* ---- option ---- */
        .lang-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-strong);
          cursor: pointer;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
          margin-bottom: 2px;
          transition: background .15s var(--ease), color .15s var(--ease);
        }
        .lang-option:last-child { margin-bottom: 0; }
        .lang-option:hover:not(.is-active) {
          background: var(--tint-1);
          color: var(--green-700);
        }
        .lang-option.is-active {
          background: var(--tint-1);
          color: var(--green-700);
          font-weight: 800;
        }
        .lang-option__flag {
          font-size: 20px;
          line-height: 1;
        }
        .lang-option__label { flex: 1; }

        /* ---- animation ---- */
        @keyframes langSlide {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 720px) {
          .lang-btn__label { min-width: auto; }
        }
      `}</style>
    </div>
  );
};

export default LanguageSelector;