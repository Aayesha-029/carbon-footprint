import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import { Trophy, RefreshCw, Crown, Medal, Users, Flame, Sparkles } from 'lucide-react';

const OrganizerLeaderboard = () => {
  const { t } = useLanguage();
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (id) => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/organizations/${id}/leaderboard`);
      setList(res.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      const r = await axiosClient.get('/organizations/me');
      setOrgId(r.data.id);
      setOrgName(r.data.name);
      load(r.data.id);
    })();
  }, []);

  const totalEmission = list.reduce((s, r) => s + Number(r.totalEmission || 0), 0);
  const avgEmission = list.length > 0 ? (totalEmission / list.length).toFixed(2) : 0;

  const rankIcon = (r) => {
    if (r === 1) return <Crown size={20} color="#f59e0b" />;
    if (r === 2) return <Medal size={20} color="#94a3b8" />;
    if (r === 3) return <Medal size={20} color="#cd7f32" />;
    return <span style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 13 }}>#{r}</span>;
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
              <div className="ui-hero__icon"><Trophy size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('organizer.leaderboardPage.teamRankings')}
                </h1>
                <p className="ui-hero__subtitle--compact">
                  {t('organizer.leaderboardPage.subtitle', orgName)}
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
        <div className="ui-grid ui-grid--3" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Users size={20} /></div>
            </div>
            <div className="ui-stat__value">{list.length}</div>
            <div className="ui-stat__label">{t('organizer.leaderboardPage.membersRanked')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Sparkles size={20} /></div>
            </div>
            <div className="ui-stat__value">{avgEmission}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('organizer.leaderboardPage.averageEmission')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Crown size={20} /></div>
            </div>
            <div className="ui-stat__value" style={{ fontSize: 20 }}>{list[0]?.name || '—'}</div>
            <div className="ui-stat__label">{t('organizer.leaderboardPage.topPerformer')}</div>
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {loading ? (
            <div className="ui-state">
              <div className="ui-spinner" />
              <p className="ui-state__text">{t('common.loading')}</p>
            </div>
          ) : list.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Trophy size={28} /></div>
              <p className="ui-state__title">{t('organizer.leaderboardPage.noData')}</p>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('organizer.leaderboardPage.rank')}</th>
                    <th>{t('organizer.leaderboardPage.member')}</th>
                    <th style={{ textAlign: 'right' }}>{t('organizer.leaderboardPage.emission')}</th>
                    <th style={{ textAlign: 'center' }}>{t('organizer.leaderboardPage.activities')}</th>
                    <th style={{ textAlign: 'center' }}>{t('organizer.leaderboardPage.badges')}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.userId} style={{
                      background: r.rank === 1 ? 'rgba(245,158,11,.06)' : 'transparent',
                    }}>
                      <td>
                        <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {rankIcon(r.rank)}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 700, fontSize: 13,
                          }}>
                            {(r.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 13 }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-700)' }}>
                        {Number(r.totalEmission).toFixed(2)} kg
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{r.activityCount}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="ui-pill ui-pill--warn" style={{ minWidth: 32, justifyContent: 'center' }}>
                          {r.badgeCount}
                        </span>
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

        @media (max-width: 1024px) {
          .ui-grid--3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-grid--3 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default OrganizerLeaderboard;