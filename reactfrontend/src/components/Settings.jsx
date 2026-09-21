import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Settings as SettingsIcon, Bell, Moon, Sun, Globe, Save,
  Trash2, AlertTriangle, RefreshCw, User, Shield,
  Check, X, AlertCircle, Edit2, Mail, Lock, Palette,
  Languages, Car, Zap, Utensils, ShoppingBag
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

const Settings = () => {
  const { t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [activeTab, setActiveTab] = useState('preferences');
  const [preferences, setPreferences] = useState({
    preferredUnits: 'METRIC',
    dietType: 'OMNIVORE',
    primaryTransportMode: 'CAR',
    energySource: 'GRID',
    notificationsEnabled: true,
    theme: 'light',
    language: 'en',
  });
  const [bio, setBio] = useState('');

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    return { userId };
  };

  const loadSettings = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.get(`/profile/user/${userId}`);
      setProfile(response.data);
      setBio(response.data.bio || '');

      if (response.data) {
        setPreferences({
          preferredUnits: response.data.preferredUnits || 'METRIC',
          dietType: response.data.dietType || 'OMNIVORE',
          primaryTransportMode: response.data.primaryTransportMode || 'CAR',
          energySource: response.data.energySource || 'GRID',
          notificationsEnabled: response.data.notificationsEnabled !== undefined ?
            response.data.notificationsEnabled : true,
          theme: response.data.theme || 'light',
          language: response.data.language || 'en',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showToast('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    const handleSettingsUpdated = () => {
      loadSettings();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, []);

  const handleSave = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      showToast('error', 'Please login first');
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        fullName: profile?.fullName,
        bio: bio,
        preferredUnits: preferences.preferredUnits,
        dietType: preferences.dietType,
        primaryTransportMode: preferences.primaryTransportMode,
        energySource: preferences.energySource,
        notificationsEnabled: preferences.notificationsEnabled,
        theme: preferences.theme,
        language: preferences.language,
      };

      const response = await axiosClient.put(`/profile/user/${userId}`, updateData);

      if (response.data) {
        setProfile(response.data);
        showToast('success', t('userSettings.saved'));
        if (response.data.fullName) {
          localStorage.setItem('userName', response.data.fullName);
        }
        window.dispatchEvent(new Event('profileUpdated'));
        window.dispatchEvent(new Event('settingsUpdated'));
        window.dispatchEvent(new Event('notificationReceived'));
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all your settings to default?')) return;

    const { userId } = getCurrentUser();
    if (!userId) {
      showToast('error', 'Please login first');
      return;
    }

    try {
      await axiosClient.post(`/profile/user/${userId}/reset`);
      await loadSettings();
      showToast('success', t('userSettings.resetSuccess'));
      window.dispatchEvent(new Event('settingsUpdated'));
      window.dispatchEvent(new Event('notificationReceived'));
    } catch (error) {
      console.error('Error resetting settings:', error);
      showToast('error', 'Failed to reset settings');
    }
  };

  const tabs = [
    { id: 'preferences', label: t('userSettings.preferences'), icon: <SettingsIcon size={17} /> },
    { id: 'profile', label: t('profile.title'), icon: <User size={17} /> },
    { id: 'account', label: t('userSettings.account'), icon: <Shield size={17} /> },
  ];

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
              <div className="ui-hero__icon"><SettingsIcon size={24} /></div>
              <div className="ui-hero__text">
<h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.settings')}</h1>                <p className="ui-hero__subtitle ui-hero__compact">
                  {t('userSettings.description')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero-ghost" onClick={handleReset}>
                <RefreshCw size={16} />
                {t('userSettings.resetButton')}
              </button>
              <button
                className="ui-btn ui-btn--hero"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="ui-btn__spinner" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {t('common.saveChanges')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: tab bar with prominent active state --- */}
        <div className="settings-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab ${activeTab === tab.id ? 'is-active' : ''}`}
            >
              <span className="settings-tab__icon">{tab.icon}</span>
              <span className="settings-tab__label">{tab.label}</span>
              {activeTab === tab.id && (
                <span className="settings-tab__dot" aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {/* --- UI: preferences tab --- */}
        {activeTab === 'preferences' && (
          <div className="ui-card ui-card--pad-lg" style={{ maxWidth: 820 }}>
            <h3 className="ui-card__title" style={{ marginBottom: 20 }}>
              <Globe size={18} color="var(--green-600)" />
              {t('userSettings.preferences')}
            </h3>

            <div className="ui-field">
              <label className="ui-field__label">{t('userSettings.preferredUnits')}</label>
              <select
                value={preferences.preferredUnits}
                onChange={(e) => setPreferences({ ...preferences, preferredUnits: e.target.value })}
                className="ui-select"
              >
                <option value="METRIC">{t('userSettings.metric')}</option>
                <option value="IMPERIAL">{t('userSettings.imperial')}</option>
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('userSettings.dietType')}</label>
              <select
                value={preferences.dietType}
                onChange={(e) => setPreferences({ ...preferences, dietType: e.target.value })}
                className="ui-select"
              >
                <option value="OMNIVORE">{t('userSettings.omnivore')}</option>
                <option value="VEGETARIAN">{t('userSettings.vegetarian')}</option>
                <option value="VEGAN">{t('userSettings.vegan')}</option>
                <option value="PESCATARIAN">{t('userSettings.pescatarian')}</option>
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('userSettings.transportMode')}</label>
              <select
                value={preferences.primaryTransportMode}
                onChange={(e) => setPreferences({ ...preferences, primaryTransportMode: e.target.value })}
                className="ui-select"
              >
                <option value="CAR">{t('userSettings.car')}</option>
                <option value="PUBLIC_TRANSIT">{t('userSettings.publicTransit')}</option>
                <option value="BIKE">{t('userSettings.bike')}</option>
                <option value="WALK">{t('userSettings.walk')}</option>
                <option value="MIXED">{t('userSettings.mixed')}</option>
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('userSettings.energySource')}</label>
              <select
                value={preferences.energySource}
                onChange={(e) => setPreferences({ ...preferences, energySource: e.target.value })}
                className="ui-select"
              >
                <option value="GRID">{t('userSettings.gridPower')}</option>
                <option value="SOLAR">{t('userSettings.solar')}</option>
                <option value="WIND">{t('userSettings.wind')}</option>
                <option value="MIXED">{t('userSettings.mixedRenewable')}</option>
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('userSettings.theme')}</label>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                className="ui-select"
              >
                <option value="light">☀️ {t('userSettings.light')}</option>
                <option value="dark">🌙 {t('userSettings.dark')}</option>
                <option value="system">💻 {t('userSettings.systemDefault')}</option>
              </select>
            </div>

            <label className="ui-check">
              <input
                type="checkbox"
                checked={preferences.notificationsEnabled}
                onChange={(e) =>
                  setPreferences({ ...preferences, notificationsEnabled: e.target.checked })
                }
              />
              <Bell size={16} style={{ display: 'inline' }} />
              <span>{t('userSettings.enableNotifications')}</span>
            </label>
          </div>
        )}

        {/* --- UI: profile tab --- */}
        {activeTab === 'profile' && (
          <div className="ui-card ui-card--pad-lg" style={{ maxWidth: 820 }}>
            <h3 className="ui-card__title" style={{ marginBottom: 20 }}>
              <User size={18} color="var(--green-600)" />
              {t('userSettings.profileInfo')}
            </h3>

            <div className="ui-field">
              <label className="ui-field__label">{t('profile.fullName')}</label>
              <input
                type="text"
                value={profile?.fullName || ''}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                className="ui-input"
              />
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('common.email')}</label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="ui-input"
              />
              <span className="ui-field__hint">{t('userSettings.emailCannotChange')}</span>
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('profile.bio')}</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows="4"
                placeholder={t('profile.bioPlaceholder')}
                className="ui-textarea"
              />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
              padding: 16,
              background: 'var(--bg-subtle)',
              borderRadius: 12,
            }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{t('profile.totalCO2')}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0 0' }}>{profile?.totalCO2e || 0} kg</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{t('profile.activities')}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0 0' }}>{profile?.totalActivities || 0}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, margin: 0 }}>{t('profile.badges')}</p>
                <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-strong)', margin: '4px 0 0' }}>{profile?.badgeCount || 0}</p>
              </div>
            </div>
          </div>
        )}

        {/* --- UI: account tab --- */}
        {activeTab === 'account' && (
          <div className="ui-card ui-card--pad-lg" style={{ maxWidth: 820 }}>
            <h3 className="ui-card__title" style={{ marginBottom: 20 }}>
              <Shield size={18} color="var(--green-600)" />
              {t('userSettings.accountInfo')}
            </h3>

            <div className="ui-grid ui-grid--2" style={{ gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('userSettings.userId')}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>#{profile?.userId || 'N/A'}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('userSettings.role')}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>{profile?.role || 'USER'}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('userSettings.memberSince')}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-strong)', margin: '4px 0 0' }}>
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '.05em' }}>{t('profile.carbonScore')}</p>
                <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--green-700)', margin: '4px 0 0' }}>
                  {profile?.carbonScore || 0}
                  {profile?.carbonScore >= 90 ? ' 🌟' :
                   profile?.carbonScore >= 70 ? ' ⭐' :
                   profile?.carbonScore >= 50 ? ' 💪' : ' 🌱'}
                </p>
              </div>
            </div>

            <div style={{
              marginTop: 24,
              padding: 20,
              border: '2px solid rgba(239,68,68,.28)',
              background: 'var(--pill-danger-bg)',
              borderRadius: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={20} color="var(--pill-danger-fg)" />
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--pill-danger-fg)', margin: 0 }}>
                  {t('userSettings.dangerZone')}
                </h4>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-body)', marginBottom: 16, lineHeight: 1.55 }}>
                {t('userSettings.resetSettings')}
              </p>
              <button onClick={handleReset} className="ui-btn ui-btn--danger ui-btn--block ui-btn--lg">
                <RefreshCw size={18} />
                {t('userSettings.resetButton')}
              </button>
            </div>
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

        /* ==========================================================
           SETTINGS TABS — prominent active state
           ========================================================== */
        .settings-tabs {
          display: flex;
          gap: 6px;
          margin-bottom: 24px;
          padding: 6px;
          background: var(--bg-subtle);
          border-radius: 14px;
          border: 1px solid var(--border);
          max-width: 640px;
        }

        .settings-tab {
          position: relative;
          flex: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 18px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -.1px;
          cursor: pointer;
          transition: background .2s var(--ease),
                      color .2s var(--ease),
                      transform .2s var(--ease),
                      box-shadow .2s var(--ease);
        }

        .settings-tab:hover:not(.is-active) {
          color: var(--green-700);
          background: var(--tint-1);
          transform: translateY(-1px);
        }

        .settings-tab.is-active {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 6px 16px rgba(22,163,74,.35);
        }

        .settings-tab__icon {
          display: inline-flex;
          align-items: center;
        }

        .settings-tab__label {
          white-space: nowrap;
        }

        .settings-tab__dot {
          position: absolute;
          top: 8px;
          right: 10px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #bef264;
          box-shadow: 0 0 0 3px rgba(190,242,100,.25);
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
          .ui-grid--2 { grid-template-columns: minmax(0, 1fr); }
          .settings-tabs { flex-direction: column; }
          .settings-tab { width: 100%; }
          .settings-tab__dot { top: 50%; right: 14px; transform: translateY(-50%); }
        }
      `}</style>
    </Layout>
  );
};

export default Settings;