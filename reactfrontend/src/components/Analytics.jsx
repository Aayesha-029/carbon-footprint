import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  BarChart3, PieChart as PieChartIcon,
  TrendingUp, Calendar, Flame, Target, RefreshCw
} from 'lucide-react';

import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Analytics = () => {
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('weekly');
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    totalCO2: 0,
    totalActivities: 0,
    averagePerDay: 0,
    topCategory: 'N/A',
    carbonScore: 0
  });

  const COLORS = {
    Transport: '#22c55e',
    Electricity: '#3b82f6',
    Food: '#f59e0b',
    Shopping: '#8b5cf6'
  };

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    return { userId };
  };

  const loadActivities = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.get(`/activities/user/${userId}`);
      setActivities(response.data || []);
      processData(response.data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    if (activities.length > 0) {
      processData(activities);
    }
  }, [timeRange, activities]);

  const processData = (allActivities) => {
    const totalCO2 = allActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
    const totalActivities = allActivities.length;

    if (allActivities.length > 0) {
      const dates = allActivities.map(a => new Date(a.logDate));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      const daysDiff = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)));
      const avgPerDay = totalCO2 / daysDiff;
      setSummaryStats(prev => ({
        ...prev,
        totalCO2,
        totalActivities,
        averagePerDay: avgPerDay
      }));
    }

    const categories = ['Transport', 'Electricity', 'Food', 'Shopping'];
    const catData = categories.map(cat => {
      const total = allActivities
        .filter(a => a.category === cat)
        .reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
      return {
        name: t(`activity.${cat.toLowerCase()}`),
        value: Math.round(total * 100) / 100,
        color: COLORS[cat] || '#64748b',
        originalName: cat
      };
    });

    const topCat = catData.reduce((max, cat) => cat.value > max.value ? cat : max, { name: 'N/A', value: 0 });
    setSummaryStats(prev => ({ ...prev, topCategory: topCat.name }));
    setCategoryData(catData);

    let seriesData = [];
    const now = new Date();

    if (timeRange === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayActivities = allActivities.filter(a => a.logDate === dateStr);
        const total = dayActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        const catBreakdown = {};
        ['Transport', 'Electricity', 'Food', 'Shopping'].forEach(cat => {
          catBreakdown[t(`activity.${cat.toLowerCase()}`)] = dayActivities
            .filter(a => a.category === cat)
            .reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        });
        seriesData.push({
          name: date.toLocaleDateString('en-US', { weekday: 'short' }),
          total: Math.round(total * 100) / 100,
          ...catBreakdown
        });
      }
    } else if (timeRange === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        const weekActivities = allActivities.filter(a => {
          const d = new Date(a.logDate);
          return d >= weekStart && d <= weekEnd;
        });
        const total = weekActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        const catBreakdown = {};
        ['Transport', 'Electricity', 'Food', 'Shopping'].forEach(cat => {
          catBreakdown[t(`activity.${cat.toLowerCase()}`)] = weekActivities
            .filter(a => a.category === cat)
            .reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        });
        seriesData.push({
          name: `${t('analytics.weekly')} ${3 - i + 1}`,
          total: Math.round(total * 100) / 100,
          ...catBreakdown
        });
      }
    } else if (timeRange === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = month.toLocaleDateString('en-US', { month: 'short' });
        const monthActivities = allActivities.filter(a => {
          const d = new Date(a.logDate);
          return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
        });
        const total = monthActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        const catBreakdown = {};
        ['Transport', 'Electricity', 'Food', 'Shopping'].forEach(cat => {
          catBreakdown[t(`activity.${cat.toLowerCase()}`)] = monthActivities
            .filter(a => a.category === cat)
            .reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        });
        seriesData.push({
          name: monthStr,
          total: Math.round(total * 100) / 100,
          ...catBreakdown
        });
      }
    } else if (timeRange === 'yearly') {
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const yearActivities = allActivities.filter(a => {
          const d = new Date(a.logDate);
          return d.getFullYear() === year;
        });
        const total = yearActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        const catBreakdown = {};
        ['Transport', 'Electricity', 'Food', 'Shopping'].forEach(cat => {
          catBreakdown[t(`activity.${cat.toLowerCase()}`)] = yearActivities
            .filter(a => a.category === cat)
            .reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
        });
        seriesData.push({
          name: year.toString(),
          total: Math.round(total * 100) / 100,
          ...catBreakdown
        });
      }
    }

    setChartData(seriesData);
  };

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
          maxWidth: 280,
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
              .filter(([key, val]) => key !== 'name' && key !== 'total' && val > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, val]) => (
                <div key={cat} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontSize: 13, color: 'var(--text-body)',
                  padding: '3px 0',
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: 2,
                    background: COLORS[cat] || '#64748b'
                  }} />
                  <span style={{ flex: 1 }}>{cat}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>
                    {Math.round(val * 100) / 100} kg
                  </span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
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

  const totalCO2 = summaryStats.totalCO2 || 0;
  const totalActivities = summaryStats.totalActivities || 0;

  return (
    <Layout userRole="user">
      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><BarChart3 size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.carbonAnalytics')}</h1>
                <p className="ui-hero__subtitle ui-hero__subtitle--compact">
                  {t('analytics.description')} ({totalActivities} {t('activity.totalActivities')})
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadActivities}>
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
              <div className="ui-stat__icon ui-stat__icon--green"><Flame size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalCO2.toFixed(2)}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('analytics.totalCO2')}</div>
            <div className="ui-stat__hint">{t('activity.totalActivities')}: {totalActivities}</div>
          </div>

          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Calendar size={20} /></div>
            </div>
            <div className="ui-stat__value">
              {summaryStats.averagePerDay ? summaryStats.averagePerDay.toFixed(2) : '0.00'}
              <span style={{ fontSize: 14, marginLeft: 4 }}>kg</span>
            </div>
            <div className="ui-stat__label">{t('analytics.avgDaily')}</div>
            <div className="ui-stat__hint">{t('analytics.daily')}</div>
          </div>

          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Target size={20} /></div>
            </div>
            <div className="ui-stat__value" style={{ fontSize: 24 }}>{summaryStats.topCategory}</div>
            <div className="ui-stat__label">{t('analytics.topCategory')}</div>
            <div className="ui-stat__hint">{t('analytics.highestEmissions')}</div>
          </div>
        </div>

        {/* --- UI: pie + bar side-by-side --- */}
        <div className="ui-grid ui-grid--2" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <PieChartIcon size={18} color="var(--green-600)" />
                {t('analytics.breakdown')}
              </h3>
            </div>
            {categoryData.every(c => c.value === 0) ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                {t('analytics.noData')}
              </p>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={categoryData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
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
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {categoryData.map((item) => {
                    const total = categoryData.reduce((sum, d) => sum + d.value, 0);
                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                        <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color }} />
                        <span style={{ color: 'var(--text-body)', minWidth: 60 }}>{item.name}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{item.value} kg</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <BarChart3 size={18} color="var(--green-600)" />
                {t('analytics.comparison')}
              </h3>
            </div>
            {categoryData.every(c => c.value === 0) ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>
                {t('analytics.noData')}
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => `${value} kg`}
                    contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} className="ui-bar">
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* --- UI: main trend chart --- */}
        <div className="ui-card ui-card--pad-lg">
          <div className="ui-card__head">
            <h3 className="ui-card__title">
              <TrendingUp size={18} color="var(--green-600)" />
              {timeRange === 'daily' ? t('analytics.dailyTrend') :
               timeRange === 'weekly' ? t('analytics.weeklyTrend') :
               timeRange === 'monthly' ? t('analytics.monthlyTrend') : t('analytics.yearlyTrend')}
            </h3>
          </div>

          <div style={{
            display: 'flex', gap: 8,
            marginBottom: 16, flexWrap: 'wrap',
          }}>
            {['daily', 'weekly', 'monthly', 'yearly'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`ui-btn ui-btn--sm ${timeRange === range ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {range === 'daily' ? '📅 ' + t('analytics.daily') :
                 range === 'weekly' ? '📈 ' + t('analytics.weekly') :
                 range === 'monthly' ? '📊 ' + t('analytics.monthly') : '📆 ' + t('analytics.yearly')}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)', alignSelf: 'center' }}>
              {chartData.filter(d => d.total > 0).length} {t('analytics.periodsWithData')}
            </span>
          </div>

          {chartData.every(d => d.total === 0) ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
              {t('analytics.noDataPeriod')}
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData}>
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

      <style>{`
        /* --- UI: module hero title --- */
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

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
        }

        @media (max-width: 1024px) {
          .ui-grid--3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ui-grid--3, .ui-grid--2 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default Analytics;