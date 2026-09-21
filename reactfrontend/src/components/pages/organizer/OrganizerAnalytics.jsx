import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import { TrendingUp, RefreshCw, Download, Users, UserCheck, Activity, Flame, FileSpreadsheet, FileText } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const CATEGORY_COLORS = { Transport: '#22c55e', Electricity: '#3b82f6', Food: '#f59e0b', Shopping: '#8b5cf6' };

const OrganizerAnalytics = () => {
  const { t } = useLanguage();
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [range, setRange] = useState('monthly');
  const [dashboard, setDashboard] = useState(null);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async (id, r) => {
    try {
      setLoading(true);
      const [d, m, a] = await Promise.all([
        axiosClient.get(`/organizations/${id}/dashboard?range=${r}`),
        axiosClient.get(`/organizations/${id}/members?size=1000`),
        axiosClient.get(`/organizations/${id}/activities`),
      ]);
      setDashboard(d.data);
      setMembers(m.data.content || []);
      setActivities(a.data.activities || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    (async () => {
      const r = await axiosClient.get('/organizations/me');
      setOrgId(r.data.id);
      setOrgName(r.data.name);
      load(r.data.id, range);
    })();
  }, []);

  useEffect(() => { if (orgId) load(orgId, range); }, [range]);

  const downloadCSV = (filename, headers, rows) => {
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(r => {
      csv += r.map(f => {
        const s = String(f ?? '');
        return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const exportAnalytics = () => {
    if (!dashboard) return;
    const headers = ['Period', 'Total CO2 (kg)', 'Activities'];
    const rows = (dashboard.trendData || []).map(p => [p.period, p.totalCO2e, p.activityCount]);
    downloadCSV(`analytics_${orgName}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const exportMembers = () => {
    const headers = ['Name', 'Username', 'Email', 'Status', 'Activities', 'Total CO2 (kg)', 'Badges'];
    const rows = members.map(m => [m.fullName, m.username, m.email, m.status, m.activityCount, m.totalCO2e, m.badgeCount]);
    downloadCSV(`members_${orgName}.csv`, headers, rows);
  };

  const exportActivities = () => {
    const headers = ['Member', 'Category', 'Activity', 'Quantity', 'Unit', 'CO2 (kg)', 'Date'];
    const rows = activities.map(a => [a.memberName, a.category, a.activityType, a.quantity, a.unit, a.co2eKg, a.logDate]);
    downloadCSV(`activities_${orgName}.csv`, headers, rows);
  };

  const categoryData = dashboard?.categoryBreakdown
    ? Object.entries(dashboard.categoryBreakdown).map(([name, value]) => ({ name, value: Number(value) })).filter(d => d.value > 0)
    : [];

  return (
    <Layout userRole="organizer">
      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><TrendingUp size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('organizer.analyticsPage.title')}
                </h1>
                <p className="ui-hero__subtitle--compact">{orgName}</p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="ui-select"
                style={{ width: 'auto', minWidth: 130 }}
              >
                <option value="daily">{t('organizer.analyticsPage.daily')}</option>
                <option value="weekly">{t('organizer.analyticsPage.weekly')}</option>
                <option value="monthly">{t('organizer.analyticsPage.monthly')}</option>
                <option value="yearly">{t('organizer.analyticsPage.yearly')}</option>
              </select>
              <button className="ui-btn ui-btn--hero-ghost" onClick={() => load(orgId, range)}>
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        {dashboard && (
          <div className="ui-grid ui-grid--4" style={{ marginBottom: 24 }}>
            <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
              <div className="ui-stat__top">
                <div className="ui-stat__icon ui-stat__icon--neutral"><Users size={20} /></div>
              </div>
              <div className="ui-stat__value">{dashboard.totalMembers}</div>
              <div className="ui-stat__label">{t('organizer.analyticsPage.members')}</div>
            </div>
            <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
              <div className="ui-stat__top">
                <div className="ui-stat__icon ui-stat__icon--green"><UserCheck size={20} /></div>
              </div>
              <div className="ui-stat__value">{dashboard.activeMembers}</div>
              <div className="ui-stat__label">{t('organizer.analyticsPage.activeMembers')}</div>
            </div>
            <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
              <div className="ui-stat__top">
                <div className="ui-stat__icon ui-stat__icon--amber"><Activity size={20} /></div>
              </div>
              <div className="ui-stat__value">{dashboard.totalActivitiesInRange || activities.length}</div>
              <div className="ui-stat__label">{t('organizer.analyticsPage.activities')}</div>
            </div>
            <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #dc2626' }}>
              <div className="ui-stat__top">
                <div className="ui-stat__icon ui-stat__icon--red"><Flame size={20} /></div>
              </div>
              <div className="ui-stat__value">{Number(dashboard.totalCO2 || 0).toFixed(2)}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
              <div className="ui-stat__label">{t('organizer.analyticsPage.totalEmission')}</div>
            </div>
          </div>
        )}

        {/* --- UI: charts --- */}
        <div className="org-charts-split" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">{t('organizer.analyticsPage.emissionTrend')}</h3>
            </div>
            <div style={{ height: 260 }}>
              {!dashboard?.trendData?.length ? (
                <div className="ui-state" style={{ padding: 20 }}>
                  <p className="ui-state__text">No data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboard.trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="period" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)' }} formatter={(v) => `${v} kg`} />
                    <Line type="monotone" dataKey="totalCO2e" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <h3 className="ui-card__title">{t('organizer.analyticsPage.categoryDistribution')}</h3>
            </div>
            <div style={{ height: 260 }}>
              {categoryData.length === 0 ? (
                <div className="ui-state" style={{ padding: 20 }}>
                  <p className="ui-state__text">No data yet</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2}>
                      {categoryData.map((e, i) => <Cell key={i} fill={CATEGORY_COLORS[e.name] || '#64748b'} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${v} kg`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* --- UI: bar chart --- */}
        <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 24 }}>
          <div className="ui-card__head">
            <h3 className="ui-card__title">{t('organizer.analyticsPage.emissionByCategory')}</h3>
          </div>
          <div style={{ height: 260 }}>
            {categoryData.length === 0 ? (
              <div className="ui-state" style={{ padding: 20 }}>
                <p className="ui-state__text">No data yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                  <Tooltip formatter={(v) => `${v} kg`} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {categoryData.map((e, i) => <Cell key={i} fill={CATEGORY_COLORS[e.name] || '#64748b'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* --- UI: reports --- */}
        <h3 className="ui-card__title" style={{ marginBottom: 14 }}>
          📄 {t('organizer.analyticsPage.analyticsReport').replace(' Report', 's')}
        </h3>
        <div className="ui-grid ui-grid--3">
          <ReportCard
            icon={<FileText size={22} color="#dc2626" />}
            bg="rgba(239,68,68,.12)"
            title={t('organizer.analyticsPage.analyticsReport')}
            desc={t('organizer.analyticsPage.analyticsReportDesc')}
            btnLabel={t('organizer.analyticsPage.download')}
            onClick={exportAnalytics}
          />
          <ReportCard
            icon={<Users size={22} color="#22c55e" />}
            bg="rgba(34,197,94,.12)"
            title={t('organizer.analyticsPage.membersReport')}
            desc={t('organizer.analyticsPage.membersReportDesc')}
            btnLabel={t('organizer.analyticsPage.download')}
            onClick={exportMembers}
          />
          <ReportCard
            icon={<FileSpreadsheet size={22} color="#3b82f6" />}
            bg="rgba(59,130,246,.12)"
            title={t('organizer.analyticsPage.activityReport')}
            desc={t('organizer.analyticsPage.activityReportDesc')}
            btnLabel={t('organizer.analyticsPage.download')}
            onClick={exportActivities}
          />
        </div>
      </div>

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .org-charts-split { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; }

        @media (max-width: 1024px) {
          .ui-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .org-charts-split { grid-template-columns: minmax(0, 1fr); }
          .ui-grid--3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-grid--4, .ui-grid--3 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

const ReportCard = ({ icon, bg, title, desc, btnLabel, onClick }) => (
  <div className="ui-card ui-card--pad-lg" style={{ textAlign: 'center' }}>
    <div style={{
      width: 52, height: 52, borderRadius: '50%',
      background: bg, display: 'grid', placeItems: 'center',
      margin: '0 auto 12px',
    }}>
      {icon}
    </div>
    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>{desc}</div>
    <button onClick={onClick} className="ui-btn ui-btn--primary ui-btn--sm">
      <Download size={14} />
      {btnLabel}
    </button>
  </div>
);

export default OrganizerAnalytics;