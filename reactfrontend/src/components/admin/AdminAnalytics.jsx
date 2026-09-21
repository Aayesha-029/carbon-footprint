import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  BarChart3, TrendingUp, Users, Activity,
  Flame, Award, Calendar, RefreshCw,
  Download, Filter, ChevronDown, ChevronUp,
  Check, X, AlertCircle
} from 'lucide-react';

import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

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
    error:   { background: 'var(--pill-danger-bg)',  border: '1px solid rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)',  icon: <X size={20} /> },
    info:    { background: 'var(--pill-info-bg)',    border: '1px solid rgba(59,130,246,.28)', color: 'var(--pill-info-fg)',   icon: <AlertCircle size={20} /> },
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '16px 24px', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.15)',
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 320, maxWidth: 500,
      animation: 'slideInRight .4s var(--ease-out)', ...style,
    }}>
      {style.icon}
      <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'inherit', opacity: .6, padding: 4 }}>×</button>
    </div>
  );
};

const AdminAnalytics = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('weekly');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalCO2: 0,
    activeUsers: 0,
    totalBadges: 0,
    avgCarbonScore: 0,
  });

  const [allActivities, setAllActivities] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [userGrowthData, setUserGrowthData] = useState([]);
  const [topCategories, setTopCategories] = useState([]);

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const COLORS = {
    Transport: '#22c55e',
    Electricity: '#3b82f6',
    Food: '#f59e0b',
    Shopping: '#8b5cf6'
  };

  const CATEGORY_ICONS = {
    Transport: '🚗',
    Electricity: '💡',
    Food: '🍽️',
    Shopping: '🛍️'
  };

  const getFilteredActivities = (activities, range) => {
    const now = new Date();
    let startDate;

    switch (range) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    return activities.filter(a => {
      const logDate = new Date(a.logDate);
      return logDate >= startDate && logDate <= now;
    });
  };

  const getFilteredUsers = (users, range) => {
    const now = new Date();
    let startDate;

    switch (range) {
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    return users.filter(u => {
      if (!u.createdAt) return true;
      const createdDate = new Date(u.createdAt);
      return createdDate >= startDate && createdDate <= now;
    });
  };

  const updateAllCharts = (activities, users, range) => {
    console.log('🔄 Updating charts for range:', range);
    console.log('📊 Total activities:', activities.length);

    const filteredActivities = getFilteredActivities(activities, range);
    const filteredUsers = getFilteredUsers(users, range);

    console.log('📊 Filtered activities:', filteredActivities.length);
    console.log('👥 Filtered users:', filteredUsers.length);

    const categories = ['Transport', 'Electricity', 'Food', 'Shopping'];

    const catData = categories.map(cat => {
      const total = filteredActivities
        .filter(a => a.category === cat)
        .reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
      return {
        name: t(`activity.${cat.toLowerCase()}`),
        value: Math.round(total * 100) / 100,
        color: COLORS[cat] || '#64748b',
        icon: CATEGORY_ICONS[cat] || '📊'
      };
    });
    setCategoryData(catData);

    const trend = generateTrendData(filteredActivities, range);
    setTrendData(trend);

    const growth = generateUserGrowthData(filteredUsers, range);
    setUserGrowthData(growth);

    const topCat = categories.map(cat => ({
      name: t(`activity.${cat.toLowerCase()}`),
      count: filteredActivities.filter(a => a.category === cat).length,
      color: COLORS[cat] || '#64748b',
      icon: CATEGORY_ICONS[cat] || '📊'
    }));
    setTopCategories(topCat);
  };

  const generateTrendData = (activities, range) => {
    const data = [];
    const now = new Date();
    let periods = 7;

    if (range === 'weekly') periods = 7;
    else if (range === 'monthly') periods = 6;
    else if (range === 'yearly') periods = 12;

    const categories = ['Transport', 'Electricity', 'Food', 'Shopping'];

    for (let i = periods - 1; i >= 0; i--) {
      let label, filterFn;

      if (range === 'weekly') {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        label = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toISOString().split('T')[0];
        filterFn = (a) => a.logDate === dateStr;
      } else if (range === 'monthly') {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        label = month.toLocaleDateString('en-US', { month: 'short' });
        filterFn = (a) => {
          const d = new Date(a.logDate);
          return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
        };
      } else {
        const year = now.getFullYear() - i;
        label = year.toString();
        filterFn = (a) => {
          const d = new Date(a.logDate);
          return d.getFullYear() === year;
        };
      }

      const periodActivities = activities.filter(filterFn);

      const total = periodActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

      const categoryBreakdown = {};
      categories.forEach(cat => {
        const catTotal = periodActivities
          .filter(a => a.category === cat)
          .reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        categoryBreakdown[cat] = Math.round(catTotal * 100) / 100;
      });

      data.push({
        name: label,
        total: Math.round(total * 100) / 100,
        ...categoryBreakdown,
        activities: periodActivities.length,
      });
    }

    return data;
  };

  const generateUserGrowthData = (users, range) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const data = [];

    let periods = 6;
    if (range === 'weekly') periods = 4;
    else if (range === 'monthly') periods = 6;
    else if (range === 'yearly') periods = 12;

    for (let i = periods - 1; i >= 0; i--) {
      let monthIndex, year, monthName;

      if (range === 'weekly') {
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() - (i * 7));
        monthName = weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const count = users.filter(u => {
          if (!u.createdAt) return false;
          const d = new Date(u.createdAt);
          return d >= weekDate && d < new Date(weekDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        }).length;

        data.push({ name: monthName, users: count });
      } else {
        monthIndex = (currentMonth - i + 12) % 12;
        year = currentYear - (currentMonth - i < 0 ? 1 : 0);
        monthName = months[monthIndex];

        const count = users.filter(u => {
          if (!u.createdAt) return false;
          const d = new Date(u.createdAt);
          return d.getMonth() === monthIndex && d.getFullYear() === year;
        }).length;

        data.push({ name: monthName, users: count });
      }
    }

    return data;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const usersResponse = await axiosClient.get('/auth/users');
      const usersList = usersResponse.data.users || [];
      setAllUsers(usersList);

      let allActivitiesList = [];

      for (const user of usersList) {
        try {
          const activitiesResponse = await axiosClient.get(`/activities/user/${user.id}`);
          const userActivities = activitiesResponse.data || [];
          allActivitiesList = [...allActivitiesList, ...userActivities];
        } catch (e) {
          // No activities
        }
      }
      setAllActivities(allActivitiesList);

      let totalBadges = 0;
      for (const user of usersList) {
        try {
          const badgesResponse = await axiosClient.get(`/badges/user/${user.id}`);
          totalBadges += (badgesResponse.data || []).length;
        } catch (e) {
          // No badges
        }
      }

      const totalCO2 = allActivitiesList.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
      const avgCarbonScore = usersList.length > 0 ? Math.round(100 - (totalCO2 / (allActivitiesList.length || 1))) : 0;

      setStats({
        totalUsers: usersList.length,
        totalActivities: allActivitiesList.length,
        totalCO2: Math.round(totalCO2 * 100) / 100,
        activeUsers: usersList.filter(u => u.enabled).length,
        totalBadges: totalBadges,
        avgCarbonScore: Math.max(0, Math.min(100, avgCarbonScore)),
      });

      updateAllCharts(allActivitiesList, usersList, timeRange);

    } catch (error) {
      console.error('Error loading data:', error);
      showToast('error', 'Failed to load analytics data');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (allActivities.length > 0 && allUsers.length > 0) {
      console.log('🔄 Time range changed to:', timeRange);
      updateAllCharts(allActivities, allUsers, timeRange);
    }
  }, [timeRange]);

  const timeRangeOptions = ['weekly', 'monthly', 'yearly'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload || {};
      const total = data.total || 0;
      return (
        <div style={{
          background: 'var(--bg-surface)',
          padding: '16px 20px',
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,.15)',
          border: '1px solid var(--border)',
          minWidth: 200,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            📊 {label}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-600)', marginBottom: 8 }}>
            {t('dashboard.totalCO2')}: {total} kg CO₂e
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
              {t('analytics.breakdown')}
            </div>
            {Object.entries(data)
              .filter(([key, val]) => key !== 'name' && key !== 'total' && key !== 'activities' && val > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, val]) => {
                const displayName = t(`activity.${cat.toLowerCase()}`);
                return (
                  <div key={cat} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 13, color: 'var(--text-body)', padding: '3px 0',
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[cat] || '#64748b' }} />
                    <span style={{ flex: 1 }}>{displayName}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{val} kg</span>
                  </div>
                );
              })}
          </div>
        </div>
      );
    }
    return null;
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

  return (
    <Layout userRole="admin">
      <Toast type={toast.type} message={toast.message} onClose={hideToast} />

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><BarChart3 size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.analytics.title')}</h1>
                <p className="ui-hero__subtitle--compact">
                  {stats.totalActivities} {t('activity.totalActivities')} • {stats.totalUsers} {t('admin.dashboard.totalUsers')} • {stats.totalCO2} kg CO₂e
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero-ghost" onClick={loadData}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
              <button className="ui-btn ui-btn--hero">
                <Download size={16} />
                {t('admin.reports.export')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        <div className="admin-analytics-stats" style={{ marginBottom: 24 }}>
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
            <div className="ui-stat__value">{stats.avgCarbonScore}</div>
            <div className="ui-stat__label">{t('admin.analytics.avgCarbonScore')}</div>
          </div>
        </div>

        {/* --- UI: time range pill tabs --- */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {timeRangeOptions.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`ui-btn ${timeRange === range ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {range === 'weekly' ? '📅 ' + t('analytics.weekly') :
               range === 'monthly' ? '📊 ' + t('analytics.monthly') : '📆 ' + t('analytics.yearly')}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>
            {categoryData.reduce((sum, d) => sum + d.value, 0).toFixed(2)} kg {t('dashboard.totalCO2')}
          </span>
        </div>

        {/* --- UI: charts grid --- */}
        <div className="admin-analytics-charts" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                {t('analytics.breakdown')} ({timeRange === 'weekly' ? t('analytics.weekly') : timeRange === 'monthly' ? t('analytics.monthly') : t('analytics.yearly')})
              </h3>
            </div>
            <div style={{ height: 280 }}>
              {categoryData.every(d => d.value === 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{t('analytics.noDataPeriod')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryData.filter(d => d.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `${value} kg`}
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                {t('analytics.emissionsTrend')} ({timeRange === 'weekly' ? t('analytics.weekly') : timeRange === 'monthly' ? t('analytics.monthly') : t('analytics.yearly')})
              </h3>
            </div>
            <div style={{ height: 280 }}>
              {trendData.every(d => d.total === 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{t('analytics.noDataPeriod')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey={t('activity.transport')} stackId="a" fill="#22c55e" name={t('activity.transport')} />
                    <Bar dataKey={t('activity.electricity')} stackId="a" fill="#3b82f6" name={t('activity.electricity')} />
                    <Bar dataKey={t('activity.food')} stackId="a" fill="#f59e0b" name={t('activity.food')} />
                    <Bar dataKey={t('activity.shopping')} stackId="a" fill="#8b5cf6" name={t('activity.shopping')} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* --- UI: growth + categories --- */}
        <div className="admin-analytics-charts" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                {t('admin.analytics.userGrowth')} ({timeRange === 'weekly' ? t('analytics.weekly') : timeRange === 'monthly' ? t('analytics.monthly') : t('analytics.yearly')})
              </h3>
            </div>
            <div style={{ height: 220 }}>
              {userGrowthData.every(d => d.users === 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{t('admin.analytics.noUserGrowth')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      stroke="#22c55e"
                      fill="rgba(34,197,94,.18)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                {t('admin.analytics.activityCategories')} ({timeRange === 'weekly' ? t('analytics.weekly') : timeRange === 'monthly' ? t('analytics.monthly') : t('analytics.yearly')})
              </h3>
            </div>
            <div style={{ height: 220 }}>
              {topCategories.every(d => d.count === 0) ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>{t('admin.analytics.noActivities')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCategories} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                    <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => `${value} ${t('activity.totalActivities')}`}
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {topCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* --- UI: key insights --- */}
        <div className="ui-card ui-card--pad-lg">
          <div className="ui-card__head">
            <h3 className="ui-card__title">{t('admin.analytics.keyInsights')}</h3>
          </div>
          <div className="admin-insights-grid">
            <div className="insight-tile insight-tile--green">
              <div className="insight-tile__icon">📈</div>
              <div className="insight-tile__title">{t('admin.analytics.userGrowth')}</div>
              <div className="insight-tile__value">
                {stats.totalUsers} {t('admin.dashboard.totalUsers')} • {stats.activeUsers} {t('admin.dashboard.activeUsers')}
              </div>
            </div>
            <div className="insight-tile insight-tile--blue">
              <div className="insight-tile__icon">🌍</div>
              <div className="insight-tile__title">{t('admin.analytics.co2Reduction')}</div>
              <div className="insight-tile__value">
                {stats.totalCO2} kg {t('admin.dashboard.totalEmissions')}
              </div>
            </div>
            <div className="insight-tile insight-tile--amber">
              <div className="insight-tile__icon">🏅</div>
              <div className="insight-tile__title">{t('admin.analytics.badgeEngagement')}</div>
              <div className="insight-tile__value">
                {stats.totalBadges} {t('admin.badges.badgesAwarded')}
              </div>
            </div>
            <div className="insight-tile insight-tile--purple">
              <div className="insight-tile__icon">⭐</div>
              <div className="insight-tile__title">{t('admin.analytics.carbonScore')}</div>
              <div className="insight-tile__value">
                {t('admin.analytics.averageScore')}: {stats.avgCarbonScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .admin-analytics-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        .admin-analytics-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .admin-insights-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }

        .insight-tile {
          padding: 16px;
          border-radius: 10px;
          border: 1px solid;
        }
        .insight-tile__icon { font-size: 28px; margin-bottom: 8px; }
        .insight-tile__title { font-size: 15px; font-weight: 700; color: var(--text-strong); margin-bottom: 4px; }
        .insight-tile__value { font-size: 14px; color: var(--text-muted); }

        .insight-tile--green  { background: rgba(34,197,94,.08);  border-color: rgba(34,197,94,.28); }
        .insight-tile--blue   { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.28); }
        .insight-tile--amber  { background: rgba(245,158,11,.08); border-color: rgba(245,158,11,.28); }
        .insight-tile--purple { background: rgba(139,92,246,.08); border-color: rgba(139,92,246,.28); }

        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }

        @media (max-width: 1024px) {
          .admin-analytics-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .admin-analytics-charts { grid-template-columns: 1fr; }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .admin-analytics-stats { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default AdminAnalytics;