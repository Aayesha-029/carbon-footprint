import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  ArrowLeft, Send, Check, X, AlertCircle, Clock,
  User, Mail, Calendar, MessageCircle, RefreshCw,
  FileText, Image, Download
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
    error: { background: 'var(--pill-danger-bg)', border: '1px solid rgba(239,68,68,.28)', color: 'var(--pill-danger-fg)', icon: <X size={20} /> },
    info: { background: 'var(--pill-info-bg)', border: '1px solid rgba(59,130,246,.28)', color: 'var(--pill-info-fg)', icon: <AlertCircle size={20} /> }
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      padding: '16px 24px', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,.15)',
      display: 'flex', alignItems: 'center', gap: 12, minWidth: 320, maxWidth: 500,
      animation: 'slideInRight .4s var(--ease-out)', ...style
    }}>
      {style.icon}
      <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'inherit', opacity: .6, padding: 4 }}>×</button>
    </div>
  );
};

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/tickets/${id}`);
      if (response.data.success) {
        setTicket(response.data.ticket);
      } else {
        showToast('error', t('common.error'));
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
      showToast('error', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) {
      showToast('error', t('ticketDetail.replyError'));
      return;
    }

    setSubmitting(true);
    try {
      const response = await axiosClient.post(`/tickets/${id}/reply`, {
        ticketId: parseInt(id),
        message: replyMessage,
      });

      if (response.data.success) {
        showToast('success', '✅ ' + t('ticketDetail.replySent'));
        setReplyMessage('');
        await loadTicket();
        window.dispatchEvent(new Event('ticketReplied'));
      } else {
        showToast('error', response.data.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      showToast('error', t('ticketDetail.replyError'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    const styles = {
      'OPEN':        { bg: 'rgba(245,158,11,.14)', color: '#b45309', border: 'rgba(245,158,11,.28)', label: t('support.statusOpen'),       icon: <AlertCircle size={14} /> },
      'IN_PROGRESS': { bg: 'rgba(59,130,246,.14)', color: '#1d4ed8', border: 'rgba(59,130,246,.28)', label: t('support.statusInProgress'), icon: <Clock size={14} /> },
      'PENDING':     { bg: 'rgba(245,158,11,.14)', color: '#b45309', border: 'rgba(245,158,11,.28)', label: t('support.statusPending'),    icon: <Clock size={14} /> },
      'RESOLVED':    { bg: 'rgba(34,197,94,.14)',  color: '#15803d', border: 'rgba(34,197,94,.28)',  label: t('support.statusResolved'),   icon: <Check size={14} /> },
      'CLOSED':      { bg: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-fg)', border: 'var(--border)', label: t('support.statusClosed'), icon: <X size={14} /> },
    };
    return styles[status] || styles['OPEN'];
  };

  const getStatusBadge = (status) => {
    const s = getStatusStyle(status);
    return (
      <span style={{
        padding: '6px 14px',
        borderRadius: 20,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 13,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}>
        {s.icon}
        {s.label}
      </span>
    );
  };

  const getPriorityStyle = (priority) => {
    const colors = {
      'LOW':    { bg: 'rgba(34,197,94,.14)',  color: '#15803d', border: 'rgba(34,197,94,.28)',  label: t('support.low') },
      'MEDIUM': { bg: 'rgba(245,158,11,.14)', color: '#b45309', border: 'rgba(245,158,11,.28)', label: t('support.medium') },
      'HIGH':   { bg: 'rgba(239,68,68,.14)',  color: '#b91c1c', border: 'rgba(239,68,68,.28)',  label: t('support.high') },
    };
    return colors[priority] || colors['LOW'];
  };

  const getPriorityBadge = (priority) => {
    const s = getPriorityStyle(priority);
    return (
      <span style={{
        padding: '3px 12px',
        borderRadius: 12,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 12,
        fontWeight: 700,
      }}>
        {s.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout userRole="user">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('ticketDetail.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!ticket) {
    return (
      <Layout userRole="user">
        <div className="ui-state">
          <div className="ui-state__icon"><AlertCircle size={28} /></div>
          <p className="ui-state__text">{t('ticketDetail.notFound')}</p>
          <div className="ui-state__actions">
            <button className="ui-btn ui-btn--primary" onClick={() => navigate('/support')}>
              <ArrowLeft size={16} />
              {t('support.myTickets')}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="user">
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
<h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.ticketDetails')}</h1>                <p className="ui-hero__subtitle ui-hero__compact">
                  #{ticket.ticketId} — {ticket.subject}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button
                className="ui-btn ui-btn--hero-ghost"
                onClick={() => navigate('/support')}
              >
                <ArrowLeft size={16} />
                {t('common.back') || 'Back'}
              </button>
              <button className="ui-btn ui-btn--hero" onClick={loadTicket}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: metadata card --- */}
        <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 24 }}>
          <div className="ticket-meta-grid">
            <div>
              <p className="ticket-meta__label">{t('ticketDetail.category')}</p>
              <p className="ticket-meta__value">{ticket.category}</p>
            </div>
            <div>
              <p className="ticket-meta__label">{t('ticketDetail.priority')}</p>
              <div style={{ marginTop: 4 }}>{getPriorityBadge(ticket.priority)}</div>
            </div>
            <div>
              <p className="ticket-meta__label">{t('ticketDetail.status')}</p>
              <div style={{ marginTop: 4 }}>{getStatusBadge(ticket.status)}</div>
            </div>
            <div>
              <p className="ticket-meta__label">{t('ticketDetail.created')}</p>
              <p className="ticket-meta__value ticket-meta__value--muted">
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="ticket-meta__label">{t('ticketDetail.updated')}</p>
              <p className="ticket-meta__value ticket-meta__value--muted">
                {new Date(ticket.updatedAt).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="ticket-meta__label">{t('ticketDetail.replies')}</p>
              <p className="ticket-meta__value" style={{ fontWeight: 800, color: 'var(--green-700)' }}>
                {ticket.replies?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* --- UI: description card --- */}
        <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 24 }}>
          <h3 className="ui-card__title" style={{ marginBottom: 12 }}>
            <FileText size={18} color="var(--green-600)" />
            {t('ticketDetail.description')}
          </h3>
          <div style={{
            padding: 16,
            background: 'var(--bg-subtle)',
            borderRadius: 10,
            fontSize: 15,
            color: 'var(--text-body)',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
          }}>
            {ticket.description}
          </div>
        </div>

        {/* --- UI: conversation card --- */}
        <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 24 }}>
          <h3 className="ui-card__title" style={{ marginBottom: 16 }}>
            <MessageCircle size={18} color="var(--green-600)" />
            {t('ticketDetail.conversation', ticket.replies?.length || 0)}
          </h3>

          {ticket.replies && ticket.replies.length > 0 ? (
            <div className="ui-scroll" style={{ maxHeight: 460, overflowY: 'auto', paddingRight: 6 }}>
              {ticket.replies.map((reply, index) => (
                <div
                  key={index}
                  className={`ticket-reply ${reply.admin ? 'ticket-reply--admin' : 'ticket-reply--user'}`}
                >
                  <div className="ticket-reply__head">
                    <span className="ticket-reply__author">
                      {reply.admin ? '🛡️ ' + t('ticketDetail.admin') : reply.userName}
                      {reply.admin && (
                        <span className="ui-pill ui-pill--info" style={{ fontSize: 10, padding: '1px 8px' }}>
                          {t('ticketDetail.supportTeam')}
                        </span>
                      )}
                    </span>
                    <span className="ticket-reply__time">{reply.timeAgo}</span>
                  </div>
                  <p className="ticket-reply__message">{reply.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="ui-state" style={{ padding: '30px 20px' }}>
              <div className="ui-state__icon" style={{ width: 54, height: 54, fontSize: 22 }}>
                <MessageCircle size={22} />
              </div>
              <p className="ui-state__title" style={{ fontSize: 16 }}>{t('ticketDetail.noReplies')}</p>
              <p className="ui-state__text">{t('ticketDetail.startConversation')}</p>
            </div>
          )}
        </div>

        {/* --- UI: reply form --- */}
        {ticket.status !== 'CLOSED' && ticket.status !== 'RESOLVED' && (
          <div className="ui-card ui-card--pad-lg">
            <h3 className="ui-card__title" style={{ marginBottom: 12 }}>
              <Send size={18} color="var(--green-600)" />
              {t('ticketDetail.addReply')}
            </h3>
            <form onSubmit={handleReply}>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={t('ticketDetail.typeReply')}
                rows="3"
                required
                className="ui-textarea"
                style={{ marginBottom: 12 }}
              />
              <button
                type="submit"
                disabled={submitting}
                className="ui-btn ui-btn--primary ui-btn--lg"
              >
                {submitting ? (
                  <>
                    <span className="ui-btn__spinner" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    {t('ticketDetail.sendReply')}
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {ticket.status === 'CLOSED' && (
          <div className="ui-card ui-card--pad-lg" style={{ textAlign: 'center', background: 'var(--bg-subtle)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 500, margin: 0 }}>
              {t('ticketDetail.closed')}
            </p>
          </div>
        )}
      </div>

      <style>{`
        .ui-hero__title--module {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.6px;
          line-height: 1.15;
          color: #ffffff;
          margin: 0 0 4px;
        }
        .ui-hero__subtitle--compact {
          font-size: 14.5px;
          font-weight: 500;
          line-height: 1.5;
          color: rgba(255,255,255,.90);
          margin: 0;
          max-width: 62ch;
        }

        /* Metadata grid */
        .ticket-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }
        .ticket-meta__label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: .06em;
          margin: 0;
        }
        .ticket-meta__value {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-strong);
          margin: '4px 0 0';
          margin-top: 4px;
        }
        .ticket-meta__value--muted {
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Replies */
        .ticket-reply {
          padding: 14px 18px;
          margin-bottom: 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .ticket-reply--admin {
          background: rgba(59,130,246,.06);
          border-color: rgba(59,130,246,.22);
          border-left: 4px solid #3b82f6;
        }
        .ticket-reply--user {
          background: var(--bg-subtle);
          border-left: 4px solid var(--green-600);
        }
        .ticket-reply__head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .ticket-reply__author {
          font-size: 13px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-strong);
        }
        .ticket-reply--admin .ticket-reply__author {
          color: #1d4ed8;
        }
        .ticket-reply__time {
          font-size: 12px;
          color: var(--text-muted);
        }
        .ticket-reply__message {
          font-size: 14px;
          color: var(--text-body);
          margin: 0;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
          .ticket-meta-grid { grid-template-columns: 1fr; gap: 14px; }
        }
      `}</style>
    </Layout>
  );
};

export default TicketDetail;