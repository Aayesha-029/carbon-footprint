import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import { User, Award, Flame, Activity, Star, Edit, Save, X, RefreshCw } from 'lucide-react';

const Profile = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [toast, setToast] = useState({ type: '', message: '' });

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    return { userId };
  };

  const loadProfile = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.get(`/profile/user/${userId}`);
      setProfile(response.data);
      setFormData(response.data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    const { userId } = getCurrentUser();
    try {
      const response = await axiosClient.put(`/profile/user/${userId}`, formData);
      setProfile(response.data);
      setIsEditing(false);
      showToast('success', t('profile.updated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('error', 'Failed to update profile');
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 3000);
  };

  if (loading) {
    return (
      <Layout userRole="user">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout userRole="user">
        <div className="ui-state">
          <div className="ui-state__icon"><User size={28} /></div>
          <p className="ui-state__text">{t('common.noData')}</p>
        </div>
      </Layout>
    );
  }

  const getScoreEmoji = (score) => {
    if (score >= 90) return '🌟';
    if (score >= 70) return '⭐';
    if (score >= 50) return '💪';
    return '🌱';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return t('dashboard.excellent');
    if (score >= 70) return t('dashboard.good');
    if (score >= 50) return t('dashboard.fair');
    return t('dashboard.needsImprovement');
  };

  return (
    <Layout userRole="user">
      {/* Toast */}
      {toast.message && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          padding: '16px 24px', borderRadius: 12,
          background: toast.type === 'success' ? 'var(--pill-success-bg)' : 'var(--pill-danger-bg)',
          border: `1px solid ${toast.type === 'success' ? 'var(--tint-border)' : 'rgba(239,68,68,.28)'}`,
          color: toast.type === 'success' ? 'var(--pill-success-fg)' : 'var(--pill-danger-fg)',
          boxShadow: '0 10px 40px rgba(0,0,0,.15)',
          fontSize: 14, fontWeight: 600,
          animation: 'slideInRight .4s var(--ease-out)',
        }}>
          {toast.message}
        </div>
      )}

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><User size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.myProfile')}</h1>
                <p className="ui-hero__subtitle ui-hero__subtitle--compact">
                  {t('profile.description')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadProfile}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        <div className="ui-card ui-card--pad-lg" style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div
              style={{
                width: 108,
                height: 108,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #22c55e, #15803d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 48,
                color: '#ffffff',
                margin: '0 auto',
                boxShadow: '0 10px 30px rgba(22,163,74,.35)',
                fontWeight: 800,
              }}
            >
              {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            {isEditing ? (
              <div>
                <div className="ui-field">
                  <label className="ui-field__label">{t('profile.fullName')}</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="ui-input"
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-field__label">{t('profile.bio')}</label>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="ui-textarea"
                    rows="3"
                    placeholder={t('profile.bioPlaceholder')}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={handleSave} className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block">
                    <Save size={16} />
                    {t('common.save')}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setFormData(profile); }}
                    className="ui-btn ui-btn--secondary ui-btn--lg ui-btn--block"
                  >
                    <X size={16} />
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <h2 className="profile-name">{profile.fullName}</h2>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>{profile.email}</p>
                    {profile.bio && (
                      <p style={{ fontSize: 14, color: 'var(--text-body)', marginTop: 8, lineHeight: 1.55 }}>{profile.bio}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="ui-btn ui-btn--secondary"
                  >
                    <Edit size={16} />
                    {t('profile.edit')}
                  </button>
                </div>
                <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {profile.preferredUnits && (
                    <span className="ui-pill ui-pill--neutral">
                      {t('profile.units')}: {profile.preferredUnits}
                    </span>
                  )}
                  {profile.dietType && (
                    <span className="ui-pill ui-pill--neutral">
                      {t('profile.diet')}: {profile.dietType}
                    </span>
                  )}
                  {profile.primaryTransportMode && (
                    <span className="ui-pill ui-pill--neutral">
                      {t('profile.transportMode')}: {profile.primaryTransportMode}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="ui-grid ui-grid--2" style={{ gap: 16 }}>
            <div className="profile-stat" style={{ borderTop: '3px solid #ef4444' }}>
              <div className="profile-stat__head">
                <Flame size={16} color="#ef4444" />
                <p className="profile-stat__label">{t('profile.totalCO2')}</p>
              </div>
              <h3 className="profile-stat__value">{profile.totalCO2e || 0} kg</h3>
              <span className="profile-stat__hint">{t('profile.carbonFootprint')}</span>
            </div>
            <div className="profile-stat" style={{ borderTop: '3px solid #3b82f6' }}>
              <div className="profile-stat__head">
                <Activity size={16} color="#3b82f6" />
                <p className="profile-stat__label">{t('profile.activities')}</p>
              </div>
              <h3 className="profile-stat__value">{profile.totalActivities || 0}</h3>
              <span className="profile-stat__hint">{t('profile.totalLogged')}</span>
            </div>
            <div className="profile-stat" style={{ borderTop: '3px solid #f59e0b' }}>
              <div className="profile-stat__head">
                <Award size={16} color="#f59e0b" />
                <p className="profile-stat__label">{t('profile.badges')}</p>
              </div>
              <h3 className="profile-stat__value">{profile.badgeCount || 0}</h3>
              <span className="profile-stat__hint">{t('profile.achievements')}</span>
            </div>
            <div className="profile-stat" style={{ borderTop: '3px solid #8b5cf6' }}>
              <div className="profile-stat__head">
                <Star size={16} color="#8b5cf6" />
                <p className="profile-stat__label">{t('profile.carbonScore')}</p>
              </div>
              <h3 className="profile-stat__value">
                {profile.carbonScore || 0} {getScoreEmoji(profile.carbonScore || 0)}
              </h3>
              <span className="profile-stat__hint">{getScoreLabel(profile.carbonScore || 0)}</span>
            </div>
          </div>
        </div>
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
        .profile-name {
          font-size: 26px;
          font-weight: 800;
          letter-spacing: -0.6px;
          color: var(--text-strong);
          margin: 0;
          line-height: 1.2;
        }
        .profile-stat {
          padding: 16px;
          background: var(--bg-subtle);
          border-radius: 12px;
          text-align: center;
        }
        .profile-stat__head {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-bottom: 6px;
        }
        .profile-stat__label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .04em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin: 0;
        }
        .profile-stat__value {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-strong);
          letter-spacing: -0.5px;
          margin: 0;
        }
        .profile-stat__hint {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
          .profile-name { font-size: 22px; }
          .ui-grid--2 { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default Profile;