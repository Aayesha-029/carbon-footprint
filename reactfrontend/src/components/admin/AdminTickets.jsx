import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  MessageCircle, Eye, RefreshCw, Search, Filter,
  Check, X, AlertCircle, Clock, User, Mail,
  ChevronRight, Trash2, Send, Plus, AlertTriangle
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

const AdminTickets = () => {
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, active: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const loadStats = async () => {
    try {
      const response = await axiosClient.get('/tickets/admin/stats');
      if (response.data.success) {
        setStats({
          total: response.data.total || 0,
          open: response.data.open || 0,
          inProgress: response.data.inProgress || 0,
          resolved: response.data.resolved || 0,
          active: response.data.active || 0,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTickets = async (page = 0) => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/tickets/admin/all?page=${page}&size=${pagination.pageSize}`);
      if (response.data.success) {
        setTickets(response.data.tickets || []);
        setPagination({
          currentPage: response.data.currentPage || 0,
          totalPages: response.data.totalPages || 0,
          totalElements: response.data.totalElements || 0,
          pageSize: pagination.pageSize,
        });
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      showToast('error', 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadTickets();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmDelete({ show: false, id: null });
    };
    if (confirmDelete.show) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete.show]);

  const getStatusPill = (status) => {
    const map = {
      'OPEN':        { cls: 'ui-pill--warn',    label: t('support.statusOpen') },
      'IN_PROGRESS': { cls: 'ui-pill--info',    label: t('support.statusInProgress') },
      'PENDING':     { cls: 'ui-pill--warn',    label: t('support.statusPending') },
      'RESOLVED':    { cls: 'ui-pill--success', label: t('support.statusResolved') },
      'CLOSED':      { cls: 'ui-pill--neutral', label: t('support.statusClosed') },
    };
    const s = map[status] || map['OPEN'];
    return (
      <span className={`ui-pill ${s.cls}`}>
        <span className="ui-pill__dot" />
        {s.label}
      </span>
    );
  };

  const getPriorityPill = (priority) => {
    const map = {
      'LOW':    { cls: 'ui-pill--success', label: t('support.low') },
      'MEDIUM': { cls: 'ui-pill--warn',    label: t('support.medium') },
      'HIGH':   { cls: 'ui-pill--danger',  label: t('support.high') },
    };
    const s = map[priority] || map['LOW'];
    return <span className={`ui-pill ${s.cls}`}>{s.label}</span>;
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowDetail(true);
  };

  const handleReply = async (ticketId) => {
    if (!replyMessage.trim()) {
      showToast('error', t('ticketDetail.replyError'));
      return;
    }

    try {
      const response = await axiosClient.post(`/tickets/${ticketId}/reply`, {
        ticketId: ticketId,
        message: replyMessage,
      });

      if (response.data.success) {
        showToast('success', `✅ ${t('ticketDetail.replySent')}`);
        setReplyMessage('');
        await loadTickets();
        await loadStats();
        const ticketRes = await axiosClient.get(`/tickets/${ticketId}`);
        if (ticketRes.data.success) {
          setSelectedTicket(ticketRes.data.ticket);
        }
        window.dispatchEvent(new Event('ticketReplied'));
      } else {
        showToast('error', response.data.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast('error', t('ticketDetail.replyError'));
    }
  };

  const handleUpdateStatus = async (ticketId, status) => {
    try {
      const response = await axiosClient.put(`/tickets/${ticketId}/status`, {
        ticketId: ticketId,
        status: status,
      });

      if (response.data.success) {
        showToast('success', `✅ ${t('support.statusUpdated')} ${status}`);
        await loadTickets();
        await loadStats();
        const ticketRes = await axiosClient.get(`/tickets/${ticketId}`);
        if (ticketRes.data.success) {
          setSelectedTicket(ticketRes.data.ticket);
        }
        window.dispatchEvent(new Event('ticketStatusChanged'));
      } else {
        showToast('error', response.data.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('error', t('common.error'));
    }
  };

  const requestDeleteTicket = (id) => setConfirmDelete({ show: true, id });
  const closeConfirmDelete = () => setConfirmDelete({ show: false, id: null });

  const executeDeleteTicket = async () => {
    const ticketId = confirmDelete.id;
    if (!ticketId) return;

    try {
      const response = await axiosClient.delete(`/tickets/admin/${ticketId}`);
      if (response.data.success) {
        showToast('success', `✅ ${t('support.ticketDeleted')}`);
        setShowDetail(false);
        await loadTickets();
        await loadStats();
      } else {
        showToast('error', response.data.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error deleting ticket:', error);
      showToast('error', t('common.error'));
    } finally {
      closeConfirmDelete();
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.userName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
              <div className="ui-hero__icon"><MessageCircle size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.tickets.title')}</h1>
                <p className="ui-hero__subtitle--compact">
                  {stats.total} {t('admin.tickets.totalTickets')} • {stats.active} {t('admin.tickets.active')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={() => { loadTickets(); loadStats(); }}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: stat cards --- */}
        <div className="admin-tickets-stats" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><MessageCircle size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.total}</div>
            <div className="ui-stat__label">{t('admin.tickets.total')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><AlertCircle size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.open}</div>
            <div className="ui-stat__label">{t('admin.tickets.open')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Clock size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.inProgress}</div>
            <div className="ui-stat__label">{t('admin.tickets.inProgress')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Check size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.resolved}</div>
            <div className="ui-stat__label">{t('admin.tickets.resolved')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--neutral"><Filter size={20} /></div>
            </div>
            <div className="ui-stat__value">{stats.active}</div>
            <div className="ui-stat__label">{t('admin.tickets.active')}</div>
          </div>
        </div>

        {/* --- UI: filters --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('admin.tickets.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ui-input"
                style={{ paddingLeft: 36 }}
              />
            </div>
            <div style={{ minWidth: 150 }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="ui-select"
              >
                <option value="all">{t('support.allStatus')}</option>
                <option value="OPEN">{t('support.statusOpen')}</option>
                <option value="IN_PROGRESS">{t('support.statusInProgress')}</option>
                <option value="PENDING">{t('support.statusPending')}</option>
                <option value="RESOLVED">{t('support.statusResolved')}</option>
                <option value="CLOSED">{t('support.statusClosed')}</option>
              </select>
            </div>
            <div style={{ minWidth: 150 }}>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="ui-select"
              >
                <option value="all">{t('support.allPriority')}</option>
                <option value="HIGH">{t('support.high')}</option>
                <option value="MEDIUM">{t('support.medium')}</option>
                <option value="LOW">{t('support.low')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {filteredTickets.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><MessageCircle size={28} /></div>
              <p className="ui-state__title">{t('admin.tickets.noTickets')}</p>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('admin.tickets.id')}</th>
                    <th>{t('admin.tickets.user')}</th>
                    <th>{t('admin.tickets.subject')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.tickets.priority')}</th>
                    <th style={{ textAlign: 'center' }}>{t('admin.tickets.status')}</th>
                    <th>{t('common.created')}</th>
                    <th style={{ textAlign: 'center' }}>{t('support.replies')}</th>
                    <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-strong)' }}>#{ticket.ticketId}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <User size={14} color="var(--text-muted)" />
                          <span style={{ fontWeight: 500 }}>{ticket.userName}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{ticket.subject}</td>
                      <td style={{ textAlign: 'center' }}>{getPriorityPill(ticket.priority)}</td>
                      <td style={{ textAlign: 'center' }}>{getStatusPill(ticket.status)}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{ticket.replyCount || 0}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => handleViewTicket(ticket)}
                          className="ui-btn ui-btn--primary ui-btn--sm"
                        >
                          <Eye size={14} />
                          {t('admin.tickets.view')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)',
            flexWrap: 'wrap', gap: 12,
          }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {t('support.showing')} {pagination.currentPage * pagination.pageSize + 1} to {Math.min((pagination.currentPage + 1) * pagination.pageSize, pagination.totalElements)} of {pagination.totalElements}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => loadTickets(i)}
                  className={`ui-btn ui-btn--sm ${pagination.currentPage === i ? 'ui-btn--primary' : 'ui-btn--secondary'}`}
                  style={{ minWidth: 36 }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* --- UI: ticket detail modal --- */}
      {showDetail && selectedTicket && (
        <div className="app-confirm-overlay" onClick={() => setShowDetail(false)}>
          <div className="ticket-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ui-card__head" style={{ marginBottom: 20 }}>
              <div>
                <h2 className="ui-card__title">#{selectedTicket.ticketId}</h2>
                <p className="ui-card__subtitle">{selectedTicket.subject}</p>
              </div>
              <button className="ui-modal__close" onClick={() => setShowDetail(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Info grid */}
            <div className="ticket-info-grid">
              <div>
                <p className="ui-eyebrow">{t('admin.tickets.user')}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedTicket.userName}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{selectedTicket.userEmail}</p>
              </div>
              <div>
                <p className="ui-eyebrow">{t('admin.tickets.category')}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', margin: '4px 0 0' }}>{selectedTicket.category}</p>
              </div>
              <div>
                <p className="ui-eyebrow">{t('admin.tickets.priority')}</p>
                <div style={{ marginTop: 4 }}>{getPriorityPill(selectedTicket.priority)}</div>
              </div>
              <div>
                <p className="ui-eyebrow">{t('admin.tickets.status')}</p>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateStatus(selectedTicket.id, e.target.value)}
                  className="ui-select"
                  style={{ marginTop: 4, padding: '6px 10px', fontSize: 13 }}
                >
                  <option value="OPEN">{t('support.statusOpen')}</option>
                  <option value="IN_PROGRESS">{t('support.statusInProgress')}</option>
                  <option value="PENDING">{t('support.statusPending')}</option>
                  <option value="RESOLVED">{t('support.statusResolved')}</option>
                  <option value="CLOSED">{t('support.statusClosed')}</option>
                </select>
              </div>
              <div>
                <p className="ui-eyebrow">{t('common.created')}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{new Date(selectedTicket.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="ui-eyebrow">{t('common.updated')}</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>{new Date(selectedTicket.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Description */}
            <div style={{ marginTop: 16 }}>
              <p className="ui-eyebrow" style={{ marginBottom: 6 }}>{t('ticketDetail.description')}</p>
              <div style={{
                padding: '12px 16px',
                background: 'var(--bg-subtle)',
                borderRadius: 8,
                fontSize: 14,
                color: 'var(--text-body)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {selectedTicket.description}
              </div>
            </div>

            {/* Conversation */}
            {selectedTicket.replies && selectedTicket.replies.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p className="ui-eyebrow" style={{ marginBottom: 12 }}>
                  {t('ticketDetail.conversation', selectedTicket.replies.length)}
                </p>
                <div className="ui-scroll" style={{ maxHeight: 260, overflowY: 'auto', paddingRight: 6 }}>
                  {selectedTicket.replies.map((reply, index) => (
                    <div
                      key={index}
                      className={`ticket-reply ${reply.admin ? 'ticket-reply--admin' : 'ticket-reply--user'}`}
                    >
                      <div className="ticket-reply__head">
                        <span className="ticket-reply__author">
                          {reply.admin ? '🛡️ ' + t('ticketDetail.admin') : reply.userName}
                        </span>
                        <span className="ticket-reply__time">{reply.timeAgo}</span>
                      </div>
                      <p className="ticket-reply__message">{reply.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reply input */}
            <div style={{ marginTop: 16 }}>
              <p className="ui-eyebrow" style={{ marginBottom: 6 }}>{t('ticketDetail.addReply')}</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder={t('ticketDetail.typeReply')}
                  rows="2"
                  className="ui-textarea"
                  style={{ flex: 1 }}
                />
                <button
                  onClick={() => handleReply(selectedTicket.id)}
                  className="ui-btn ui-btn--primary ui-btn--lg"
                  style={{ alignSelf: 'flex-end' }}
                >
                  <Send size={16} />
                  {t('ticketDetail.sendReply')}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex', gap: 10, marginTop: 20,
              paddingTop: 16, borderTop: '1px solid var(--border)',
              flexWrap: 'wrap',
            }}>
              <button
                onClick={() => handleUpdateStatus(selectedTicket.id, 'RESOLVED')}
                className="ui-btn ui-btn--primary"
              >
                <Check size={16} />
                {t('admin.tickets.markResolved')}
              </button>
              <button
                onClick={() => handleUpdateStatus(selectedTicket.id, 'CLOSED')}
                className="ui-btn ui-btn--secondary"
              >
                <X size={16} />
                {t('admin.tickets.closeTicket')}
              </button>
              <button
                onClick={() => requestDeleteTicket(selectedTicket.id)}
                className="ui-btn ui-btn--danger"
              >
                <Trash2 size={16} />
                {t('common.delete')}
              </button>
              <button
                onClick={() => setShowDetail(false)}
                className="ui-btn ui-btn--ghost"
                style={{ marginLeft: 'auto' }}
              >
                {t('common.close')}
              </button>
            </div>
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
            <h2 className="app-confirm__title">Delete this ticket?</h2>
            <p className="app-confirm__text">This action cannot be undone.</p>
            <div className="app-confirm__actions">
              <button type="button" className="app-confirm__cancel" onClick={closeConfirmDelete}>Cancel</button>
              <button type="button" className="app-confirm__danger" onClick={executeDeleteTicket}>
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

        .admin-tickets-stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }

        .ticket-detail-modal {
          width: 100%; max-width: 720px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 28px;
          max-height: 90vh; overflow-y: auto;
          box-shadow: 0 25px 60px rgba(0,0,0,.28);
          animation: confirmPop .28s var(--ease-pop) both;
        }

        .ticket-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 16px;
          background: var(--bg-subtle);
          border-radius: 10px;
        }

        .ticket-reply {
          padding: 10px 14px;
          margin-bottom: 8px;
          border-radius: 8px;
          border-left: 3px solid;
        }
        .ticket-reply--admin { background: rgba(59,130,246,.08); border-left-color: #3b82f6; }
        .ticket-reply--user  { background: var(--bg-subtle); border-left-color: var(--green-600); }
        .ticket-reply__head { display: flex; justify-content: space-between; margin-bottom: 4px; gap: 8px; flex-wrap: wrap; }
        .ticket-reply__author { font-size: 12px; font-weight: 700; color: var(--text-strong); }
        .ticket-reply__time { font-size: 11px; color: var(--text-muted); }
        .ticket-reply__message { font-size: 13px; color: var(--text-body); margin: 0; line-height: 1.5; }

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

        @media (max-width: 1200px) { .admin-tickets-stats { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (max-width: 900px) { .admin-tickets-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .admin-tickets-stats { grid-template-columns: minmax(0, 1fr); }
          .ticket-info-grid { grid-template-columns: minmax(0, 1fr); }
          .ticket-detail-modal { padding: 20px; }
        }
      `}</style>
    </Layout>
  );
};

export default AdminTickets;