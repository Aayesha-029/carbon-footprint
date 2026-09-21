import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Award, Lock, RefreshCw, Trophy, TrendingUp, Check, X, Sparkles
} from 'lucide-react';

// ============ Professional Popup Component ============
const BadgePopup = ({ popup, onClose }) => {
  useEffect(() => {
    if (popup.show) {
      const timer = setTimeout(onClose, popup.type === 'error' ? 6000 : 5000);
      return () => clearTimeout(timer);
    }
  }, [popup.show, popup.type, onClose]);

  if (!popup.show) return null;

  if (popup.type === 'celebrate') {
    return (
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          animation: 'fadeIn 0.25s ease',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: '440px',
            background: 'var(--bg-surface)', borderRadius: '20px',
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            animation: 'popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
          }}>
            <Trophy size={40} color="#d97706" />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: '8px',
            marginBottom: '12px', color: '#f59e0b',
          }}>
            <Sparkles size={16} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase' }}>
              Congratulations
            </span>
            <Sparkles size={16} />
          </div>

          <h2 style={{
            fontSize: '22px', fontWeight: 700, color: 'var(--text-strong)',
            margin: '0 0 8px 0',
          }}>
            {popup.title}
          </h2>

          <p style={{
            fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5,
            margin: '0 0 20px 0',
          }}>
            {popup.message}
          </p>

          {popup.badges && popup.badges.length > 0 && (
            <div style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
              gap: '8px', marginBottom: '24px',
            }}>
              {popup.badges.map((b, idx) => (
                <span key={idx} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  color: '#16a34a',
                  borderRadius: '20px', fontSize: '13px', fontWeight: 600,
                  border: '1px solid #86efac',
                }}>
                  <span style={{ fontSize: '16px' }}>{b.icon || '🏅'}</span>
                  {b.name}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(34,197,94,0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(34,197,94,0.35)';
            }}
          >
            Awesome!
          </button>
        </div>
      </div>
    );
  }

  const palette = popup.type === 'error'
    ? { bg: 'var(--pill-danger-bg)', border: 'rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)', icon: <X size={18} /> }
    : { bg: 'var(--pill-success-bg)', border: 'var(--tint-border)', color: 'var(--pill-success-fg)', icon: <Award size={18} /> };

  return (
    <div style={{
      position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
      minWidth: '320px', maxWidth: '460px',
      padding: '16px 20px',
      background: palette.bg,
      border: `1px solid ${palette.border}`,
      borderRadius: '12px',
      display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
      animation: 'slideInRight 0.35s ease',
    }}>
      <div style={{ color: palette.color, flexShrink: 0 }}>{palette.icon}</div>
      <span style={{ fontSize: '14px', fontWeight: 500, flex: 1, color: palette.color }}>
        {popup.message}
      </span>
      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: palette.color, opacity: 0.6, padding: '4px', fontSize: '18px',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
};

// ============ Main Badges Component ============
const Badges = () => {
  const { t } = useLanguage();
  const [badges, setBadges] = useState([]);
  const [progress, setProgress] = useState({ totalBadges: 0, earnedBadges: 0, badges: [] });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [userName, setUserName] = useState('User');
  const [popup, setPopup] = useState({ show: false, type: 'info', title: '', message: '', badges: [] });

  const showPopup = (type, message, extras = {}) => {
    setPopup({
      show: true,
      type,
      message,
      title: extras.title || '',
      badges: extras.badges || [],
    });
  };

  const hidePopup = () => {
    setPopup({ show: false, type: 'info', title: '', message: '', badges: [] });
  };

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    const name = localStorage.getItem('userName') || 'User';
    return { userId, name };
  };

  const loadBadges = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setBadges([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [badgesResponse, progressResponse] = await Promise.all([
        axiosClient.get(`/badges/user/${userId}`),
        axiosClient.get(`/badges/user/${userId}/progress`)
      ]);

      setBadges(badgesResponse.data || []);
      setProgress(progressResponse.data || { totalBadges: 0, earnedBadges: 0, badges: [] });
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkBadges = async () => {
    const { userId } = getCurrentUser();
    if (!userId) return;

    try {
      setChecking(true);
      const response = await axiosClient.post(`/badges/check/${userId}`);
      if (response.data.success && response.data.awarded.length > 0) {
        await loadBadges();

        const awardedBadges = response.data.awarded.map((b) => ({
          name: b.badgeName || b.badgeType,
          icon: b.badgeIcon || '🏅',
        }));

        showPopup('celebrate', '', {
          title: `You earned ${awardedBadges.length} new badge${awardedBadges.length > 1 ? 's' : ''}!`,
          badges: awardedBadges,
        });
      } else if (response.data.success) {
        showPopup('info', t('badges.noNewBadges') || 'You\'re all caught up! Keep logging activities to unlock more badges.');
      }
    } catch (error) {
      console.error('Error checking badges:', error);
      showPopup('error', t('badges.checkFailed') || 'Failed to check for new badges. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'User';
    setUserName(name);
    loadBadges();
  }, []);

  const earnedCount = progress.earnedBadges || 0;
  const totalCount = progress.totalBadges || 0;

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

  const badgeDefinitions = {
    'FIRST_STEP': { name: t('badges.firstStep'), icon: '🌱', description: t('badges.firstStepDesc') },
    'COMMUTER': { name: t('badges.commuter'), icon: '🚗', description: t('badges.commuterDesc') },
    'ENERGY_SAVER': { name: t('badges.energySaver'), icon: '💡', description: t('badges.energySaverDesc') },
    'FOOD_EXPLORER': { name: t('badges.foodExplorer'), icon: '🍽️', description: t('badges.foodExplorerDesc') },
    'SMART_SHOPPER': { name: t('badges.smartShopper'), icon: '🛍️', description: t('badges.smartShopperDesc') },
    'GREEN_WARRIOR': { name: t('badges.greenWarrior'), icon: '🏅', description: t('badges.greenWarriorDesc') },
    'EARTH_HERO': { name: t('badges.earthHero'), icon: '🌍', description: t('badges.earthHeroDesc') },
    'ECO_EXPERT': { name: t('badges.ecoExpert'), icon: '⭐', description: t('badges.ecoExpertDesc') },
    'DEDICATED': { name: t('badges.dedicatedTracker'), icon: '📊', description: t('badges.dedicatedTrackerDesc') },
    'CARBON_MASTER': { name: t('badges.carbonMaster'), icon: '🏆', description: t('badges.carbonMasterDesc') },
  };

  return (
    <Layout userRole="user">
      <BadgePopup popup={popup} onClose={hidePopup} />

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Award size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.badgesAchievements')}</h1>
                <p className="ui-hero__subtitle ui-hero__subtitle--compact">
                  {t('badges.description', earnedCount, totalCount)}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button
                className="ui-btn ui-btn--hero"
                onClick={checkBadges}
                disabled={checking}
              >
                {checking ? (
                  <>
                    <span className="ui-btn__spinner" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    {t('badges.checkNew')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: progress card --- */}
        <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <div>
              <h3 className="badges-progress-title">
                <Trophy size={20} color="var(--green-600)" />
                {t('badges.progress')}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                {t('badges.keepGoing')}
              </p>
            </div>
            <span className="badges-progress-count">
              {earnedCount} <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>/</span> {totalCount}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: 10,
            background: 'var(--bg-subtle)',
            borderRadius: 9999,
            overflow: 'hidden',
            marginTop: 14,
          }}>
            <div style={{
              width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #22c55e, #15803d)',
              borderRadius: 9999,
              transition: 'width .6s cubic-bezier(.4,0,.2,1)',
            }} />
          </div>
        </div>

        {/* --- UI: badges grid — borders & card colors unchanged --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
        }}>
          {progress.badges && progress.badges.length > 0 ? (
            progress.badges.map((badge) => {
              const earned = badge.earned;
              const progressPercent = badge.progress || 0;
              const def = badgeDefinitions[badge.type] || { name: badge.type, icon: '🏅', description: '' };

              return (
                <div
                  key={badge.type}
                  className="card badge-card"
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    opacity: earned ? 1 : 0.6,
                    border: earned ? '2px solid #22c55e' : '2px solid var(--border)',
                    background: earned ? 'var(--tint-1)' : 'var(--bg-surface)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {earned && (
                    <div style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#22c55e',
                      color: 'white',
                      padding: '2px 10px',
                      borderRadius: 12,
                      fontSize: 10,
                      fontWeight: 700,
                    }}>
                      ✓ {t('badges.earned')}
                    </div>
                  )}
                  <div className="badge-card__emoji">
                    {earned ? def.icon || '🏅' : '🔒'}
                  </div>
                  <h4 className="badge-card__name">
                    {def.name}
                  </h4>
                  <p className="badge-card__desc">
                    {def.description}
                  </p>
                  {!earned && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginBottom: 4,
                        fontWeight: 600,
                      }}>
                        <span>{t('badges.progressText')}</span>
                        <span>{progressPercent}%</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: 4,
                        background: 'var(--bg-subtle)',
                        borderRadius: 9999,
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          width: `${progressPercent}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #22c55e, #15803d)',
                          borderRadius: 9999,
                          transition: 'width .6s cubic-bezier(.4,0,.2,1)',
                        }} />
                      </div>
                    </div>
                  )}
                  {earned && badge.earnedAt && (
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, fontWeight: 500 }}>
                      {t('badges.earned')} {new Date(badge.earnedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40 }}>
              <p style={{ color: 'var(--text-muted)' }}>{t('badges.noData')}</p>
            </div>
          )}
        </div>
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

        /* Progress card typography */
        .badges-progress-title {
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: var(--text-strong);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .badges-progress-count {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -1px;
          color: var(--green-700);
          line-height: 1;
        }

        /* Badge card typography (borders & card colors untouched) */
        .badge-card__emoji {
          font-size: 52px;
          line-height: 1;
          margin-bottom: 14px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,.08));
        }
        .badge-card__name {
          font-size: 17px;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: var(--text-strong);
          margin: 0 0 6px;
        }
        .badge-card__desc {
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.5;
          color: var(--text-muted);
          margin: 0;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(.9); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
          .badges-progress-title { font-size: 18px; }
          .badges-progress-count { font-size: 24px; }
          .badge-card__emoji { font-size: 44px; }
        }
      `}</style>
    </Layout>
  );
};

export default Badges;