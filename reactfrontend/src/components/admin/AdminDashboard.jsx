import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  Users, Activity, Flame, Award, RefreshCw,
  BarChart3, TrendingUp, Calendar, Target,
  Shield, Building2, BadgeCheck, UserCheck,
  TrendingDown, Clock, Zap, Car, Utensils, ShoppingBag,
  AlertCircle
} from 'lucide-react';

const AdminDashboard = () => {
  const { settings } = useSettings();
  const { t } = useLanguage();
  const [adminName, setAdminName] = useState('Admin');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalCO2: 0,
    activeUsers: 0,
    totalBadges: 0,
    totalGoals: 0,
    completedGoals: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [categoryData, setCategoryData] = useState([
    { name: 'Transport', value: 0, color: '#22c55e' },
    { name: 'Electricity', value: 0, color: '#3b82f6' },
    { name: 'Food', value: 0, color: '#f59e0b' },
    { name: 'Shopping', value: 0, color: '#8b5cf6' },
  ]);
  const [topUsers, setTopUsers] = useState([]);
  const [weeklyTrend, setWeeklyTrend] = useState([]);

  if (settings.maintenanceMode) {
    return (
      <Layout userRole="admin">
        <div className="ui-state ui-state--error">
          <div className="ui-state__icon"><AlertCircle size={32} /></div>
          <h1 className="ui-state__title">🔧 {t('admin.settings.maintenanceMode')}</h1>
          <p className="ui-state__text">{t('admin.settings.maintenanceActive')}</p>
        </div>
      </Layout>
    );
  }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 5000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const usersResponse = await axiosClient.get('/auth/users');
      const users = usersResponse.data.users || [];

      let allActivities = [];
      let userStats = {};
      let totalBadges = 0;
      let totalGoals = 0;
      let completedGoals = 0;

      for (const user of users) {
        try {
          const activitiesResponse = await axiosClient.get(`/activities/user/${user.id}`);
          const userActivities = activitiesResponse.data || [];
          userActivities.forEach(act => {
            act.userName = user.fullName;
          });
          allActivities = [...allActivities, ...userActivities];

          userStats[user.id] = {
            name: user.fullName,
            activities: userActivities.length,
            co2e: userActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0),
          };
        } catch (e) {
          console.error(`❌ Failed to fetch activities for user ${user.id} (${user.email}):`, e.response?.status, e.response?.data);
          if (e.response?.status === 403) {
            showToast('error', `⚠️ Admin role missing! Cannot fetch activities for ${user.email}.`);
          }
        }

        try {
          const badgesResponse = await axiosClient.get(`/badges/user/${user.id}`);
          totalBadges += (badgesResponse.data || []).length;
        } catch (e) {
          console.error(`❌ Failed to fetch badges for user ${user.id}:`, e.response?.status);
        }

        try {
          const goalsResponse = await axiosClient.get(`/goals/user/${user.id}`);
          const userGoals = goalsResponse.data || [];
          totalGoals += userGoals.length;
          completedGoals += userGoals.filter(g => g.status === 'COMPLETED').length;
        } catch (e) {
          console.error(`❌ Failed to fetch goals for user ${user.id}:`, e.response?.status);
        }
      }

      const totalCO2 = allActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

      const categories = ['Transport', 'Electricity', 'Food', 'Shopping'];
      const categoryTotals = categories.map(cat => ({
        name: t(`activity.${cat.toLowerCase()}`),
        value: Math.round(allActivities.filter(a => a.category === cat).reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0) * 100) / 100,
        color: cat === 'Transport' ? '#22c55e' : cat === 'Electricity' ? '#3b82f6' : cat === 'Food' ? '#f59e0b' : '#8b5cf6'
      }));
      setCategoryData(categoryTotals);

      const sortedUsers = Object.values(userStats)
        .filter(u => u.activities > 0)
        .sort((a, b) => a.co2e - b.co2e)
        .slice(0, 5);
      setTopUsers(sortedUsers);

      const weekData = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayActivities = allActivities.filter(a => a.logDate === dateStr);
        const dayTotal = dayActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        weekData.push({
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          value: Math.round(dayTotal * 100) / 100,
        });
      }
      setWeeklyTrend(weekData);

      setStats({
        totalUsers: users.length,
        totalActivities: allActivities.length,
        totalCO2: Math.round(totalCO2 * 100) / 100,
        activeUsers: users.filter(u => u.enabled).length,
        totalBadges: totalBadges,
        totalGoals: totalGoals,
        completedGoals: completedGoals,
      });

      setRecentActivities(allActivities.slice(0, 10));
    } catch (error) {
      console.error('Error loading admin data:', error);
      showToast('error', 'Failed to load dashboard data');
    }
    setLoading(false);
  };

  useEffect(() => {
    const name = localStorage.getItem('userName') || 'Admin';
    setAdminName(name);
    loadData();
  }, []);

  const getCategoryColor = (category) => {
    const colors = {
      'Transport': '#22c55e',
      'Electricity': '#3b82f6',
      'Food': '#f59e0b',
      'Shopping': '#8b5cf6'
    };
    return colors[category] || '#64748b';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Transport': <Car size={14} />,
      'Electricity': <Zap size={14} />,
      'Food': <Utensils size={14} />,
      'Shopping': <ShoppingBag size={14} />
    };
    return icons[category] || <Activity size={14} />;
  };

  const getCategoryPillStyle = (category) => {
    switch (category) {
      case 'Transport':   return { background: 'rgba(34,197,94,.14)',  color: '#15803d', borderColor: 'rgba(34,197,94,.28)' };
      case 'Electricity': return { background: 'rgba(59,130,246,.14)', color: '#1d4ed8', borderColor: 'rgba(59,130,246,.28)' };
      case 'Food':        return { background: 'rgba(245,158,11,.14)', color: '#b45309', borderColor: 'rgba(245,158,11,.28)' };
      case 'Shopping':    return { background: 'rgba(139,92,246,.14)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,.28)' };
      default:            return { background: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-fg)', borderColor: 'var(--border)' };
    }
  };

  if (loading) {
    return (
      <Layout userRole="admin">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  const goalRate = stats.totalGoals > 0
    ? Math.round((stats.completedGoals / stats.totalGoals) * 100)
    : 0;

  return (
    <Layout userRole="admin">
      {toast.message && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 999,
          padding: '12px 20px', borderRadius: 10,
          background: toast.type === 'error' ? 'var(--pill-danger-bg)' : 'var(--pill-success-bg)',
          color: toast.type === 'error' ? 'var(--pill-danger-fg)' : 'var(--pill-success-fg)',
          border: `1px solid ${toast.type === 'error' ? 'rgba(239,68,68,.28)' : 'var(--tint-border)'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,.1)',
          fontSize: 14, maxWidth: 400, fontWeight: 600,
        }}>
          {toast.message}
          <button
            onClick={() => setToast({ type: '', message: '' })}
            style={{ marginLeft: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'inherit' }}
          >×</button>
        </div>
      )}

      <div className="ui-fade-in-up">

        {/* --- UI: XL admin hero --- */}
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
              <div className="ui-hero__icon"><Shield size={28} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('admin.dashboard.title')}
                </h1>
                <p className="ui-hero__greeting ui-hero__greeting--lg">
                  {t('common.welcome')}, {adminName} 👋
                </p>
                <p className="ui-hero__subtitle ui-hero__compact">
                  {settings.appDescription || 'Track your carbon footprint. Make a difference.'} · {stats.totalActivities} {t('activity.totalActivities')} · {stats.totalUsers} {t('admin.dashboard.totalUsers')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadData}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>

          {/* KPI chips inside hero */}
          <div className="ui-hero__kpis">
            <div className="ui-kpi">
              <div className="ui-kpi__icon">👥</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{stats.totalUsers}</div>
                <div className="ui-kpi__label">{t('admin.dashboard.totalUsers')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">📈</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{stats.totalActivities}</div>
                <div className="ui-kpi__label">{t('admin.dashboard.totalActivities')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">🔥</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{stats.totalCO2} kg</div>
                <div className="ui-kpi__label">{t('admin.dashboard.totalEmissions')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">🎯</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{goalRate}%</div>
                <div className="ui-kpi__label">{t('admin.dashboard.goalRate')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- UI: 5 stat cards --- */}
        <div className="admin-stats-grid" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Users size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.totalUsers}</div>
            <div className="ui-stat__label">{t('admin.dashboard.totalUsers')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Activity size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.totalActivities}</div>
            <div className="ui-stat__label">{t('admin.dashboard.totalActivities')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Flame size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.totalCO2}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('admin.dashboard.totalEmissions')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Award size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.totalBadges}</div>
            <div className="ui-stat__label">{t('admin.dashboard.totalBadges')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #ec4899' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Target size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.completedGoals}/{stats.totalGoals}</div>
            <div className="ui-stat__label">{t('nav.goals')}</div>
          </div>
        </div>

        {/* --- UI: Charts grid --- */}
        <div className="admin-charts-grid" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <BarChart3 size={18} color="var(--green-600)" />
                {t('admin.dashboard.emissionsByCategory')}
              </h3>
            </div>
            {categoryData.every(c => c.value === 0) ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: 15 }}>
                {t('admin.dashboard.noActivities')}
              </p>
            ) : (
              categoryData.map((item) => {
                const total = categoryData.reduce((sum, d) => sum + d.value, 0);
                const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6, color: 'var(--text-body)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}>
                        {getCategoryIcon(item.name)}
                        {item.name}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{item.value} kg ({percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'var(--bg-subtle)', borderRadius: 9999, overflow: 'hidden' }}>
                      <div className="ui-bar" style={{
                        width: `${percentage}%`,
                        height: '100%',
                        background: item.color,
                        borderRadius: 9999,
                        transition: 'width .6s cubic-bezier(.4,0,.2,1)'
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <TrendingUp size={18} color="var(--green-600)" />
                {t('admin.dashboard.weeklyTrend')}
              </h3>
            </div>
            {weeklyTrend.every(d => d.value === 0) ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: 15 }}>
                {t('admin.dashboard.noActivities')}
              </p>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 12, paddingBottom: 20 }}>
                {weeklyTrend.map((item, index) => {
                  const maxValue = Math.max(...weeklyTrend.map(d => d.value), 1);
                  const height = maxValue > 0 ? (item.value / maxValue) * 140 : 0;
                  const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b'];
                  return (
                    <div key={index} style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}>
                      <div className="ui-bar" style={{
                        width: '100%',
                        maxWidth: 40,
                        height: `${Math.max(height, 4)}px`,
                        background: `linear-gradient(180deg, ${colors[index % colors.length]}, ${colors[index % colors.length]}cc)`,
                        borderRadius: '6px 6px 0 0',
                        transition: 'height .6s cubic-bezier(.4,0,.2,1)',
                        position: 'relative',
                        cursor: 'pointer',
                      }}>
                        {item.value > 0 && (
                          <span style={{
                            position: 'absolute',
                            top: -20,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: 11,
                            fontWeight: 700,
                            color: 'var(--text-strong)',
                          }}>
                            {item.value}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* --- UI: Top users + Recent activities --- */}
        <div className="admin-charts-grid" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <UserCheck size={18} color="var(--green-600)" />
                {t('admin.dashboard.topEcoUsers')}
              </h3>
            </div>
            {topUsers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: 15 }}>
                {t('admin.dashboard.noUsers')}
              </p>
            ) : (
              topUsers.map((user, index) => (
                <div key={index} style={{
                  padding: '12px 0',
                  borderBottom: index < topUsers.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#cd7f32' : 'var(--bg-subtle)',
                      color: index < 3 ? 'white' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-strong)' }}>{user.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 700, color: 'var(--green-700)', fontSize: 15 }}>{user.co2e} kg</span>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                      ({user.activities} {t('activity.totalActivities')})
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <Clock size={18} color="var(--green-600)" />
                {t('admin.dashboard.recentActivities')}
              </h3>
            </div>
            {recentActivities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: 15 }}>
                {t('admin.dashboard.noActivities')}
              </p>
            ) : (
              recentActivities.slice(0, 6).map((act, idx) => (
                <div key={idx} style={{
                  padding: '10px 0',
                  borderBottom: idx < Math.min(recentActivities.length, 6) - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-strong)' }}>{act.userName}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 13, marginLeft: 8 }}>{act.activityType}</span>
                    <span className="ui-pill" style={{ ...getCategoryPillStyle(act.category), marginLeft: 8 }}>
                      <span className="ui-pill__dot" />
                      {t(`activity.${act.category?.toLowerCase() || ''}`) || act.category}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--green-700)', fontSize: 14, whiteSpace: 'nowrap' }}>
                    {parseFloat(act.co2eKg || 0).toFixed(2)} kg
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* --- UI: Summary footer --- */}
        <div className="ui-card ui-card--pad-lg" style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,.08), rgba(34,197,94,.16))',
          border: '1px solid var(--tint-border)',
        }}>
          <div className="admin-summary-grid">
            <div>
              <p className="ui-eyebrow">{t('admin.dashboard.summary')}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>
                {stats.totalUsers} {t('admin.dashboard.totalUsers')} • {stats.totalActivities} {t('activity.totalActivities')}
              </p>
            </div>
            <div>
              <p className="ui-eyebrow">{t('admin.dashboard.totalEmissions')}</p>
              <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--green-700)', margin: '4px 0 0' }}>
                {stats.totalCO2} kg CO₂e
              </p>
            </div>
            <div>
              <p className="ui-eyebrow">{t('admin.dashboard.activeUsers')}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>
                {stats.activeUsers} / {stats.totalUsers}
              </p>
            </div>
            <div>
              <p className="ui-eyebrow">{t('admin.dashboard.goalRate')}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>
                {goalRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__greeting--lg { font-size: 18px; font-weight: 600; letter-spacing: -.2px; line-height: 1.3; color: rgba(255,255,255,.95); margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.85); margin: 0; max-width: 62ch; }

        .admin-stats-grid {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 16px;
        }
        .admin-charts-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .admin-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
        }

        @media (max-width: 1200px) {
          .admin-stats-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 900px) {
          .admin-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .admin-charts-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__greeting--lg { font-size: 15px; }
          .admin-stats-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default AdminDashboard;