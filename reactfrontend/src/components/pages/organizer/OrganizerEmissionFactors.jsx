import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import { BarChart3, Search, RefreshCw, Lock } from 'lucide-react';

const CATEGORY_COLORS = {
  Transport: '#22c55e', Electricity: '#3b82f6', Food: '#f59e0b', Shopping: '#8b5cf6',
};

const OrganizerEmissionFactors = () => {
  const { t } = useLanguage();
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/emission-factors');
      setFactors(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filtered = factors.filter(f => {
    const matchSearch = !search ||
      (f.activityType || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || f.category === category;
    return matchSearch && matchCat;
  });

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
              <div className="ui-hero__icon"><BarChart3 size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('organizer.emissionPage.title')}
                </h1>
                <p className="ui-hero__subtitle--compact">
                  <Lock size={12} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  {t('organizer.emissionPage.subtitle')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={load}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: filters --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('organizer.emissionPage.searchPlaceholder')}
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
                <option value="all">{t('organizer.emissionPage.allCategories')}</option>
                <option value="Transport">Transport</option>
                <option value="Electricity">Electricity</option>
                <option value="Food">Food</option>
                <option value="Shopping">Shopping</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {loading ? (
            <div className="ui-state">
              <div className="ui-spinner" />
              <p className="ui-state__text">{t('common.loading')}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><BarChart3 size={28} /></div>
              <p className="ui-state__title">{t('organizer.emissionPage.noData')}</p>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('organizer.emissionPage.category')}</th>
                    <th>{t('organizer.emissionPage.activity')}</th>
                    <th>{t('organizer.emissionPage.unit')}</th>
                    <th style={{ textAlign: 'right' }}>{t('organizer.emissionPage.factor')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <span className="ui-pill" style={getCategoryPillStyle(f.category)}>
                          <span className="ui-pill__dot" />
                          {f.category}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{f.activityType}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{f.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-700)' }}>
                        {f.factorKgCo2ePerUnit}
                      </td>
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

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
        }
      `}</style>
    </Layout>
  );
};

export default OrganizerEmissionFactors;