import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import { Award, RefreshCw, Users } from 'lucide-react';

const BADGE_META = {
  FIRST_STEP:   { icon: '🌱', name: 'First Step',        color: '#22c55e' },
  COMMUTER:     { icon: '🚗', name: 'Commuter',          color: '#22c55e' },
  ENERGY_SAVER: { icon: '💡', name: 'Energy Saver',      color: '#3b82f6' },
  FOOD_EXPLORER:{ icon: '🍽️', name: 'Food Explorer',     color: '#f59e0b' },
  SMART_SHOPPER:{ icon: '🛍️', name: 'Smart Shopper',     color: '#8b5cf6' },
  GREEN_WARRIOR:{ icon: '🏅', name: 'Green Warrior',     color: '#22c55e' },
  EARTH_HERO:   { icon: '🌍', name: 'Earth Hero',        color: '#15803d' },
  ECO_EXPERT:   { icon: '⭐', name: 'Eco Expert',        color: '#3b82f6' },
  DEDICATED:    { icon: '📊', name: 'Dedicated Tracker', color: '#f59e0b' },
  CARBON_MASTER:{ icon: '🏆', name: 'Carbon Master',     color: '#8b5cf6' },
};

const OrganizerBadges = () => {
  const { t } = useLanguage();
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [data, setData] = useState({ total: 0, members: [] });
  const [loading, setLoading] = useState(true);

  const load = async (id) => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/organizations/${id}/badges`);
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

  const uniqueUsers = new Set(data.members.filter(m => m.badgeCount > 0).map(m => m.userId)).size;

  return (
    <Layout userRole="organizer">
      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Award size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('organizer.badgesPage.title')}
                </h1>
                <p className="ui-hero__subtitle--compact">
                  {t('organizer.badgesPage.subtitle', orgName, data.total)}
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
        <div className="org-grid-3" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Award size={20} /></div>
            </div>
            <div className="ui-stat__value">{data.total}</div>
            <div className="ui-stat__label">{t('organizer.badgesPage.earned')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Users size={20} /></div>
            </div>
            <div className="ui-stat__value">{data.members.length}</div>
            <div className="ui-stat__label">{t('organizer.badges.badge') || 'Members'}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Award size={20} /></div>
            </div>
            <div className="ui-stat__value">{uniqueUsers}</div>
            <div className="ui-stat__label">Members with badges</div>
          </div>
        </div>

        {loading ? (
          <div className="ui-state">
            <div className="ui-spinner" />
            <p className="ui-state__text">{t('common.loading')}</p>
          </div>
        ) : data.members.length === 0 ? (
          <div className="ui-card">
            <div className="ui-state">
              <div className="ui-state__icon"><Award size={28} /></div>
              <p className="ui-state__title">{t('organizer.badgesPage.noBadges')}</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {data.members.map((m) => (
              <div key={m.userId} className="ui-card ui-card--pad-lg">
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flexWrap: 'wrap', gap: 12,
                  marginBottom: m.badges.length > 0 ? 14 : 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      color: 'white', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 700, fontSize: 15,
                    }}>
                      {(m.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 14 }}>{m.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
                    </div>
                  </div>
                  <span className="ui-pill ui-pill--warn">
                    <Award size={12} />
                    {m.badgeCount} {t('organizer.badgesPage.earned')}
                  </span>
                </div>
                {m.badges.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                    {t('organizer.badgesPage.noBadges')}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {m.badges.map((b) => {
                      const meta = BADGE_META[b.type] || { icon: '🏅', name: b.type, color: '#64748b' };
                      return (
                        <div key={b.id} style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '8px 14px',
                          background: `${meta.color}14`,
                          border: `1px solid ${meta.color}30`,
                          borderRadius: 10,
                        }}>
                          <span style={{ fontSize: 18 }}>{meta.icon}</span>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: meta.color }}>{meta.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {b.earnedAt ? new Date(b.earnedAt).toLocaleDateString() : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .org-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }

        @media (max-width: 900px) { .org-grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .org-grid-3 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default OrganizerBadges;