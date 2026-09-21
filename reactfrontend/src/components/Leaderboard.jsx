import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Trophy, Users, Award, Flame, Target, RefreshCw, Medal,
  TrendingUp, BarChart3, Leaf, Crown, Star, Zap,
  Car, Utensils, ShoppingBag, Award as AwardIcon,
  CheckCircle, TrendingDown
} from 'lucide-react';

const Leaderboard = () => {
  const { t } = useLanguage();
  const [entries, setEntries] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');
  const [userId, setUserId] = useState(null);

  const getCurrentUser = () => {
    const id = localStorage.getItem('userId');
    setUserId(id);
    return id;
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const [leaderboardRes, rankRes] = await Promise.all([
        axiosClient.get(`/leaderboard?timeRange=${timeRange}`),
        userId ? axiosClient.get(`/leaderboard/user/${userId}`) : Promise.resolve({ data: null })
      ]);

      setEntries(leaderboardRes.data || []);
      if (rankRes.data) {
        setUserRank(rankRes.data);
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (userId) {
      loadLeaderboard();
    }
  }, [timeRange, userId]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Crown size={20} color="#f59e0b" />;
      case 2: return <Medal size={20} color="#94a3b8" />;
      case 3: return <Medal size={20} color="#cd7f32" />;
      default: return <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>#{rank}</span>;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Transport': return <Car size={16} color="#22c55e" />;
      case 'Electricity': return <Zap size={16} color="#3b82f6" />;
      case 'Food': return <Utensils size={16} color="#f59e0b" />;
      case 'Shopping': return <ShoppingBag size={16} color="#8b5cf6" />;
      default: return <Leaf size={16} color="#64748b" />;
    }
  };

  const getBadgeIcon = (badgeType) => {
    const badges = {
      'FIRST_STEP': <Leaf size={14} color="#22c55e" />,
      'COMMUTER': <Car size={14} color="#22c55e" />,
      'ENERGY_SAVER': <Zap size={14} color="#3b82f6" />,
      'FOOD_EXPLORER': <Utensils size={14} color="#f59e0b" />,
      'SMART_SHOPPER': <ShoppingBag size={14} color="#8b5cf6" />,
      'GREEN_WARRIOR': <AwardIcon size={14} color="#22c55e" />,
      'EARTH_HERO': <Trophy size={14} color="#15803d" />,
      'ECO_EXPERT': <Star size={14} color="#3b82f6" />,
      'DEDICATED': <Target size={14} color="#f59e0b" />,
      'CARBON_MASTER': <Crown size={14} color="#8b5cf6" />
    };
    return badges[badgeType] || <AwardIcon size={14} color="#64748b" />;
  };

  const getBadgeColor = (badgeType) => {
    const colors = {
      'FIRST_STEP': '#22c55e',
      'COMMUTER': '#22c55e',
      'ENERGY_SAVER': '#3b82f6',
      'FOOD_EXPLORER': '#f59e0b',
      'SMART_SHOPPER': '#8b5cf6',
      'GREEN_WARRIOR': '#22c55e',
      'EARTH_HERO': '#15803d',
      'ECO_EXPERT': '#3b82f6',
      'DEDICATED': '#f59e0b',
      'CARBON_MASTER': '#8b5cf6'
    };
    return colors[badgeType] || '#64748b';
  };

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
      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Trophy size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.communityLeaderboard')}</h1>
                <p className="ui-hero__subtitle ui-hero__subtitle--compact">
                  {t('leaderboard.description')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadLeaderboard}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: your ranking card --- */}
        {userRank && userRank.userEntry && (
          <div className="ui-card ui-card--pad-lg" style={{
            marginBottom: 24,
            borderLeft: '4px solid var(--green-600)',
            background: 'linear-gradient(135deg, rgba(34,197,94,.08), rgba(34,197,94,.16))',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Medal size={20} color="var(--green-600)" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)' }}>
                    {t('leaderboard.yourRanking')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-700)' }}>
                    #{userRank.rank} <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>{t('common.of')} {userRank.totalUsers}</span>
                  </span>
                  <span className="ui-pill ui-pill--success">
                    {t('leaderboard.topUsers')} {userRank.percentile}%
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)' }}>
                  {userRank.userEntry.totalCO2e} kg CO₂e
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {userRank.userEntry.activityCount} {t('activity.totalActivities')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- UI: time range tabs --- */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', 'weekly', 'monthly', 'yearly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`ui-btn ui-btn--sm ${timeRange === range ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {range === 'all' ? t('common.all') :
               range === 'weekly' ? '📅 ' + t('analytics.weekly') :
               range === 'monthly' ? '📊 ' + t('analytics.monthly') : '📆 ' + t('analytics.yearly')}
            </button>
          ))}
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {entries.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Users size={28} /></div>
              <p className="ui-state__title">{t('leaderboard.noUsers')}</p>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('leaderboard.rank')}</th>
                    <th>{t('leaderboard.user')}</th>
                    <th>{t('leaderboard.badges')}</th>
                    <th>{t('leaderboard.topCategory')}</th>
                    <th style={{ textAlign: 'right' }}>{t('leaderboard.totalCO2')}</th>
                    <th style={{ textAlign: 'right' }}>{t('leaderboard.activities')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const isCurrentUser = entry.userId === parseInt(userId);
                    return (
                      <tr
                        key={entry.userId}
                        style={{
                          background: isCurrentUser ? 'var(--tint-1)' : 'transparent',
                          fontWeight: isCurrentUser ? 600 : 400,
                        }}
                      >
                        <td style={{ fontWeight: 700 }}>{getRankIcon(entry.rank)}</td>
                        <td style={{ fontWeight: isCurrentUser ? 700 : 500, color: 'var(--text-strong)' }}>
                          {entry.userName}
                          {isCurrentUser && (
                            <span style={{
                              marginLeft: 8, padding: '2px 8px',
                              background: 'var(--green-600)', color: 'white',
                              borderRadius: 12, fontSize: 10, fontWeight: 700,
                            }}>
                              {t('leaderboard.user')}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {entry.badges && entry.badges.slice(0, 5).map((badge, index) => (
                              <span
                                key={index}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 24, height: 24,
                                  borderRadius: '50%',
                                  background: `${getBadgeColor(badge)}20`,
                                  color: getBadgeColor(badge),
                                  fontSize: 12,
                                  cursor: 'help',
                                }}
                                title={badge.replace(/_/g, ' ')}
                              >
                                {getBadgeIcon(badge)}
                              </span>
                            ))}
                            {entry.badges && entry.badges.length > 5 && (
                              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                +{entry.badges.length - 5}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="ui-pill ui-pill--neutral">
                            {getCategoryIcon(entry.topCategory)} {getCategoryLabel(entry.topCategory)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-700)' }}>
                          {entry.totalCO2e} kg
                        </td>
                        <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                          {entry.activityCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- UI: top performers tips --- */}
        {entries.length > 0 && (
          <div className="ui-card ui-card--pad-lg" style={{ marginTop: 24 }}>
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <TrendingDown size={18} color="var(--green-600)" />
                {t('leaderboard.tips')}
              </h3>
            </div>
            <div className="ui-grid ui-grid--3">
              {entries.slice(0, 3).map((entry) => (
                <div key={entry.userId} style={{
                  padding: 16,
                  background: 'var(--bg-subtle)',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {entry.rank === 1 ? <Crown size={20} color="#f59e0b" /> :
                     entry.rank === 2 ? <Medal size={20} color="#94a3b8" /> :
                     entry.rank === 3 ? <Medal size={20} color="#cd7f32" /> :
                     <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)' }}>#{entry.rank}</span>}
                    <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{entry.userName}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {getCategoryIcon(entry.topCategory)} {t('leaderboard.topCategory')}: {getCategoryLabel(entry.topCategory)}
                    </div>
                    <div>• {entry.activityCount} {t('leaderboard.activitiesLogged')}</div>
                    <div>• {entry.totalCO2e} kg CO₂e {t('dashboard.totalCO2')}</div>
                    <div>• {entry.badges ? entry.badges.length : 0} {t('leaderboard.badgesEarned')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

// Helper function for category label
const getCategoryLabel = (category) => {
  // This will be replaced by the actual t() function in the component
  return category;
};

export default Leaderboard;