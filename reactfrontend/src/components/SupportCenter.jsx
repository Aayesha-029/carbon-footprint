import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  MessageCircle, Plus, List, RefreshCw,
  Search, Filter, Clock, AlertCircle,
  Check, X, ChevronRight, Eye
} from 'lucide-react';
import NewTicket from './NewTicket';
import MyTickets from './MyTickets';

const Toast = ({ type, message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  const styles = {
    success: { background: 'var(--pill-success-bg)', border: '1px solid var(--tint-border)', color: 'var(--pill-success-fg)', icon: <Check size={20} /> },
    error: { background: 'var(--pill-danger-bg)', border: '1px solid rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)', icon: <X size={20} /> },
    info: { background: 'var(--pill-info-bg)', border: '1px solid rgba(59,130,246,.28)', color: 'var(--pill-info-fg)', icon: <AlertCircle size={20} /> }
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '16px 24px', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.15)',
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 320, maxWidth: 500,
      animation: 'slideInRight .4s var(--ease-out)', ...style
    }}>
      {style.icon}
      <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'inherit', opacity: .6, padding: 4 }}>×</button>
    </div>
  );
};

const SupportCenter = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('mytickets');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0
  });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/tickets/user');
      const tickets = response.data.tickets || [];
      const total = tickets.length;
      const open = tickets.filter(t => t.status === 'OPEN').length;
      const inProgress = tickets.filter(t => t.status === 'IN_PROGRESS').length;
      const resolved = tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;
      setStats({ total, open, inProgress, resolved });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const tabs = [
    { id: 'mytickets', label: t('support.myTickets'), icon: <List size={17} /> },
    { id: 'newticket', label: t('support.newTicket'), icon: <Plus size={17} /> },
  ];

  return (
    <Layout userRole="user">
      <Toast type={toast.type} message={toast.message} onClose={hideToast} />

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><MessageCircle size={24} /></div>
              <div className="ui-hero__text">
<h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.supportCenter')}</h1>                <p className="ui-hero__subtitle ui-hero__compact">
                  {t('support.description')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadStats}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: summary stat cards --- */}
        <div className="ui-grid ui-grid--4" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><MessageCircle size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.total}</div>
            <div className="ui-stat__label">{t('support.totalTickets')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><AlertCircle size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.open}</div>
            <div className="ui-stat__label">{t('support.open')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Clock size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.inProgress}</div>
            <div className="ui-stat__label">{t('support.inProgress')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Check size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.resolved}</div>
            <div className="ui-stat__label">{t('support.resolved')}</div>
          </div>
        </div>

        {/* --- UI: tab bar with prominent active state (matches Settings) --- */}
        <div className="settings-tabs" style={{ maxWidth: 460 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            >
              <span className="settings-tab__icon">{tab.icon}</span>
              <span className="settings-tab__label">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="settings-tab__dot" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {activeTab === 'newticket' ? (
          <NewTicket onTicketCreated={loadStats} />
        ) : (
          <MyTickets />
        )}
      </div>

      <style>{`
        .ui-hero__title--module {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.6px;
          line-height: 1.15;
          color: #ffffff;
          margin: 0 0 4px;
        }
        .ui-hero__subtitle--compact {
          font-size: 14.5px;
          font-weight: 500;
          line-height: 1.5;
          color: rgba(255,255,255,.90);
          margin: 0;
          max-width: 62ch;
        }

        /* ==========================================================
           TABS — shared with Settings
           ========================================================== */
        .settings-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 24px;
          padding: 6px;
          background: var(--bg-subtle);
          border-radius: 14px;
          border: 1px solid var(--border);
          max-width: 640px;
        }

        .settings-tab {
          position: relative;
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 18px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -.1px;
          cursor: pointer;
          transition: background .2s var(--ease),
                      color .2s var(--ease),
                      transform .2s var(--ease),
                      box-shadow .2s var(--ease);
        }

        .settings-tab:hover:not(.is-active) {
          color: var(--green-700);
          background: var(--tint-1);
          transform: translateY(-1px);
        }

        .settings-tab.is-active {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 6px 16px rgba(22,163,74,.35);
        }

        .settings-tab__icon {
          display: inline-flex;
          align-items: center;
        }

        .settings-tab__label { white-space: nowrap; }

        .settings-tab__dot {
          position: absolute;
          top: 8px;
          right: 10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #bef264;
          box-shadow: 0 0 0 3px rgba(190,242,100,.25);
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 1024px) {
          .ui-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
          .ui-grid--4 { grid-template-columns: minmax(0, 1fr); }
          .settings-tabs { flex-direction: column; max-width: 100%; }
          .settings-tab { width: 100%; }
          .settings-tab__dot { top: 50%; right: 14px; transform: translateY(-50%); }
        }
      `}</style>
    </Layout>
  );
};

export default SupportCenter;