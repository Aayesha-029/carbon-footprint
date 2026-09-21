import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import {
  Users, UserCheck, Activity, Flame, RefreshCw,
  Sparkles, Trophy, Crown, Medal, AlertCircle,
  TrendingUp, CheckCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const OrganizerDashboard = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [orgData, setOrgData] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [range, setRange] = useState('daily');
  const [orgId, setOrgId] = useState(null);

  const loadOrg = async () => {
    try {
      const res = await axiosClient.get('/organizations/me');
      setOrgData(res.data);
      setOrgId(res.data.id);
      return res.data.id;
    } catch (err) {
      console.error('Failed to load org:', err);
      setError(t('organizer.dashboard.failedToLoad'));
      return null;
    }
  };

  const loadDashboard = async (id, r) => {
    if (!id) return;
    try {
      setLoading(true);
      setError('');
      const res = await axiosClient.get(`/organizations/${id}/dashboard?range=${r}`);
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(t('organizer.dashboard.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const id = await loadOrg();
      if (id) await loadDashboard(id, range);
    })();
  }, []);

  useEffect(() => {
    if (orgId) loadDashboard(orgId, range);
  }, [range]);

  const handleRetry = async () => {
    const id = orgId || (await loadOrg());
    if (id) await loadDashboard(id, range);
  };

  if (loading && !dashboard) {
    return (
      <Layout userRole="organizer">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (error && !dashboard) {
    return (
      <Layout userRole="organizer">
        <div className="ui-state ui-state--error">
          <div className="ui-state__icon"><AlertCircle size={32} /></div>
          <p className="ui-state__title">{error}</p>
          <div className="ui-state__actions">
            <button className="ui-btn ui-btn--primary" onClick={handleRetry}>
              <RefreshCw size={16} />
              {t('organizer.dashboard.retry')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const totalMembers = dashboard?.totalMembers || 0;
  const activeMembers = dashboard?.activeMembers || 0;
  const todayActivities = dashboard?.todayActivities || 0;
  const todayCO2 = dashboard?.todayCO2 || 0;
  const totalCO2 = dashboard?.totalCO2 || 0;
  const categoryBreakdown = dashboard?.categoryBreakdown || {};
  const trendData = dashboard?.trendData || [];
  const topMembers = dashboard?.topMembers || [];
  const insights = dashboard?.insights || {};

  const CATEGORY_COLORS = {
    Transport: '#22c55e',
    Electricity: '#3b82f6',
    Food: '#f59e0b',
    Shopping: '#8b5cf6',
  };

  const pieData = Object.entries(categoryBreakdown)
    .filter(([_, v]) => parseFloat(v) > 0)
    .map(([name, value]) => ({ name, value: parseFloat(value) }));

  const getBadgeEmoji = (badgeType) => {
    if (!badgeType || badgeType === '—') return '';
    const map = {
      'FIRST_STEP': '🌱', 'COMMUTER': '🚗', 'ENERGY_SAVER': '💡',
      'FOOD_EXPLORER': '🍽️', 'SMART_SHOPPER': '🛍️', 'GREEN_WARRIOR': '🏅',
      'EARTH_HERO': '🌍', 'ECO_EXPERT': '⭐', 'DEDICATED': '📊', 'CARBON_MASTER': '🏆'
    };
    return map[badgeType] || '🏅';
  };

  const getBadgeName = (badgeType) => {
    if (!badgeType || badgeType === '—') return '—';
    const map = {
      'FIRST_STEP': 'Eco Hero', 'COMMUTER': 'Commuter', 'ENERGY_SAVER': 'Energy Saver',
      'FOOD_EXPLORER': 'Food Explorer', 'SMART_SHOPPER': 'Smart Shopper',
      'GREEN_WARRIOR': 'Green Warrior', 'EARTH_HERO': 'Earth Hero',
      'ECO_EXPERT': 'Eco Expert', 'DEDICATED': 'Dedicated', 'CARBON_MASTER': 'Carbon Master'
    };
    return map[badgeType] || badgeType;
  };

  return (
    <Layout userRole="organizer">
      <div className="ui-fade-in-up">

        {/* --- UI: brand hero with "Welcome, [Org Name]" heading --- */}
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
              <div className="ui-hero__icon"><Sparkles size={28} /></div>
              <div className="ui-hero__text">
                {/* --- UI: main heading — Welcome, [Org Name] --- */}
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('common.welcome')}, {orgData?.name || 'Organization'} 👋
                </h1>
                <p className="ui-hero__subtitle--compact">
                  {t('organizer.dashboard.overviewSubtitle', orgData?.name || 'your organization')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={handleRetry}>
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
                <div className="ui-kpi__value">{totalMembers}</div>
                <div className="ui-kpi__label">{t('organizer.dashboard.totalMembers')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">✅</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{activeMembers}</div>
                <div className="ui-kpi__label">{t('organizer.dashboard.activeMembers')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">📊</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{todayActivities}</div>
                <div className="ui-kpi__label">{t('organizer.dashboard.todayActivities')}</div>
              </div>
            </div>
            <div className="ui-kpi">
              <div className="ui-kpi__icon">🔥</div>
              <div className="ui-kpi__body">
                <div className="ui-kpi__value">{todayCO2} kg</div>
                <div className="ui-kpi__label">{t('organizer.dashboard.todayCO2')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        <div className="org-stats-grid" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Users size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalMembers}</div>
            <div className="ui-stat__label">{t('organizer.dashboard.totalMembers')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><UserCheck size={20} /></div>
            </div>
            <div className="ui-stat__value">{activeMembers}</div>
            <div className="ui-stat__label">{t('organizer.dashboard.activeMembers')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Activity size={20} /></div>
            </div>
            <div className="ui-stat__value">{todayActivities}</div>
            <div className="ui-stat__label">{t('organizer.dashboard.todayActivities')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Flame size={20} /></div>
            </div>
            <div className="ui-stat__value">{todayCO2}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('organizer.dashboard.todayCO2')}</div>
          </div>
        </div>

        {/* --- UI: pie + trend --- */}
        <div className="org-charts-grid" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">🌍 {t('organizer.dashboard.orgEmissions')}</h3>
            </div>
            {pieData.length === 0 ? (
              <div className="ui-state" style={{ padding: '40px 20px' }}>
                <div className="ui-state__icon"><Activity size={28} /></div>
                <p className="ui-state__text">{t('organizer.dashboard.noData')}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 160, height: 160, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {pieData.map((entry, idx) => (
                          <Cell key={idx} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v} kg`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  {pieData.map((entry) => (
                    <div key={entry.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: CATEGORY_COLORS[entry.name] || '#64748b' }} />
                        <span style={{ color: 'var(--text-body)', fontWeight: 600 }}>{entry.name}</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-strong)' }}>{entry.value.toFixed(2)} kg</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">📈 {t('organizer.dashboard.emissionTrend')}</h3>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="ui-select"
                style={{ width: 'auto', padding: '6px 12px', fontSize: 13 }}
              >
                <option value="daily">{t('organizer.dashboard.daily')}</option>
                <option value="weekly">{t('organizer.dashboard.weekly')}</option>
                <option value="monthly">{t('organizer.dashboard.monthly')}</option>
                <option value="yearly">{t('organizer.dashboard.yearly')}</option>
              </select>
            </div>
            <div style={{ height: 220 }}>
              {trendData.length === 0 ? (
                <div className="ui-state" style={{ padding: '20px' }}>
                  <p className="ui-state__text">{t('organizer.dashboard.noData')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }}
                      formatter={(v) => `${v} kg`}
                    />
                    <Line type="monotone" dataKey="totalCO2e" stroke="#22c55e" strokeWidth={2.5}
                      dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* --- UI: top members + insights --- */}
        <div className="org-bottom-grid">
          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <Trophy size={18} color="#f59e0b" />
                {t('organizer.dashboard.topMembers')}
              </h3>
            </div>
            {topMembers.length === 0 ? (
              <div className="ui-state" style={{ padding: '40px 20px' }}>
                <div className="ui-state__icon"><Activity size={28} /></div>
                <p className="ui-state__text">{t('organizer.dashboard.noData')}</p>
              </div>
            ) : (
              <div className="ui-table-wrap">
                <table className="ui-table">
                  <thead>
                    <tr>
                      <th>{t('organizer.dashboard.rank')}</th>
                      <th>{t('organizer.dashboard.member')}</th>
                      <th style={{ textAlign: 'right' }}>{t('organizer.dashboard.carbon')}</th>
                      <th style={{ textAlign: 'center' }}>{t('organizer.dashboard.badge')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topMembers.slice(0, 5).map((m, idx) => (
                      <tr key={m.userId}>
                        <td>
                          {idx === 0 ? <Crown size={16} color="#f59e0b" /> :
                           idx === 1 ? <Medal size={16} color="#94a3b8" /> :
                           idx === 2 ? <Medal size={16} color="#cd7f32" /> :
                           <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>{idx + 1}</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{
                              width: 28, height: 28, borderRadius: '50%',
                              background: 'rgba(34,197,94,.14)', color: 'var(--green-700)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 12, fontWeight: 700,
                            }}>
                              {(m.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-strong)' }}>{m.name}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 700, color: 'var(--green-700)', fontSize: 13 }}>{m.emission} kg</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {m.topBadge && m.topBadge !== '—' ? (
                            <span className="ui-pill ui-pill--success" style={{ fontSize: 11 }}>
                              {getBadgeEmoji(m.topBadge)} {getBadgeName(m.topBadge)}
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                <TrendingUp size={18} color="#3b82f6" />
                {t('organizer.dashboard.orgInsights')}
              </h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <InsightCard
                emoji="🌱"
                title={t('organizer.dashboard.bestPerformer')}
                value={insights.bestPerformerName || '—'}
                sub={`${insights.bestPerformerEmission || 0} kg CO₂`}
                bg="rgba(34,197,94,.08)"
                border="rgba(34,197,94,.28)"
                valueColor="#15803d"
              />
              <InsightCard
                emoji="🌍"
                title={t('organizer.dashboard.highestCategory')}
                value={insights.highestCategoryName || '—'}
                sub={`${insights.highestCategoryEmission || 0} kg CO₂`}
                bg="rgba(59,130,246,.08)"
                border="rgba(59,130,246,.28)"
                valueColor="#1d4ed8"
              />
              <InsightCard
                emoji="📊"
                title={t('organizer.dashboard.avgEmission')}
                value={`${insights.averageEmission || 0} kg CO₂`}
                sub={t('organizer.dashboard.acrossAllMembers')}
                bg="rgba(245,158,11,.08)"
                border="rgba(245,158,11,.28)"
                valueColor="#b45309"
              />
              <InsightCard
                emoji="🌿"
                title={t('organizer.dashboard.totalEmissions')}
                value={`${insights.totalEmission || 0} kg CO₂`}
                sub={t('organizer.dashboard.acrossAllCategories')}
                bg="rgba(139,92,246,.08)"
                border="rgba(139,92,246,.28)"
                valueColor="#8b5cf6"
              />
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .ui-hero__title--module { font-size: 30px; font-weight: 800; letter-spacing: -.8px; line-height: 1.15; color: #fff; margin: 0 0 6px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .org-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        .org-charts-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 20px; }
        .org-bottom-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }

        @media (max-width: 1024px) {
          .org-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .org-charts-grid, .org-bottom-grid { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .org-stats-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

// --- UI: reusable subcomponents ---
const InsightCard = ({ emoji, title, value, sub, bg, border, valueColor }) => (
  <div style={{
    padding: 14, background: bg, border: `1px solid ${border}`,
    borderRadius: 10,
  }}>
    <div style={{ fontSize: 18, marginBottom: 4 }}>{emoji}</div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 2 }}>{title}</div>
    <div style={{ fontSize: 15, fontWeight: 800, color: valueColor, marginBottom: 2 }}>{value}</div>
    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</div>
  </div>
);

export default OrganizerDashboard;