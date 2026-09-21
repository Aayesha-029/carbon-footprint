import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  LayoutDashboard, Activity, TrendingUp, Target, Trophy, Leaf,
  Car, Zap, Utensils, ShoppingBag, Calendar, Award,
  BarChart3, PieChart, Flame, RefreshCw, AlertCircle,
  CheckCircle, XCircle
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { settings, loading: settingsLoading } = useSettings();
  const { t } = useLanguage();
  // Safe translate: falls back if key is missing
const safeT = (key, fallback) => {
  const val = t(key);
  return val === key ? fallback : val;
};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('User');
  const [stats, setStats] = useState({
    todayFootprint: 0,
    weeklyGoal: 0,
    monthlyTarget: 0,
    monthlyGoal: 100,
    carbonScore: 100,
    scoreLabel: 'Excellent',
    scoreEmoji: '🌟'
  });
  const [categoryData, setCategoryData] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  const isFeatureEnabled = (featureKey) => {
    if (!settings) return true;
    return settings[featureKey] !== false;
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, []);

  if (settings?.maintenanceMode) {
    return (
      <Layout userRole="user">
        <div className="ui-state">
          <div className="ui-state__icon" style={{ background: 'var(--pill-danger-bg)', color: 'var(--pill-danger-fg)', borderColor: 'rgba(239,68,68,.28)' }}>
            <AlertCircle size={32} />
          </div>
          <h1 className="ui-state__title">🔧 {t('dashboard.maintenanceTitle') || 'Maintenance Mode'}</h1>
          <p className="ui-state__text">
            {t('dashboard.maintenanceMessage') || 'The platform is currently under maintenance. Please check back later.'}
          </p>
        </div>
      </Layout>
    );
  }

  const loadDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const name = localStorage.getItem('userName') || 'User';
      setUserName(name);

      const userId = localStorage.getItem('userId');
      if (!userId) {
        setError('User not found. Please login again.');
        setLoading(false);
        return;
      }

      const response = await axiosClient.get(`/activities/user/${userId}`);
      const activities = response.data || [];

      processActivities(activities);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load dashboard data. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  const processActivities = (activities) => {
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = activities.filter(a => a.logDate === today);
    const todayTotal = todayActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekActivities = activities.filter(a => new Date(a.logDate) >= weekAgo);
    const weekTotal = weekActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

    const totalCO2 = activities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
    const weeklyGoal = totalCO2 > 0 ? Math.min(100, Math.round((weekTotal / (totalCO2 || 1)) * 100)) : 0;

    const monthStart = new Date();
    monthStart.setDate(1);
    const monthActivities = activities.filter(a => new Date(a.logDate) >= monthStart);
    const monthTotal = monthActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

    const carbonScore = activities.length > 0 ? Math.max(0, Math.min(100, Math.round(100 - (totalCO2 / (activities.length * 0.5))))) : 100;

    let scoreLabel;
    if (carbonScore >= 90) scoreLabel = t('dashboard.excellent');
    else if (carbonScore >= 70) scoreLabel = t('dashboard.good');
    else if (carbonScore >= 50) scoreLabel = t('dashboard.fair');
    else scoreLabel = t('dashboard.needsImprovement');

    const scoreEmoji = carbonScore >= 90 ? '🌟' : carbonScore >= 70 ? '⭐' : carbonScore >= 50 ? '💪' : '🌱';

    setStats({
      todayFootprint: Math.round(todayTotal * 100) / 100,
      weeklyGoal: weeklyGoal,
      monthlyTarget: Math.round(monthTotal * 100) / 100,
      monthlyGoal: 100,
      carbonScore: carbonScore,
      scoreLabel: scoreLabel,
      scoreEmoji: scoreEmoji
    });

    const categories = ['Transport', 'Electricity', 'Food', 'Shopping'];
    const categoryColors = {
      'Transport': '#22c55e',
      'Electricity': '#3b82f6',
      'Food': '#f59e0b',
      'Shopping': '#8b5cf6'
    };

    const catData = categories.map(cat => {
      const total = activities
        .filter(a => a.category === cat)
        .reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
      const totalCO2All = activities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
      const percentage = totalCO2All > 0 ? Math.round((total / totalCO2All) * 100) : 0;
      return {
        name: t(`activity.${cat.toLowerCase()}`),
        value: Math.round(total * 100) / 100,
        color: categoryColors[cat] || '#64748b',
        percentage: percentage,
        originalName: cat
      };
    });
    setCategoryData(catData);

    const recent = activities.slice(0, 5).map(a => ({
      id: a.id,
      category: t(`activity.${a.category?.toLowerCase() || ''}`),
      originalCategory: a.category,
      activityType: a.activityType,
      co2eKg: Math.round(parseFloat(a.co2eKg || 0) * 100) / 100,
      logDate: a.logDate
    }));
    setRecentActivities(recent);
  };

  const allQuickActions = [
    { icon: Activity, label: t('dashboard.logActivity'), path: '/activities', color: '#22c55e', feature: null },
    { icon: BarChart3, label: t('analytics.title'), path: '/analytics', color: '#3b82f6', feature: null },
    { icon: Target, label: t('dashboard.setGoal'), path: '/goals', color: '#f59e0b', feature: 'carbonGoalEnabled' },
    { icon: Trophy, label: t('nav.leaderboard'), path: '/leaderboard', color: '#8b5cf6', feature: 'leaderboardEnabled' },
  ];

  const quickActions = allQuickActions.filter(action => {
    if (!action.feature) return true;
    return isFeatureEnabled(action.feature);
  });

  const tips = [
    { icon: '🚗', tip: t('dashboard.usePublicTransport') },
    { icon: '💡', tip: t('dashboard.reduceElectricity') },
    { icon: '🌱', tip: t('dashboard.plantBasedMeals') },
    { icon: '🛍️', tip: t('dashboard.recycleWaste') },
  ];

  if (loading || settingsLoading) {
    return (
      <Layout userRole="user">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout userRole="user">
        <div className="ui-state ui-state--error">
          <div className="ui-state__icon"><AlertCircle size={32} /></div>
          <p className="ui-state__title">{error}</p>
          <div className="ui-state__actions">
            <button className="ui-btn ui-btn--primary" onClick={loadDashboardData}>
              <RefreshCw size={16} />
              {t('common.retry')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const totalCO2 = categoryData.reduce((sum, item) => sum + item.value, 0);
  const goalsEnabled = isFeatureEnabled('carbonGoalEnabled');
  const leaderboardEnabled = isFeatureEnabled('leaderboardEnabled');
  const badgesEnabled = isFeatureEnabled('badgesEnabled');

  return (
    <Layout userRole="user">
      <div className="ui-fade-in-up">

        {/* --- UI: XL dashboard hero — brand green, 3-tier hierarchy --- */}
        <div className="ui-hero ui-hero--xl ui-hero--brand ui-hero--dashboard" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__blob ui-hero__blob--3" />
          <div className="ui-hero__grid" />
          <span className="ui-hero__sparkle ui-hero__sparkle--a">✨</span>
          <span className="ui-hero__sparkle ui-hero__sparkle--b">✨</span>
          <span className="ui-hero__leaf">🍃</span>

          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon">
                <LayoutDashboard size={28} />
              </div>
              <div className="ui-hero__text">
                {/* --- UI: 1. module title (H1) --- */}
   <h1 className="ui-hero__title ui-hero__title--module">
  {t('bannerTitles.mainDashboard')}
</h1>
                {/* --- UI: 2. greeting line (bigger now) --- */}
                <p className="ui-hero__greeting ui-hero__greeting--lg">
                  {t('common.welcome')}, {userName} 👋
                </p>
                {/* --- UI: 3. description --- */}
                <p className="ui-hero__subtitle ui-hero__subtitle--compact">
                  {settings?.appDescription || t('dashboard.trackYourFootprint')}
                </p>
              </div>
            </div>

            <div className="ui-hero__actions">
              <button
                className="ui-btn ui-btn--hero"
                onClick={() => navigate('/activities')}
              >
                <Activity size={16} />
                {t('dashboard.logActivity')}
              </button>
              <button
                className="ui-btn ui-btn--hero-ghost"
                onClick={loadDashboardData}
              >
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>

          {/* --- UI: KPI chips inside hero --- */}
          <div className="ui-hero__kpis">
            <div className="ui-kpi">
              <div className="ui-kpi__icon">🔥</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{stats.todayFootprint} kg</div>
                <div className="ui-kpi__label">{t('dashboard.todayFootprint')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">🎯</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{stats.weeklyGoal}%</div>
                <div className="ui-kpi__label">{t('dashboard.weeklyGoal')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">📅</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{stats.monthlyTarget} kg</div>
                <div className="ui-kpi__label">{t('dashboard.monthlyTarget')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">{stats.scoreEmoji}</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{stats.carbonScore}</div>
                <div className="ui-kpi__label">{stats.scoreLabel}</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        <div className="ui-grid ui-grid--4" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Flame size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.todayFootprint} kg</div>
            <div className="ui-stat__label">{t('dashboard.todayFootprint')}</div>
          </div>

          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Target size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.weeklyGoal}%</div>
            <div className="ui-stat__label">{t('dashboard.weeklyGoal')}</div>
            <div style={{
              width: '100%', height: 6, background: 'var(--bg-subtle)',
              borderRadius: 9999, marginTop: 8, overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(stats.weeklyGoal, 100)}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #22c55e, #15803d)',
                borderRadius: 9999,
                transition: 'width .8s cubic-bezier(.4,0,.2,1)'
              }} />
            </div>
          </div>

          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Calendar size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.monthlyTarget}/{stats.monthlyGoal}<span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('dashboard.monthlyTarget')}</div>
          </div>

          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Award size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.carbonScore} <span style={{ fontSize: 20 }}>{stats.scoreEmoji}</span></div>
            <div className="ui-stat__label">{stats.scoreLabel}</div>
          </div>
        </div>

        {/* --- UI: quick actions --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(quickActions.length, 4)}, minmax(0, 1fr))`,
          gap: 12,
          marginBottom: 24,
        }}>
          {quickActions.map((item) => (
            <button
              key={item.label}
              className="ui-card ui-card--interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '16px 14px',
                borderLeft: `4px solid ${item.color}`,
                cursor: 'pointer',
                fontFamily: 'inherit',
                color: 'var(--text-strong)',
                fontSize: 14,
                fontWeight: 600,
              }}
              onClick={() => navigate(item.path)}
            >
              <item.icon size={18} color={item.color} />
              {item.label}
            </button>
          ))}
        </div>

        {/* --- UI: recent activities card --- */}
        <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 24 }}>
          <div className="ui-card__head">
            <div>
              <h3 className="ui-card__title">
                <Activity size={18} color="var(--green-600)" />
                {t('dashboard.recentActivities')}
              </h3>
              <p className="ui-card__subtitle">
                {recentActivities.length} {t('activity.totalActivities')}
              </p>
            </div>
            <div className="ui-card__actions">
              <button className="ui-btn ui-btn--secondary ui-btn--sm" onClick={() => navigate('/history')}>
                {t('common.viewAll')}
              </button>
            </div>
          </div>

          {recentActivities.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Leaf size={28} /></div>
              <p className="ui-state__title">{t('dashboard.noActivitiesYet')}</p>
              <div className="ui-state__actions">
                <button className="ui-btn ui-btn--primary" onClick={() => navigate('/activities')}>
                  <Activity size={16} />
                  {t('dashboard.logActivity')}
                </button>
              </div>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('common.category')}</th>
                    <th>{t('activity.activityType')}</th>
                    <th style={{ textAlign: 'right' }}>{t('activity.co2eKg')}</th>
                    <th>{t('common.date')}</th>
                  </tr>
                </thead>
                <tbody>
                 {recentActivities.map((item, index) => {
  const cat = item.originalCategory;
  const pillStyle =
    cat === 'Transport'   ? { background: 'rgba(34,197,94,.14)',  color: '#15803d', borderColor: 'rgba(34,197,94,.28)' } :
    cat === 'Electricity' ? { background: 'rgba(59,130,246,.14)', color: '#1d4ed8', borderColor: 'rgba(59,130,246,.28)' } :
    cat === 'Food'        ? { background: 'rgba(245,158,11,.14)', color: '#b45309', borderColor: 'rgba(245,158,11,.28)' } :
    cat === 'Shopping'    ? { background: 'rgba(139,92,246,.14)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,.28)' } :
    { background: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-fg)', borderColor: 'var(--border)' };
  return (
                      <tr key={index}>
                        <td>
                          <span className="ui-pill" style={pillStyle}>
  <span className="ui-pill__dot" />
  {item.category}
</span>
                        </td>
                        <td style={{ color: 'var(--text-strong)', fontWeight: 600 }}>
                          {item.activityType}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-700)' }}>
                          {item.co2eKg} kg
                        </td>
                        <td>{item.logDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* --- UI: sustainability tips --- */}
        <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 24 }}>
          <div className="ui-card__head">
            <h3 className="ui-card__title">
              <Leaf size={18} color="var(--green-600)" />
              {t('dashboard.sustainabilityTips')}
            </h3>
          </div>
          <div className="ui-grid ui-grid--auto">
            {tips.map((tip, index) => (
              <div key={index} style={{
                padding: '14px 16px',
                background: 'var(--tint-1)',
                borderRadius: 12,
                border: '1px solid var(--tint-border)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{ fontSize: 22 }}>{tip.icon}</span>
                <span style={{ fontSize: 14, color: 'var(--text-strong)', fontWeight: 500 }}>{tip.tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* --- UI: footer summary strip --- */}
        <div style={{
          padding: '14px 18px',
          background: 'var(--bg-surface)',
          borderRadius: 14,
          border: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <span className="ui-pill ui-pill--neutral">
            📊 {recentActivities.length} {t('dashboard.activitiesLogged')}
          </span>
          <span className="ui-pill ui-pill--success">
            🏆 {stats.carbonScore} {t('dashboard.carbonScore')}
          </span>
          <span className="ui-pill ui-pill--neutral">
            📅 {new Date().toLocaleDateString()}
          </span>
          <span className={`ui-pill ${goalsEnabled ? 'ui-pill--success' : 'ui-pill--danger'}`}>
            {goalsEnabled ? '✅' : '❌'} {t('nav.goals')}
          </span>
          <span className={`ui-pill ${leaderboardEnabled ? 'ui-pill--success' : 'ui-pill--danger'}`}>
            {leaderboardEnabled ? '✅' : '❌'} {t('nav.leaderboard')}
          </span>
          <span className={`ui-pill ${badgesEnabled ? 'ui-pill--success' : 'ui-pill--danger'}`}>
            {badgesEnabled ? '✅' : '❌'} {t('nav.badges')}
          </span>
        </div>

      </div>

      {/* --- UI: local layout CSS --- */}
      <style>{`
        /* ============ DASHBOARD HERO — 3-tier text hierarchy ============ */

        /* 1. Module title (H1) */
        .ui-hero--dashboard .ui-hero__title--module {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -0.9px;
          line-height: 1.1;
          color: #ffffff;
          margin: 0 0 6px;
          display: block;
        }

        /* 2. Greeting line (increased size) */
        .ui-hero--dashboard .ui-hero__greeting--lg {
          font-size: 22px;
          font-weight: 600;
          letter-spacing: -0.3px;
          line-height: 1.3;
          color: rgba(255, 255, 255, .96);
          margin: 0 0 4px;
        }

        /* 3. Subtitle / description */
        .ui-hero--dashboard .ui-hero__subtitle--compact {
          font-size: 14.5px;
          font-weight: 500;
          line-height: 1.5;
          color: rgba(255, 255, 255, .85);
          margin: 0;
          max-width: 62ch;
        }

        /* Hero icon chip */
        .ui-hero--dashboard .ui-hero__icon {
          width: 62px;
          height: 62px;
          flex-basis: 62px;
          border-radius: 18px;
          font-size: 26px;
        }

        @media (max-width: 720px) {
          .ui-hero--dashboard .ui-hero__title--module {
            font-size: 24px;
            letter-spacing: -0.5px;
          }
          .ui-hero--dashboard .ui-hero__greeting--lg {
            font-size: 17px;
          }
          .ui-hero--dashboard .ui-hero__subtitle--compact {
            font-size: 13.5px;
          }
          .ui-hero--dashboard .ui-hero__icon {
            width: 48px;
            height: 48px;
            flex-basis: 48px;
            border-radius: 14px;
            font-size: 22px;
          }
        }
      `}</style>
    </Layout>
  );
};

export default Dashboard;