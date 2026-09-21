import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import { Activity, Search, RefreshCw, Flame, X } from 'lucide-react';

const CATEGORY_COLORS = {
  Transport: '#22c55e', Electricity: '#3b82f6', Food: '#f59e0b', Shopping: '#8b5cf6',
};

const OrganizerActivities = () => {
  const { t } = useLanguage();
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [data, setData] = useState({ activities: [], totalActivities: 0, totalEmission: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = async (id) => {
    try {
      setLoading(true);
      const p = new URLSearchParams();
      if (search) p.append('search', search);
      if (category !== 'all') p.append('category', category);
      if (startDate) p.append('startDate', startDate);
      if (endDate) p.append('endDate', endDate);
      const res = await axiosClient.get(`/organizations/${id}/activities?${p}`);
      setData(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      const res = await axiosClient.get('/organizations/me');
      setOrgId(res.data.id);
      setOrgName(res.data.name);
      load(res.data.id);
    })();
  }, []);

  useEffect(() => { if (orgId) load(orgId); }, [search, category, startDate, endDate]);

  const clearFilters = () => { setSearch(''); setCategory('all'); setStartDate(''); setEndDate(''); };

  const getCategoryPillStyle = (cat) => {
    switch (cat) {
      case 'Transport':   return { background: 'rgba(34,197,94,.14)',  color: '#15803d', borderColor: 'rgba(34,197,94,.28)' };
      case 'Electricity': return { background: 'rgba(59,130,246,.14)', color: '#1d4ed8', borderColor: 'rgba(59,130,246,.28)' };
      case 'Food':        return { background: 'rgba(245,158,11,.14)', color: '#b45309', borderColor: 'rgba(245,158,11,.28)' };
      case 'Shopping':    return { background: 'rgba(139,92,246,.14)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,.28)' };
      default:            return { background: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-fg)', borderColor: 'var(--border)' };
    }
  };

  return (
    <Layout userRole="organizer">
      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Activity size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('organizer.activityPage.title')}
                </h1>
                <p className="ui-hero__subtitle--compact">
                  {t('organizer.activityPage.subtitle', orgName)}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={() => load(orgId)}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        <div className="org-grid-2" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Activity size={20} /></div>
            </div>
            <div className="ui-stat__value">{data.totalActivities}</div>
            <div className="ui-stat__label">{t('organizer.activityPage.activities')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Flame size={20} /></div>
            </div>
            <div className="ui-stat__value">{Number(data.totalEmission).toFixed(2)}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('organizer.activityPage.totalEmission')}</div>
          </div>
        </div>

        {/* --- UI: filters --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('organizer.activityPage.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ui-input"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="ui-select"
              >
                <option value="all">{t('organizer.activityPage.allCategories')}</option>
                <option value="Transport">Transport</option>
                <option value="Electricity">Electricity</option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
              </select>
            </div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="ui-input"
              style={{ width: 'auto' }}
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="ui-input"
              style={{ width: 'auto' }}
            />
            {(search || category !== 'all' || startDate || endDate) && (
              <button onClick={clearFilters} className="ui-btn ui-btn--danger ui-btn--sm">
                <X size={14} />
                {t('organizer.activityPage.clear')}
              </button>
            )}
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {loading ? (
            <div className="ui-state">
              <div className="ui-spinner" />
              <p className="ui-state__text">{t('common.loading')}</p>
            </div>
          ) : data.activities.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Activity size={28} /></div>
              <p className="ui-state__title">{t('organizer.activityPage.noActivities')}</p>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('organizer.activityPage.member')}</th>
                    <th>{t('organizer.activityPage.activity')}</th>
                    <th>{t('organizer.activityPage.category')}</th>
                    <th style={{ textAlign: 'right' }}>{t('organizer.activityPage.quantity')}</th>
                    <th style={{ textAlign: 'right' }}>{t('organizer.activityPage.emission')}</th>
                    <th>{t('organizer.activityPage.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.activities.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: 'rgba(34,197,94,.14)', color: 'var(--green-700)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 700,
                          }}>
                            {(a.memberName || '?').charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{a.memberName}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{a.activityType}</td>
                      <td>
                        <span className="ui-pill" style={getCategoryPillStyle(a.category)}>
                          <span className="ui-pill__dot" />
                          {a.category}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{a.quantity} {a.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-700)' }}>
                        {Number(a.co2eKg).toFixed(2)} kg
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{a.logDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .org-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .org-grid-2 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default OrganizerActivities;