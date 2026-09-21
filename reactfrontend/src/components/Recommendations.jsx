import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Lightbulb, Leaf, Car, Zap, Utensils, ShoppingBag,
  Award, Bus, RefreshCw, AlertCircle, Check, X,
  TrendingDown, Flame, Target
} from 'lucide-react';

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
      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'inherit', opacity: .6, padding: 4 }}>×</button>
    </div>
  );
};

const Recommendations = () => {
  const { t } = useLanguage();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    totalSavings: 0,
    highPriority: 0,
    categories: {}
  });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    return { userId };
  };

  const loadRecommendations = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.get(`/recommendations/user/${userId}`);
      setRecommendations(response.data || []);
      calculateStats(response.data || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      if (error.response?.status === 401) {
        showToast('error', 'Session expired. Please login again.');
      } else {
        showToast('error', 'Failed to load recommendations. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (recs) => {
    const totalSavings = recs.reduce((sum, r) => sum + (r.potentialSavings || 0), 0);
    const highPriority = recs.filter(r => r.priority === 'High').length;

    const categories = {};
    recs.forEach(r => {
      categories[r.category] = (categories[r.category] || 0) + 1;
    });

    setStats({ totalSavings, highPriority, categories });
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'var(--pill-danger-fg)';
      case 'Medium': return 'var(--pill-warn-fg)';
      case 'Low': return 'var(--pill-success-fg)';
      default: return 'var(--text-muted)';
    }
  };

  const getPriorityBg = (priority) => {
    switch (priority) {
      case 'High': return 'var(--pill-danger-bg)';
      case 'Medium': return 'var(--pill-warn-bg)';
      case 'Low': return 'var(--pill-success-bg)';
      default: return 'var(--pill-neutral-bg)';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'High': return t('common.high');
      case 'Medium': return t('common.medium');
      case 'Low': return t('common.low');
      default: return priority;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Transport': return <Car size={20} color="#22c55e" />;
      case 'Electricity': return <Zap size={20} color="#3b82f6" />;
      case 'Food': return <Utensils size={20} color="#f59e0b" />;
      case 'Shopping': return <ShoppingBag size={20} color="#8b5cf6" />;
      default: return <Leaf size={20} color="#64748b" />;
    }
  };

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'Transport': return t('activity.transport');
      case 'Electricity': return t('activity.electricity');
      case 'Food': return t('activity.food');
      case 'Shopping': return t('activity.shopping');
      case 'Lifestyle': return t('recommendations.lifestyle');
      default: return category;
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const priorityMatch = selectedPriority === 'all' || rec.priority === selectedPriority;
    const categoryMatch = selectedCategory === 'all' || rec.category === selectedCategory;
    return priorityMatch && categoryMatch;
  });

  const categories = ['all', 'Transport', 'Electricity', 'Food', 'Shopping', 'Lifestyle'];
  const priorities = ['all', 'High', 'Medium', 'Low'];

  if (loading) {
    return (
      <Layout userRole="user">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

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
              <div className="ui-hero__icon"><Lightbulb size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.aiRecommendations')}</h1>
                <p className="ui-hero__subtitle ui-hero__subtitle--compact">
                  {t('recommendations.title')} — {t('recommendations.personalized')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadRecommendations}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: summary cards --- */}
        <div className="ui-grid ui-grid--3" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><TrendingDown size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.totalSavings.toFixed(1)}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('recommendations.potentialSavings')}</div>
            <div className="ui-stat__hint">CO₂e {t('recommendations.ifImplemented')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #ef4444' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--red"><Flame size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.highPriority}</div>
            <div className="ui-stat__label">{t('recommendations.highPriority')}</div>
            <div className="ui-stat__hint">{t('recommendations.title')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Target size={20} /></div>
            </div>
            <div className="ui-stat__value">{Object.keys(stats.categories).length}</div>
            <div className="ui-stat__label">{t('recommendations.areasCovered')}</div>
            <div className="ui-stat__hint">{t('recommendations.areasCovered')}</div>
          </div>
        </div>

        {/* --- UI: filters --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>{t('recommendations.priority')}:</span>
              {priorities.map(p => (
                <button
                  key={p}
                  onClick={() => setSelectedPriority(p)}
                  className={`ui-btn ui-btn--sm ${selectedPriority === p ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
                  style={{ height: 30, textTransform: 'capitalize' }}
                >
                  {p === 'all' ? t('common.all') : getPriorityLabel(p)}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-body)' }}>{t('recommendations.category')}:</span>
              {categories.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`ui-btn ui-btn--sm ${selectedCategory === c ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
                  style={{ height: 30, textTransform: 'capitalize' }}
                >
                  {c === 'all' ? t('common.all') : getCategoryLabel(c)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- UI: recommendations grid --- */}
        {filteredRecommendations.length === 0 ? (
          <div className="ui-card">
            <div className="ui-state">
              <div className="ui-state__icon"><Lightbulb size={28} /></div>
              <p className="ui-state__title">{t('recommendations.none')}</p>
              <p className="ui-state__text">
                {recommendations.length === 0 ? t('recommendations.startLogging') : t('recommendations.adjustFilters')}
              </p>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: 20,
          }}>
            {filteredRecommendations.map((rec) => (
              /* --- UI: recommendation card — full category tint --- */
              <div
                key={rec.id}
                className="cat-card cat-card--rec"
                data-category={rec.category || 'default'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div
                    className="cat-card__icon"
                    style={{
                      width: 48, height: 48, borderRadius: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: 24,
                    }}
                  >
                    {rec.icon || '🌱'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: 0 }}>
                        {rec.title}
                      </h4>
                      <span style={{
                        padding: '2px 10px',
                        borderRadius: 12,
                        background: getPriorityBg(rec.priority),
                        color: getPriorityColor(rec.priority),
                        fontSize: 11,
                        fontWeight: 700,
                      }}>
                        {getPriorityLabel(rec.priority)}
                      </span>
                      {rec.category && (
                        <span style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 12,
                          background: 'var(--bg-subtle)',
                          color: 'var(--text-body)',
                          fontSize: 10, fontWeight: 600,
                        }}>
                          {getCategoryIcon(rec.category)}
                          {getCategoryLabel(rec.category)}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-body)', marginTop: 6, margin: '6px 0 0' }}>
                      {rec.description}
                    </p>
                    {rec.tip && (
                      <div className="cat-card__tip">
                        💡 {rec.tip}
                      </div>
                    )}
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {rec.potentialSavings && rec.potentialSavings > 0 && (
                        <span className="ui-pill ui-pill--success">
                          <TrendingDown size={12} />
                          {t('recommendations.save')} {rec.potentialSavings} kg CO₂e
                        </span>
                      )}
                      {rec.category && (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {getCategoryLabel(rec.category)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- UI: footer summary strip --- */}
        {recommendations.length > 0 && (
          <div className="ui-card ui-card--pad-sm" style={{
            marginTop: 24,
            padding: '16px 20px',
            background: 'var(--tint-1)',
            border: '1px solid var(--tint-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Leaf size={18} color="var(--green-600)" />
              <span style={{ fontSize: 14, color: 'var(--green-700)' }}>
                <strong>{filteredRecommendations.length}</strong> {t('recommendations.available')}
                {selectedPriority !== 'all' && ` (${getPriorityLabel(selectedPriority)} ${t('recommendations.priority')})`}
                {selectedCategory !== 'all' && ` in ${getCategoryLabel(selectedCategory)}`}
              </span>
            </div>
            <div style={{ fontSize: 14, color: 'var(--green-700)' }}>
              {t('recommendations.totalSavings')}: <strong>{stats.totalSavings.toFixed(1)} kg CO₂e</strong>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* ==========================================================
           CATEGORY-COLORED CARD — shared by Recommendations
           Uses data-category attribute for the color
           ========================================================== */
        .cat-card {
          position: relative;
          padding: 24px;
          border-radius: var(--radius-lg);
          margin-bottom: 0;
          background:
            linear-gradient(135deg,
              rgba(100,116,139,.10) 0%,
              rgba(100,116,139,.03) 100%),
            var(--bg-surface);
          border: 1px solid rgba(100,116,139,.25);
          border-left: 5px solid #64748b;
          box-shadow: 0 2px 4px rgba(0,0,0,.04);
          transition: transform .2s var(--ease-out),
                      box-shadow .2s var(--ease-out),
                      border-color .2s var(--ease),
                      background .2s var(--ease);
        }
        .cat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(100,116,139,.20);
        }

        /* Icon chip default */
        .cat-card__icon {
          background: rgba(100,116,139,.14);
        }
        .cat-card__tip {
          margin-top: 10px;
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(100,116,139,.08);
          border: 1px solid rgba(100,116,139,.20);
          font-size: 13px;
          color: var(--text-body);
        }

        /* ---------- Transport (green) ---------- */
        .cat-card[data-category="Transport"] {
          background:
            linear-gradient(135deg,
              rgba(34,197,94,.13) 0%,
              rgba(34,197,94,.04) 100%),
            var(--bg-surface);
          border-color: rgba(34,197,94,.30);
          border-left-color: #22c55e;
        }
        .cat-card[data-category="Transport"]:hover {
          border-color: rgba(34,197,94,.50);
          box-shadow: 0 12px 28px rgba(34,197,94,.22);
        }
        .cat-card[data-category="Transport"] .cat-card__icon {
          background: rgba(34,197,94,.18);
        }
        .cat-card[data-category="Transport"] .cat-card__tip {
          background: rgba(34,197,94,.10);
          border-color: rgba(34,197,94,.22);
          color: #15803d;
        }

        /* ---------- Electricity (blue) ---------- */
        .cat-card[data-category="Electricity"] {
          background:
            linear-gradient(135deg,
              rgba(59,130,246,.13) 0%,
              rgba(59,130,246,.04) 100%),
            var(--bg-surface);
          border-color: rgba(59,130,246,.30);
          border-left-color: #3b82f6;
        }
        .cat-card[data-category="Electricity"]:hover {
          border-color: rgba(59,130,246,.50);
          box-shadow: 0 12px 28px rgba(59,130,246,.22);
        }
        .cat-card[data-category="Electricity"] .cat-card__icon {
          background: rgba(59,130,246,.18);
        }
        .cat-card[data-category="Electricity"] .cat-card__tip {
          background: rgba(59,130,246,.10);
          border-color: rgba(59,130,246,.22);
          color: #1d4ed8;
        }

        /* ---------- Food (orange) ---------- */
        .cat-card[data-category="Food"] {
          background:
            linear-gradient(135deg,
              rgba(245,158,11,.15) 0%,
              rgba(245,158,11,.05) 100%),
            var(--bg-surface);
          border-color: rgba(245,158,11,.32);
          border-left-color: #f59e0b;
        }
        .cat-card[data-category="Food"]:hover {
          border-color: rgba(245,158,11,.52);
          box-shadow: 0 12px 28px rgba(245,158,11,.24);
        }
        .cat-card[data-category="Food"] .cat-card__icon {
          background: rgba(245,158,11,.20);
        }
        .cat-card[data-category="Food"] .cat-card__tip {
          background: rgba(245,158,11,.12);
          border-color: rgba(245,158,11,.24);
          color: #b45309;
        }

        /* ---------- Shopping (purple) ---------- */
        .cat-card[data-category="Shopping"] {
          background:
            linear-gradient(135deg,
              rgba(139,92,246,.13) 0%,
              rgba(139,92,246,.04) 100%),
            var(--bg-surface);
          border-color: rgba(139,92,246,.30);
          border-left-color: #8b5cf6;
        }
        .cat-card[data-category="Shopping"]:hover {
          border-color: rgba(139,92,246,.50);
          box-shadow: 0 12px 28px rgba(139,92,246,.22);
        }
        .cat-card[data-category="Shopping"] .cat-card__icon {
          background: rgba(139,92,246,.18);
        }
        .cat-card[data-category="Shopping"] .cat-card__tip {
          background: rgba(139,92,246,.10);
          border-color: rgba(139,92,246,.22);
          color: #6d28d9;
        }

        /* ---------- Lifestyle / default ---------- */
        .cat-card[data-category="Lifestyle"] {
          background:
            linear-gradient(135deg,
              rgba(20,184,166,.12) 0%,
              rgba(20,184,166,.04) 100%),
            var(--bg-surface);
          border-color: rgba(20,184,166,.30);
          border-left-color: #14b8a6;
        }
        .cat-card[data-category="Lifestyle"]:hover {
          border-color: rgba(20,184,166,.48);
          box-shadow: 0 12px 28px rgba(20,184,166,.22);
        }
        .cat-card[data-category="Lifestyle"] .cat-card__icon {
          background: rgba(20,184,166,.18);
        }
        .cat-card[data-category="Lifestyle"] .cat-card__tip {
          background: rgba(20,184,166,.10);
          border-color: rgba(20,184,166,.22);
          color: #0f766e;
        }

        /* Hero text */
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

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 1024px) {
          .ui-grid--3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
          .ui-grid--3 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default Recommendations;