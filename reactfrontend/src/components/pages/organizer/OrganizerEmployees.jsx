import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import {
  Users, UserPlus, Search, RefreshCw, Power, PowerOff,
  Pencil, Key, Trash2, X, Check, AlertCircle, AlertTriangle
} from 'lucide-react';

const Toast = ({ type, msg, onClose }) => {
  useEffect(() => {
    if (msg) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [msg, onClose]);

  if (!msg) return null;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '14px 20px', borderRadius: 12,
      display: 'flex', alignItems: 'center', gap: 10,
      background: type === 'success' ? 'var(--pill-success-bg)' : 'var(--pill-danger-bg)',
      color: type === 'success' ? 'var(--pill-success-fg)' : 'var(--pill-danger-fg)',
      border: `1px solid ${type === 'success' ? 'var(--tint-border)' : 'rgba(239,68,68,.28)'}`,
      boxShadow: '0 10px 40px rgba(0,0,0,.15)',
      fontSize: 14, fontWeight: 600, minWidth: 320, maxWidth: 500,
      animation: 'slideInRight .4s var(--ease-out)',
    }}>
      {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 18, padding: 2 }}>
        ×
      </button>
    </div>
  );
};

const OrganizerEmployees = () => {
  const { t } = useLanguage();
  const [orgId, setOrgId] = useState(null);
  const [orgName, setOrgName] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [toast, setToast] = useState({ type: '', msg: '' });
  const [confirm, setConfirm] = useState({ show: false, type: '', member: null });

  const showToast = (type, msg) => setToast({ type, msg });
  const hideToast = () => setToast({ type: '', msg: '' });

  const loadOrg = async () => {
    const res = await axiosClient.get('/organizations/me');
    setOrgId(res.data.id);
    setOrgName(res.data.name);
    return res.data.id;
  };

  const loadMembers = async (id) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('size', '100');
      const res = await axiosClient.get(`/organizations/${id}/members?${params}`);
      setMembers(res.data.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const id = await loadOrg();
      if (id) await loadMembers(id);
    })();
  }, []);

  useEffect(() => {
    if (orgId) loadMembers(orgId);
  }, [search, statusFilter]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirm({ show: false, type: '', member: null });
    };
    if (confirm.show) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirm.show]);

  const handleToggle = async (member) => {
    const newStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await axiosClient.put(`/organizations/${orgId}/members/${member.memberId}/status?status=${newStatus}`);
      showToast('success', `${member.fullName} → ${newStatus}`);
      loadMembers(orgId);
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed');
    }
  };

  const requestReset = (member) => setConfirm({ show: true, type: 'reset', member });
  const requestDelete = (member) => setConfirm({ show: true, type: 'delete', member });
  const closeConfirm = () => setConfirm({ show: false, type: '', member: null });

  const executeConfirm = async () => {
    const { type, member } = confirm;
    if (!member) return;

    try {
      if (type === 'reset') {
        await axiosClient.post(`/organizations/${orgId}/members/${member.memberId}/reset-password`);
        showToast('success', t('organizer.employees.resetSent'));
      } else if (type === 'delete') {
        await axiosClient.delete(`/organizations/${orgId}/members/${member.memberId}`);
        showToast('success', t('organizer.employees.deleted'));
        loadMembers(orgId);
      }
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Failed');
    } finally {
      closeConfirm();
    }
  };

  const getInitials = (n) => (n || '?').charAt(0).toUpperCase();

  return (
    <Layout userRole="organizer">
      <Toast type={toast.type} msg={toast.msg} onClose={hideToast} />

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Users size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('organizer.employees.teamManagement')}
                </h1>
                <p className="ui-hero__subtitle--compact">
                  {t('organizer.employees.subtitle', orgName || 'your organization')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={() => setShowAddModal(true)}>
                <UserPlus size={16} />
                {t('organizer.employees.addEmployee')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: filter card --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('organizer.employees.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ui-input"
                style={{ paddingLeft: 38 }}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ui-select"
              >
                <option value="all">{t('organizer.employees.all')}</option>
                <option value="ACTIVE">{t('organizer.employees.active')}</option>
                <option value="INACTIVE">{t('organizer.employees.inactive')}</option>
              </select>
            </div>
            <button
              onClick={() => loadMembers(orgId)}
              className="ui-btn ui-btn--secondary ui-btn--icon"
              aria-label="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* --- UI: members table --- */}
        <div className="ui-card ui-card--flush">
          <div className="ui-card__head" style={{ padding: '20px 22px 0' }}>
            <div>
              <h3 className="ui-card__title">
                <Users size={18} color="var(--green-600)" />
                {t('organizer.employees.members')}
              </h3>
              <p className="ui-card__subtitle">{members.length} {t('organizer.employees.total') || 'total'}</p>
            </div>
          </div>

          {loading ? (
            <div className="ui-state">
              <div className="ui-spinner" />
              <p className="ui-state__text">{t('common.loading')}</p>
            </div>
          ) : members.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Users size={28} /></div>
              <p className="ui-state__title">{t('organizer.employees.noMembers')}</p>
              <p className="ui-state__text">{t('organizer.employees.noMembersHint')}</p>
              <div className="ui-state__actions">
                <button className="ui-btn ui-btn--primary" onClick={() => setShowAddModal(true)}>
                  <UserPlus size={16} />
                  {t('organizer.employees.addEmployee')}
                </button>
              </div>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('organizer.employees.member')}</th>
                    <th>{t('organizer.employees.status')}</th>
                    <th style={{ textAlign: 'center' }}>{t('organizer.employees.activities')}</th>
                    <th style={{ textAlign: 'right' }}>{t('organizer.employees.emissions')}</th>
                    <th style={{ textAlign: 'center' }}>{t('organizer.employees.badges')}</th>
                    <th style={{ textAlign: 'center' }}>{t('organizer.employees.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.memberId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                            color: 'white', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0,
                          }}>{getInitials(m.fullName)}</div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-strong)', fontSize: 13 }}>
                              {m.username || m.fullName}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`ui-pill ${m.status === 'ACTIVE' ? 'ui-pill--success' : 'ui-pill--danger'}`}>
                          <span className="ui-pill__dot" />
                          {m.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-strong)' }}>
                        {m.activityCount || 0}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--green-700)' }}>
                        {m.totalCO2e ? Number(m.totalCO2e).toFixed(2) : '0.00'} kg
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="ui-pill ui-pill--warn" style={{ minWidth: 32, justifyContent: 'center' }}>
                          {m.badgeCount || 0}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                          <IconBtn
                            title={m.status === 'ACTIVE' ? t('organizer.employees.disable') : t('organizer.employees.enable')}
                            color={m.status === 'ACTIVE' ? '#f59e0b' : '#16a34a'}
                            onClick={() => handleToggle(m)}>
                            {m.status === 'ACTIVE' ? <PowerOff size={14} /> : <Power size={14} />}
                          </IconBtn>
                          <IconBtn title={t('organizer.employees.edit')} color="#3b82f6"
                            onClick={() => setEditingMember(m)}>
                            <Pencil size={14} />
                          </IconBtn>
                          <IconBtn title={t('organizer.employees.reset')} color="#8b5cf6"
                            onClick={() => requestReset(m)}>
                            <Key size={14} />
                          </IconBtn>
                          <IconBtn title={t('organizer.employees.delete')} color="#dc2626"
                            onClick={() => requestDelete(m)}>
                            <Trash2 size={14} />
                          </IconBtn>
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

      {showAddModal && (
        <AddEmployeeModal
          orgId={orgId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); showToast('success', t('organizer.employees.added')); loadMembers(orgId); }}
          t={t}
        />
      )}

      {editingMember && (
        <EditEmployeeModal
          orgId={orgId}
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={() => { setEditingMember(null); showToast('success', t('organizer.employees.saved')); loadMembers(orgId); }}
          t={t}
        />
      )}

      {/* --- UI: confirm modal --- */}
      {confirm.show && (
        <div className="app-confirm-overlay" onClick={closeConfirm}>
          <div className="app-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm__icon">
              <AlertTriangle size={28} color="var(--pill-danger-fg)" />
            </div>
            <h2 className="app-confirm__title">
              {confirm.type === 'reset'
                ? `Reset password for ${confirm.member?.fullName}?`
                : 'Delete this employee?'}
            </h2>
            <p className="app-confirm__text">
              {confirm.type === 'reset'
                ? 'A new temporary password will be emailed to the member.'
                : 'This will permanently remove the member and cannot be undone.'}
            </p>
            <div className="app-confirm__actions">
              <button type="button" className="app-confirm__cancel" onClick={closeConfirm}>
                {t('organizer.employees.cancel')}
              </button>
              <button type="button" className="app-confirm__danger" onClick={executeConfirm}>
                {confirm.type === 'reset' ? <Key size={16} /> : <Trash2 size={16} />}
                {confirm.type === 'reset' ? 'Reset' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

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

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
        }
      `}</style>
    </Layout>
  );
};

// ============ Add Employee Modal ============
const AddEmployeeModal = ({ orgId, onClose, onSuccess, t }) => {
  const [form, setForm] = useState({ username: '', email: '', tempPassword: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const genPwd = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let s = '';
    for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  };

  useEffect(() => {
    setForm((f) => ({ ...f, tempPassword: genPwd() }));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.email.trim() || !form.tempPassword.trim()) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post(`/organizations/${orgId}/members`, form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-confirm-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ui-card__head" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="modal-card__icon modal-card__icon--green">
              <UserPlus size={16} />
            </div>
            <h2 className="ui-card__title">{t('organizer.employees.addEmployeeTitle')}</h2>
          </div>
          <button className="ui-modal__close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'var(--pill-danger-bg)',
            border: '1px solid rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)',
            borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="ui-field">
            <label className="ui-field__label">{t('organizer.employees.username')}</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder={t('organizer.employees.usernamePlaceholder')}
              className="ui-input"
              required
            />
          </div>
          <div className="ui-field">
            <label className="ui-field__label">{t('organizer.employees.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t('organizer.employees.emailPlaceholder')}
              className="ui-input"
              required
            />
          </div>
          <div className="ui-field">
            <label className="ui-field__label">{t('organizer.employees.fullName')}</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder={t('organizer.employees.fullNamePlaceholder')}
              className="ui-input"
            />
          </div>
          <div className="ui-field">
            <label className="ui-field__label">{t('organizer.employees.tempPassword')}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={form.tempPassword}
                onChange={(e) => setForm({ ...form, tempPassword: e.target.value })}
                placeholder={t('organizer.employees.tempPasswordPlaceholder')}
                className="ui-input"
                style={{ flex: 1, fontFamily: 'monospace' }}
                required
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, tempPassword: genPwd() })}
                className="ui-btn ui-btn--secondary"
                title="Regenerate"
              >
                ⟳
              </button>
            </div>
          </div>

          <div className="modal-card__hint">
            💡 {t('organizer.employees.tempPasswordHint')}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} className="ui-btn ui-btn--secondary ui-btn--block ui-btn--lg">
              {t('organizer.employees.cancel')}
            </button>
            <button type="submit" disabled={loading} className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg">
              {loading ? (
                <>
                  <span className="ui-btn__spinner" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  {t('organizer.employees.add')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============ Edit Employee Modal ============
const EditEmployeeModal = ({ orgId, member, onClose, onSuccess, t }) => {
  const [fullName, setFullName] = useState(member.fullName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axiosClient.put(`/organizations/${orgId}/members/${member.memberId}`, { fullName });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-confirm-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ui-card__head" style={{ marginBottom: 20 }}>
          <h2 className="ui-card__title">{t('organizer.employees.editTitle')}</h2>
          <button className="ui-modal__close" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', background: 'var(--pill-danger-bg)',
            border: '1px solid rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)',
            borderRadius: 8, fontSize: 13, marginBottom: 14, fontWeight: 600,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="ui-field">
            <label className="ui-field__label">{t('organizer.employees.fullName')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="ui-input"
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button type="button" onClick={onClose} className="ui-btn ui-btn--secondary ui-btn--block ui-btn--lg">
              {t('organizer.employees.cancel')}
            </button>
            <button type="submit" disabled={loading} className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg">
              {loading ? (
                <>
                  <span className="ui-btn__spinner" />
                  {t('common.loading')}
                </>
              ) : (
                t('common.save')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============ IconBtn helper ============
const IconBtn = ({ title, color, onClick, children }) => (
  <button onClick={onClick} title={title} style={{
    padding: 7, borderRadius: 6, border: 'none',
    background: `${color}15`, color: color, cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all .15s var(--ease)',
  }}
    onMouseEnter={(e) => e.currentTarget.style.background = `${color}30`}
    onMouseLeave={(e) => e.currentTarget.style.background = `${color}15`}
  >{children}</button>
);

export default OrganizerEmployees;