import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import { Users, Search, UserPlus, RefreshCw, UserCheck, UserX } from 'lucide-react';
import InviteModal from './InviteModal';

const OrganizerMembers = () => {
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ currentPage: 0, totalPages: 0, totalElements: 0 });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [orgId, setOrgId] = useState(null);

  const loadMembers = async (page = 0) => {
    try {
      setLoading(true);
      // First get org ID
      if (!orgId) {
        const orgRes = await axiosClient.get('/organizations/me');
        setOrgId(orgRes.data.id);
        // reload with orgId
      }
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page);
      params.append('size', 10);

      const res = await axiosClient.get(`/organizations/${orgId}/members?${params.toString()}`);
      setMembers(res.data.content || []);
      setPagination({
        currentPage: res.data.currentPage || 0,
        totalPages: res.data.totalPages || 0,
        totalElements: res.data.totalElements || 0,
      });
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orgId) {
      loadMembers();
    } else {
      // fetch org id
      axiosClient.get('/organizations/me').then(res => {
        setOrgId(res.data.id);
      }).catch(console.error);
    }
  }, [orgId]);

  useEffect(() => {
    if (orgId) {
      loadMembers(0);
    }
  }, [search, statusFilter, orgId]);

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    loadMembers(0);
  };

  if (loading && members.length === 0) {
    return (
      <Layout userRole="organizer">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole="organizer">
      <div style={{ animation: 'fadeInUp 0.4s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a' }}>👥 {t('organizer.members.title')}</h1>
            <p style={{ color: '#64748b', fontSize: '15px' }}>{pagination.totalElements} members</p>
          </div>
          <button onClick={() => setShowInviteModal(true)} style={{ padding: '10px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Invite Member
          </button>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input type="text" placeholder={t('common.search')} value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px 10px 40px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }} />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#ffffff' }}>
            <option value="all">{t('organizer.members.all')}</option>
            <option value="ACTIVE">{t('organizer.members.active')}</option>
            <option value="PENDING">{t('organizer.members.pending')}</option>
            <option value="INACTIVE">{t('organizer.members.inactive')}</option>
          </select>
          <button onClick={() => loadMembers(0)} style={{ padding: '10px 14px', background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <RefreshCw size={18} />
          </button>
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Users size={48} color="#94a3b8" style={{ display: 'block', margin: '0 auto 12px' }} />
              <p style={{ color: '#64748b' }}>No members found</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Joined At</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.userId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500 }}>{member.fullName}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{member.email}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 600,
                          background: member.status === 'ACTIVE' ? '#dcfce7' : member.status === 'PENDING' ? '#fef3c7' : '#fee2e2',
                          color: member.status === 'ACTIVE' ? '#16a34a' : member.status === 'PENDING' ? '#f59e0b' : '#dc2626',
                        }}>
                          {member.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: '#64748b' }}>
                        {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {member.status === 'ACTIVE' ? (
                          <button onClick={async () => {
                            try {
                              await axiosClient.put(`/organizations/${orgId}/members/${member.userId}/status?status=INACTIVE`);
                              loadMembers(pagination.currentPage);
                            } catch (err) { console.error(err); }
                          }} style={{ padding: '4px 12px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            Deactivate
                          </button>
                        ) : (
                          <button onClick={async () => {
                            try {
                              await axiosClient.put(`/organizations/${orgId}/members/${member.userId}/status?status=ACTIVE`);
                              loadMembers(pagination.currentPage);
                            } catch (err) { console.error(err); }
                          }} style={{ padding: '4px 12px', background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {pagination.totalPages > 1 && (
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[...Array(pagination.totalPages)].map((_, i) => (
                <button key={i} onClick={() => loadMembers(i)} style={{ padding: '6px 12px', border: pagination.currentPage === i ? '2px solid #16a34a' : '1px solid #e2e8f0', borderRadius: '6px', background: pagination.currentPage === i ? '#f0fdf4' : '#ffffff' }}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <InviteModal onClose={() => setShowInviteModal(false)} onSuccess={handleInviteSuccess} orgId={orgId} />
      )}
    </Layout>
  );
};

export default OrganizerMembers;