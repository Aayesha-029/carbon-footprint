import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Clock, AlertCircle, Check, X, Eye,
  Search, Filter, ChevronDown, ChevronUp,
  RefreshCw, MessageCircle
} from 'lucide-react';

const MyTickets = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    pageSize: 10,
  });

  const loadTickets = async (page = 0) => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/tickets/user?page=${page}&size=${pagination.pageSize}`);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const getStatusStyle = (status) => {
    const styles = {
      'OPEN':        { bg: 'rgba(245,158,11,.14)', color: '#b45309', border: 'rgba(245,158,11,.28)', label: t('support.statusOpen'),       icon: <AlertCircle size={12} /> },
      'IN_PROGRESS': { bg: 'rgba(59,130,246,.14)', color: '#1d4ed8', border: 'rgba(59,130,246,.28)', label: t('support.statusInProgress'), icon: <Clock size={12} /> },
      'PENDING':     { bg: 'rgba(245,158,11,.14)', color: '#b45309', border: 'rgba(245,158,11,.28)', label: t('support.statusPending'),    icon: <Clock size={12} /> },
      'RESOLVED':    { bg: 'rgba(34,197,94,.14)',  color: '#15803d', border: 'rgba(34,197,94,.28)',  label: t('support.statusResolved'),   icon: <Check size={12} /> },
      'CLOSED':      { bg: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-fg)', border: 'var(--border)', label: t('support.statusClosed'), icon: <X size={12} /> },
    };
    return styles[status] || styles['OPEN'];
  };

  const getStatusBadge = (status) => {
    const s = getStatusStyle(status);
    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: 12,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 12,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
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
        padding: '2px 10px',
        borderRadius: 10,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 11,
        fontWeight: 700,
      }}>
        {s.label}
      </span>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleViewTicket = (id) => {
    navigate(`/support/ticket/${id}`);
  };

  if (loading) {
    return (
      <div className="ui-state">
        <div className="ui-spinner" />
        <p className="ui-state__text">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="ui-card ui-card--pad-lg">
      <div className="ui-card__head">
        <div>
         <h3 className="ui-card__title">
  <MessageCircle size={18} color="var(--green-600)" />
  {t('bannerTitles.myTickets')}
</h3>
          <p className="ui-card__subtitle">
            {pagination.totalElements} {t('support.totalTickets')}
          </p>
        </div>
        <div className="ui-card__actions">
          <button
            onClick={() => loadTickets()}
            className="ui-btn ui-btn--secondary ui-btn--sm"
          >
            <RefreshCw size={16} />
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap',
        marginBottom: 20,
        padding: 12,
        background: 'var(--bg-subtle)',
        borderRadius: 12,
        border: '1px solid var(--border)',
      }}>
        <div style={{ flex: 1, minWidth: 180, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ui-input"
            style={{ paddingLeft: 34 }}
          />
        </div>
        <div style={{ minWidth: 150 }}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="ui-select"
          >
            <option value="all">{t('support.allStatus') || 'All Status'}</option>
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
            <option value="all">{t('support.allPriority') || 'All Priority'}</option>
            <option value="HIGH">{t('support.high')}</option>
            <option value="MEDIUM">{t('support.medium')}</option>
            <option value="LOW">{t('support.low')}</option>
          </select>
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="ui-state">
          <div className="ui-state__icon"><MessageCircle size={28} /></div>
          <p className="ui-state__title">{t('support.noTickets')}</p>
          <p className="ui-state__text">
            {tickets.length === 0 ? t('support.noTicketsCreated') : t('support.adjustFilters')}
          </p>
        </div>
      ) : (
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>{t('support.ticketId')}</th>
                <th>{t('support.subject')}</th>
                <th>{t('support.category')}</th>
                <th style={{ textAlign: 'center' }}>{t('support.priority')}</th>
                <th style={{ textAlign: 'center' }}>{t('common.status')}</th>
                <th>{t('common.created')}</th>
                <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-strong)' }}>
                    #{ticket.ticketId}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {ticket.subject}
                    {ticket.replyCount > 0 && (
                      <span className="ui-pill ui-pill--info" style={{ marginLeft: 8 }}>
                        {ticket.replyCount} {t('support.replies')}
                      </span>
                    )}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>
                    {ticket.category}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {getPriorityBadge(ticket.priority)}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => handleViewTicket(ticket.id)}
                      className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                      style={{ color: 'var(--green-600)' }}
                      title={t('support.viewDetails')}
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: 12,
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
  );
};

export default MyTickets;