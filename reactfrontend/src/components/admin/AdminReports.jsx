import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  FileText, Download, RefreshCw, Calendar,
  Filter, BarChart3, Users, Award, TrendingUp,
  Check, X, AlertCircle, Clock, Loader
} from 'lucide-react';

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

const AdminReports = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('user');
  const [dateRange, setDateRange] = useState('monthly');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [recentReports, setRecentReports] = useState([]);

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  useEffect(() => {
    const saved = localStorage.getItem('carbonRecentReports');
    if (saved) {
      setRecentReports(JSON.parse(saved));
    } else {
      const defaultReports = [
        { id: 1, name: 'User Activity Report', date: new Date().toISOString().split('T')[0], format: 'CSV', size: '2.4 MB' },
        { id: 2, name: 'Emissions Summary', date: new Date().toISOString().split('T')[0], format: 'CSV', size: '1.8 MB' },
      ];
      setRecentReports(defaultReports);
      localStorage.setItem('carbonRecentReports', JSON.stringify(defaultReports));
    }
  }, []);

  const reportTemplates = [
    { id: 'user',         label: t('admin.reports.userReport'),         description: t('admin.reports.userDesc'),         icon: <Users size={18} /> },
    { id: 'emissions',    label: t('admin.reports.emissionReport'),     description: t('admin.reports.emissionDesc'),     icon: <BarChart3 size={18} /> },
    { id: 'goals',        label: t('admin.reports.goalReport'),         description: t('admin.reports.goalDesc'),         icon: <TrendingUp size={18} /> },
    { id: 'badges',       label: t('admin.reports.badgeReport'),        description: t('admin.reports.badgeDesc'),        icon: <Award size={18} /> },
    { id: 'organization', label: t('admin.reports.organizationReport'), description: t('admin.reports.organizationDesc'), icon: <Users size={18} /> },
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    setReportGenerated(false);

    try {
      let reportName = '';
      let headers = [];
      let rows = [];

      switch (reportType) {
        case 'user': {
          reportName = t('admin.reports.userReport');
          const usersResponse = await axiosClient.get('/auth/users');
          const users = usersResponse.data.users || [];

          headers = [t('common.fullName'), t('common.email'), t('admin.users.role'), t('admin.users.status'),
                     t('activity.totalActivities'), 'CO₂e (kg)', t('nav.badges'), t('admin.users.joined')];

          for (const user of users) {
            try {
              const activitiesRes = await axiosClient.get(`/activities/user/${user.id}`);
              const activities = activitiesRes.data || [];
              const totalCO2 = activities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);

              const badgesRes = await axiosClient.get(`/badges/user/${user.id}`);
              const badges = badgesRes.data || [];

              rows.push([
                user.fullName || 'N/A',
                user.email || 'N/A',
                user.role || 'USER',
                user.enabled ? t('admin.users.active') : t('admin.users.inactive'),
                activities.length,
                totalCO2.toFixed(2),
                badges.length,
                user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
              ]);
            } catch (e) {
              rows.push([
                user.fullName || 'N/A',
                user.email || 'N/A',
                user.role || 'USER',
                user.enabled ? t('admin.users.active') : t('admin.users.inactive'),
                0, '0.00', 0,
                user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'
              ]);
            }
          }
          break;
        }

        case 'emissions': {
          reportName = t('admin.reports.emissionReport');
          const usersResponse = await axiosClient.get('/auth/users');
          const users = usersResponse.data.users || [];

          headers = [t('common.category'), 'Total CO₂e (kg)', t('activity.totalActivities'), t('admin.activities.avgPerActivity')];
          const categories = ['Transport', 'Electricity', 'Food', 'Shopping'];
          let allActivities = [];

          for (const user of users) {
            try {
              const activitiesRes = await axiosClient.get(`/activities/user/${user.id}`);
              const activities = activitiesRes.data || [];
              allActivities = [...allActivities, ...activities];
            } catch (e) {}
          }

          for (const cat of categories) {
            const catActivities = allActivities.filter(a => a.category === cat);
            const totalCO2 = catActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
            const avg = catActivities.length > 0 ? totalCO2 / catActivities.length : 0;
            rows.push([
              t(`activity.${cat.toLowerCase()}`),
              totalCO2.toFixed(2),
              catActivities.length,
              avg.toFixed(2)
            ]);
          }

          const totalAll = allActivities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
          rows.push([
            'TOTAL',
            totalAll.toFixed(2),
            allActivities.length,
            (allActivities.length > 0 ? totalAll / allActivities.length : 0).toFixed(2)
          ]);
          break;
        }

        case 'goals': {
          reportName = t('admin.reports.goalReport');
          const usersResponse = await axiosClient.get('/auth/users');
          const users = usersResponse.data.users || [];

          headers = [t('common.fullName'), t('goals.name'), t('common.category'), t('goals.target'),
                     t('goals.current'), t('goals.progress'), t('common.status')];

          for (const user of users) {
            try {
              const goalsRes = await axiosClient.get(`/goals/user/${user.id}`);
              const goals = goalsRes.data || [];
              for (const goal of goals) {
                rows.push([
                  user.fullName || 'N/A',
                  goal.goalName || 'N/A',
                  goal.category || 'N/A',
                  goal.targetCO2 || 0,
                  goal.currentCO2 || 0,
                  goal.progressPercentage || 0,
                  goal.status || t('common.notStarted')
                ]);
              }
            } catch (e) {}
          }
          break;
        }

        case 'badges': {
          reportName = t('admin.reports.badgeReport');
          const usersResponse = await axiosClient.get('/auth/users');
          const users = usersResponse.data.users || [];

          headers = [t('common.fullName'), t('admin.badges.badgeType'), t('admin.badges.badgeName'), t('admin.badges.earnedAt')];

          for (const user of users) {
            try {
              const badgesRes = await axiosClient.get(`/badges/user/${user.id}`);
              const badges = badgesRes.data || [];
              for (const badge of badges) {
                rows.push([
                  user.fullName || 'N/A',
                  badge.badgeType || 'N/A',
                  badge.badgeName || badge.badgeType || 'N/A',
                  badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : 'N/A'
                ]);
              }
            } catch (e) {}
          }
          break;
        }

        case 'organization': {
          reportName = t('admin.reports.organizationReport');
          const saved = localStorage.getItem('carbonOrganizations');
          const orgs = saved ? JSON.parse(saved) : [];

          headers = [t('admin.organizations.name'), t('common.email'), t('admin.organizations.industry'),
                     t('admin.organizations.employees'), t('admin.organizations.status'), 'CO₂e (kg)'];

          for (const org of orgs) {
            rows.push([
              org.name || 'N/A',
              org.email || 'N/A',
              org.industry || 'N/A',
              org.employees || 0,
              org.status || t('admin.users.active'),
              org.co2e || 0
            ]);
          }
          break;
        }

        default: {
          reportName = 'Report';
          headers = ['Data'];
          rows = [['No data available']];
        }
      }

      if (selectedFormat === 'csv') {
        generateCSV(reportName, headers, rows);
      } else if (selectedFormat === 'excel') {
        generateCSV(reportName, headers, rows);
      } else {
        generatePDF(reportName, headers, rows);
      }

      const newReport = {
        id: Date.now(),
        name: reportName,
        date: new Date().toISOString().split('T')[0],
        format: selectedFormat.toUpperCase(),
        size: `${(rows.length * 0.1 + 0.5).toFixed(1)} MB`
      };
      const updatedReports = [newReport, ...recentReports].slice(0, 10);
      setRecentReports(updatedReports);
      localStorage.setItem('carbonRecentReports', JSON.stringify(updatedReports));

      setReportGenerated(true);
      showToast('success', `✅ ${reportName} ${t('admin.reports.generatedSuccess')}`);

      setTimeout(() => setReportGenerated(false), 3000);

    } catch (error) {
      console.error('Error generating report:', error);
      showToast('error', 'Failed to generate report: ' + (error.response?.data?.error || error.message));
    }

    setGenerating(false);
  };

  const generateCSV = (reportName, headers, rows) => {
    let csvContent = '\uFEFF';
    csvContent += headers.join(',') + '\n';

    for (const row of rows) {
      const escapedRow = row.map(field => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvContent += escapedRow.join(',') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `${reportName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const generatePDF = (reportName, headers, rows) => {
    let content = `========================================\n`;
    content += `  ${reportName.toUpperCase()}\n`;
    content += `  ${t('admin.reports.generated')}: ${new Date().toLocaleString()}\n`;
    content += `========================================\n\n`;

    content += headers.join(' | ') + '\n';
    content += '-'.repeat(80) + '\n';

    for (const row of rows) {
      content += row.join(' | ') + '\n';
    }

    content += '\n' + '='.repeat(80) + '\n';
    content += `${t('admin.reports.totalRecords')}: ${rows.length}\n`;
    content += `${t('admin.reports.generatedBy')} CarbonTrack\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, `${reportName.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.txt`);
  };

  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showToast('success', `✅ ${t('admin.reports.fileDownloaded')}: ${filename}`);
  };

  const handleDownloadRecent = (report) => {
    showToast('info', `📥 ${t('admin.reports.downloading')} ${report.name}...`);

    const headers = [t('admin.reports.reportName'), t('common.date'), t('admin.reports.format'), t('admin.reports.size')];
    const rows = [[report.name, report.date, report.format, report.size]];

    if (report.format === 'CSV' || report.format === 'Excel') {
      generateCSV(report.name, headers, rows);
    } else {
      generatePDF(report.name, headers, rows);
    }
  };

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
              <div className="ui-hero__icon"><FileText size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.reports.title')}</h1>
                <p className="ui-hero__subtitle--compact">{t('admin.reports.description')}</p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={() => setReportGenerated(false)}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: generator + templates side-by-side --- */}
        <div className="reports-split" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--pad-lg">
            <h3 className="ui-card__title" style={{ marginBottom: 16 }}>
              📄 {t('admin.reports.generateReport')}
            </h3>

            <div className="ui-field">
              <label className="ui-field__label">{t('admin.reports.reportType')}</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="ui-select"
              >
                {reportTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.label}</option>
                ))}
              </select>
              <span className="ui-field__hint">
                {reportTemplates.find(r => r.id === reportType)?.description}
              </span>
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('admin.reports.dateRange')}</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="ui-select"
              >
                <option value="weekly">{t('analytics.weekly')}</option>
                <option value="monthly">{t('analytics.monthly')}</option>
                <option value="quarterly">{t('admin.reports.quarterly')}</option>
                <option value="yearly">{t('analytics.yearly')}</option>
                <option value="custom">{t('admin.reports.customRange')}</option>
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('admin.reports.exportFormat')}</label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="ui-select"
              >
                <option value="csv">📊 CSV</option>
                <option value="excel">📋 Excel</option>
                <option value="pdf">📄 PDF (Text)</option>
              </select>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg"
            >
              {generating ? (
                <>
                  <span className="ui-btn__spinner" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <FileText size={18} />
                  {t('admin.reports.generate')}
                </>
              )}
            </button>

            {reportGenerated && (
              <div style={{
                marginTop: 12,
                padding: '12px 16px',
                background: 'var(--pill-success-bg)',
                borderRadius: 10,
                color: 'var(--pill-success-fg)',
                fontSize: 14,
                display: 'flex', alignItems: 'center', gap: 8,
                border: '1px solid var(--tint-border)',
              }}>
                <Check size={18} />
                ✅ {t('admin.reports.downloadSuccess')}
              </div>
            )}
          </div>

          <div className="ui-card ui-card--pad-lg">
            <h3 className="ui-card__title" style={{ marginBottom: 16 }}>
              📋 {t('admin.reports.templates')}
            </h3>
            {reportTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setReportType(template.id)}
                className={`report-template-btn ${reportType === template.id ? 'is-active' : ''}`}
              >
                <div className={`report-template-btn__icon ${reportType === template.id ? 'is-active' : ''}`}>
                  {template.icon}
                </div>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-strong)' }}>{template.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{template.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* --- UI: recent reports --- */}
        <div className="ui-card ui-card--flush">
          <div className="ui-card__head" style={{ padding: '20px 22px 0' }}>
            <div>
              <h3 className="ui-card__title">📁 {t('admin.reports.recentReports')}</h3>
              <p className="ui-card__subtitle">{recentReports.length} {t('admin.reports.reports')}</p>
            </div>
          </div>
          <div className="ui-table-wrap" style={{ marginTop: 12 }}>
            <table className="ui-table">
              <thead>
                <tr>
                  <th>{t('admin.reports.reportName')}</th>
                  <th>{t('common.date')}</th>
                  <th>{t('admin.reports.format')}</th>
                  <th style={{ textAlign: 'right' }}>{t('admin.reports.size')}</th>
                  <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.map((report) => (
                  <tr key={report.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{report.name}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{report.date}</td>
                    <td>
                      <span className={`ui-pill ${
                        report.format === 'PDF' ? 'ui-pill--danger' :
                        report.format === 'CSV' ? 'ui-pill--info' :
                        'ui-pill--success'
                      }`}>
                        {report.format}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{report.size}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleDownloadRecent(report)}
                        className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                        style={{ color: '#3b82f6' }}
                        title={t('admin.reports.download')}
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .reports-split {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .report-template-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 14px 16px;
          margin-bottom: 10px;
          background: var(--bg-subtle);
          border: 1px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          transition: all .2s var(--ease);
        }
        .report-template-btn:hover {
          border-color: var(--green-300);
          background: var(--tint-1);
          transform: translateY(-1px);
        }
        .report-template-btn.is-active {
          background: var(--tint-1);
          border: 2px solid var(--green-600);
        }
        .report-template-btn__icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg-surface);
          display: grid;
          place-items: center;
          color: var(--text-muted);
          flex-shrink: 0;
          transition: all .2s var(--ease);
        }
        .report-template-btn__icon.is-active {
          background: rgba(34,197,94,.15);
          color: var(--green-600);
        }

        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }

        @media (max-width: 900px) {
          .reports-split { grid-template-columns: minmax(0, 1fr); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
        }
      `}</style>
    </Layout>
  );
};

export default AdminReports;