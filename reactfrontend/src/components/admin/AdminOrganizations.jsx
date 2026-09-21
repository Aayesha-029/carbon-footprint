import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  Building2, Trash2, RefreshCw, Users, Mail, Phone, MapPin,
  User as UserIcon, Flame, Check, X, AlertCircle, Search,
  ShieldCheck, ShieldOff, Calendar, Eye, AlertTriangle
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

const AdminOrganizations = () => {
  const { t } = useLanguage();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, org: null });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const loadOrganizations = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/admin/organizations');
      setOrganizations(res.data || []);
    } catch (err) {
      console.error('Error loading organizations:', err);
      showToast('error', err.response?.data?.error || 'Failed to load organizations');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmDelete({ show: false, org: null });
    };
    if (confirmDelete.show) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete.show]);

  const handleStatusToggle = async (org) => {
    const newStatus = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await axiosClient.put(`/admin/organizations/${org.id}/status?status=${newStatus}`);
      showToast('success', `${org.name} → ${newStatus}`);
      loadOrganizations();
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('error', err.response?.data?.error || 'Failed to update status');
    }
  };

  const requestDelete = (org) => setConfirmDelete({ show: true, org });
  const closeConfirmDelete = () => setConfirmDelete({ show: false, org: null });

  const executeDelete = async () => {
    const org = confirmDelete.org;
    if (!org) return;
    try {
      await axiosClient.delete(`/admin/organizations/${org.id}`);
      showToast('success', `✅ ${org.name} deleted`);
      loadOrganizations();
    } catch (err) {
      console.error('Error deleting organization:', err);
      showToast('error', err.response?.data?.error || 'Failed to delete organization');
    } finally {
      closeConfirmDelete();
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch =
      !searchTerm ||
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.organizerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.organizerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'Active'   && org.status === 'ACTIVE') ||
      (filterStatus === 'Inactive' && org.status === 'INACTIVE');

    return matchesSearch && matchesStatus;
  });

  const totalMembers = organizations.reduce((sum, o) => sum + (o.memberCount || 0), 0);
  const totalCO2 = organizations
    .reduce((sum, o) => sum + parseFloat(o.totalCO2 || 0), 0)
    .toFixed(2);
  const activeOrgs = organizations.filter(o => o.status === 'ACTIVE').length;

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
              <div className="ui-hero__icon"><Building2 size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.organizations.title')}</h1>
                <p className="ui-hero__subtitle--compact">
                  {organizations.length} {t('admin.organizations.organizations')} • {totalMembers} {t('admin.organizations.employees')} • {totalCO2} kg CO₂e
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadOrganizations}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        <div className="ui-grid ui-grid--4" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Building2 size={20} /></div>
            </div>
            <div className="ui-stat__value">{organizations.length}</div>
            <div className="ui-stat__label">{t('admin.organizations.total')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Users size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalMembers}</div>
            <div className="ui-stat__label">{t('admin.organizations.totalEmployees')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Flame size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalCO2}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span></div>
            <div className="ui-stat__label">{t('admin.organizations.totalCO2')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><ShieldCheck size={20} /></div>
            </div>
            <div className="ui-stat__value">{activeOrgs}</div>
            <div className="ui-stat__label">{t('admin.organizations.active')}</div>
          </div>
        </div>

        {/* --- UI: filters --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('admin.organizations.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ui-input"
                style={{ paddingLeft: 40 }}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="ui-select"
              >
                <option value="all">{t('admin.organizations.allStatus')}</option>
                <option value="Active">{t('admin.organizations.active')}</option>
                <option value="Inactive">{t('admin.organizations.inactive')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {filteredOrganizations.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Building2 size={28} /></div>
              <p className="ui-state__title">{t('admin.organizations.noOrganizations')}</p>
              <p className="ui-state__text">
                {organizations.length === 0
                  ? 'No organizations have registered yet.'
                  : 'Try adjusting your search or filter.'}
              </p>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('admin.organizations.name')}</th>
                    <th>Organizer</th>
                    <th style={{ textAlign: 'center' }}>Members</th>
                    <th style={{ textAlign: 'right' }}>CO₂e</th>
                    <th>{t('admin.organizations.status')}</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrganizations.map((org) => (
                    <tr key={org.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 8,
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 15, flexShrink: 0,
                          }}>
                            {(org.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-strong)', fontSize: 14 }}>{org.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Mail size={11} /> {org.email || '—'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)' }}>
                          {org.organizerName || '—'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{org.organizerEmail || ''}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <Users size={13} color="var(--text-muted)" />
                          <span style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{org.memberCount || 0}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                            ({org.activeMemberCount || 0} active)
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--green-700)', fontSize: 13 }}>
                          {org.totalCO2 || 0} kg
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleStatusToggle(org)}
                          className={`ui-pill ${org.status === 'ACTIVE' ? 'ui-pill--success' : 'ui-pill--danger'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle status"
                        >
                          {org.status === 'ACTIVE' ? <ShieldCheck size={12} /> : <ShieldOff size={12} />}
                          {org.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            onClick={() => setSelectedOrg(org)}
                            className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                            style={{ color: '#3b82f6' }}
                            title="View details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => requestDelete(org)}
                            className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                            style={{ color: 'var(--pill-danger-fg)' }}
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* --- UI: detail modal --- */}
      {selectedOrg && (
        <div className="app-confirm-overlay" onClick={() => setSelectedOrg(null)}>
          <div className="org-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18,
                }}>
                  {(selectedOrg.name || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', margin: 0 }}>
                    {selectedOrg.name}
                  </h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    ID: #{selectedOrg.id}
                  </p>
                </div>
              </div>
              <button className="ui-modal__close" onClick={() => setSelectedOrg(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <InfoRow icon={<UserIcon size={14} color="#16a34a" />} label="Organizer" value={selectedOrg.organizerName || '—'} />
              <InfoRow icon={<Mail size={14} color="#16a34a" />} label="Organizer Email" value={selectedOrg.organizerEmail || '—'} />
              <InfoRow icon={<Mail size={14} color="#3b82f6" />} label="Org Email" value={selectedOrg.email || '—'} />
              <InfoRow icon={<Phone size={14} color="#3b82f6" />} label="Phone" value={selectedOrg.phone || '—'} />
              <InfoRow icon={<MapPin size={14} color="#f59e0b" />} label="Address" value={selectedOrg.address || '—'} wide />
              <InfoRow icon={<Users size={14} color="#8b5cf6" />} label="Members" value={`${selectedOrg.memberCount || 0} (${selectedOrg.activeMemberCount || 0} active)`} />
              <InfoRow icon={<Flame size={14} color="#ef4444" />} label="Total CO₂" value={`${selectedOrg.totalCO2 || 0} kg`} />
              <InfoRow icon={<Calendar size={14} color="#64748b" />} label="Registered On" value={selectedOrg.createdAt ? new Date(selectedOrg.createdAt).toLocaleString() : '—'} />
              <InfoRow
                icon={selectedOrg.status === 'ACTIVE' ? <ShieldCheck size={14} color="#16a34a" /> : <ShieldOff size={14} color="#dc2626" />}
                label="Status"
                value={selectedOrg.status}
              />
            </div>

            {selectedOrg.description && (
              <div style={{ marginTop: 16 }}>
                <p className="ui-eyebrow" style={{ marginBottom: 4 }}>Description</p>
                <p style={{
                  fontSize: 13, color: 'var(--text-body)', margin: 0,
                  background: 'var(--bg-subtle)', padding: '10px 14px',
                  borderRadius: 8, lineHeight: 1.5,
                }}>
                  {selectedOrg.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- UI: delete confirmation modal --- */}
      {confirmDelete.show && (
        <div className="app-confirm-overlay" onClick={closeConfirmDelete}>
          <div className="app-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm__icon">
              <AlertTriangle size={28} color="var(--pill-danger-fg)" />
            </div>
            <h2 className="app-confirm__title">Delete organization?</h2>
            <p className="app-confirm__text">
              You're about to permanently delete <strong>{confirmDelete.org?.name}</strong>. This will remove all members, activities, and cannot be undone.
            </p>
            <div className="app-confirm__actions">
              <button type="button" className="app-confirm__cancel" onClick={closeConfirmDelete}>Cancel</button>
              <button type="button" className="app-confirm__danger" onClick={executeDelete}>
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .org-detail-modal {
          width: 100%; max-width: 560px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0,0,0,.28);
          animation: confirmPop .28s var(--ease-pop) both;
        }

        @keyframes slideInRight { from { opacity: 0; transform: translateX(100px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes confirmPop { from { opacity: 0; transform: scale(.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }

        .app-confirm-overlay {
          position: fixed; inset: 0; z-index: 9999;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          background: rgba(6, 20, 12, .55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: overlayFade .2s var(--ease) both;
        }
        .app-confirm {
          width: 100%; max-width: 420px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px 24px 22px;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0,0,0,.28);
          animation: confirmPop .28s var(--ease-pop) both;
        }
        .app-confirm__icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--pill-danger-bg);
          display: grid; place-items: center;
          margin: 0 auto 18px;
          border: 2px solid rgba(239,68,68,.28);
        }
        .app-confirm__title { font-size: 20px; font-weight: 700; color: var(--text-strong); margin: 0 0 8px; letter-spacing: -.3px; }
        .app-confirm__text { font-size: 14px; color: var(--text-muted); line-height: 1.55; margin: 0 0 22px; }
        .app-confirm__text strong { color: var(--text-strong); font-weight: 700; }
        .app-confirm__actions { display: flex; gap: 10px; }
        .app-confirm__cancel, .app-confirm__danger {
          flex: 1; padding: 11px 16px;
          border-radius: 10px; font-family: inherit;
          font-size: 14px; font-weight: 600;
          cursor: pointer; border: none;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: transform .2s var(--ease-out), box-shadow .2s var(--ease-out), background .2s var(--ease);
        }
        .app-confirm__cancel { background: var(--bg-subtle); color: var(--text-body); }
        .app-confirm__cancel:hover { background: var(--border); transform: translateY(-1px); }
        .app-confirm__danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; box-shadow: 0 4px 14px rgba(239,68,68,.3); }
        .app-confirm__danger:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(239,68,68,.4); }

        @media (max-width: 1024px) { .ui-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-grid--4 { grid-template-columns: minmax(0, 1fr); }
          .org-detail-modal { padding: 22px; }
        }
      `}</style>
    </Layout>
  );
};

// --- UI: helper for detail rows ---
const InfoRow = ({ icon, label, value, wide }) => (
  <div style={{ gridColumn: wide ? '1 / -1' : 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
      {icon}
      <span className="ui-eyebrow" style={{ letterSpacing: '.03em' }}>{label}</span>
    </div>
    <div style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 500, wordBreak: 'break-word' }}>
      {value}
    </div>
  </div>
);

export default AdminOrganizations;