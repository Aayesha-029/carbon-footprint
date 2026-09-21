import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  Settings as SettingsIcon,
  Save, RefreshCw, Check, X, AlertCircle,
  Globe, Bell, Users, Shield, Palette,
  AlertTriangle, UserPlus, Award, Trophy, Target,
  Sun, Moon,
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
    warning: { background: 'var(--pill-warn-bg)',    border: '1px solid rgba(245,158,11,.28)', color: 'var(--pill-warn-fg)',   icon: <AlertTriangle size={20} /> },
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

const AdminSettings = () => {
  const { t } = useLanguage();
  const { settings: contextSettings, updateSettings, resetSettings, refreshSettings, loading, applyTheme } = useSettings();
  const [localSettings, setLocalSettings] = useState({});
  const [originalSettings, setOriginalSettings] = useState({});
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  useEffect(() => {
    if (contextSettings && Object.keys(contextSettings).length > 0) {
      console.log('📊 Settings loaded into component:', contextSettings);
      setLocalSettings({ ...contextSettings });
      setOriginalSettings({ ...contextSettings });
      setHasChanges(false);
    }
  }, [contextSettings]);

  useEffect(() => {
    if (Object.keys(localSettings).length > 0 && Object.keys(originalSettings).length > 0) {
      const changed = JSON.stringify(localSettings) !== JSON.stringify(originalSettings);
      setHasChanges(changed);
    }
  }, [localSettings, originalSettings]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmReset(false);
    };
    if (confirmReset) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmReset]);

  const handleChange = (key, value) => {
    console.log('📝 Changing:', key, 'to:', value);
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key) => {
    const newValue = !localSettings[key];
    console.log('🔄 Toggling:', key, 'from', localSettings[key], 'to', newValue);
    setLocalSettings(prev => ({ ...prev, [key]: newValue }));
  };

  const handleSave = async () => {
    if (!hasChanges) {
      showToast('info', t('admin.settings.noChangesToSave'));
      return;
    }

    setSaving(true);
    try {
      console.log('📤 Saving settings:', localSettings);
      const result = await updateSettings(localSettings);

      if (result.success) {
        showToast('success', t('admin.settings.allSaved'));
        setOriginalSettings({ ...localSettings });
        setHasChanges(false);

        if (localSettings.theme) {
          applyTheme(localSettings.theme);
        }

        window.dispatchEvent(new Event('settingsUpdated'));
        setTimeout(() => refreshSettings(), 500);
      } else {
        showToast('error', result.error || t('common.error'));
      }
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      showToast('error', t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const requestReset = () => setConfirmReset(true);

  const executeReset = async () => {
    setResetting(true);
    try {
      const result = await resetSettings();
      if (result.success) {
        showToast('success', t('admin.settings.allSaved'));
        setTimeout(() => refreshSettings(), 500);
      } else {
        showToast('error', result.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      showToast('error', t('common.error'));
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  };

  const getThemeIcon = (theme) => {
    switch (theme) {
      case 'light': return <Sun size={20} />;
      case 'dark': return <Moon size={20} />;
      default: return <Sun size={20} />;
    }
  };

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

        {/* --- UI: brand hero with actions --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><SettingsIcon size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.settings.title')}</h1>
                <p className="ui-hero__subtitle--compact">{t('admin.settings.description')}</p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button
                className="ui-btn ui-btn--hero-ghost"
                onClick={requestReset}
                disabled={resetting}
              >
                {resetting ? (
                  <>
                    <span className="ui-btn__spinner" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    {t('admin.settings.resetDefaults')}
                  </>
                )}
              </button>
              <button
                className="ui-btn ui-btn--hero"
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <>
                    <span className="ui-btn__spinner" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {hasChanges ? t('admin.settings.saveChanges') : t('admin.settings.noChanges')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: settings grid --- */}
        <div className="admin-settings-grid">

          {/* Application Settings */}
          <div className="ui-card ui-card--pad-lg">
            <div className="settings-card__head">
              <div className="settings-card__icon settings-card__icon--green">
                <SettingsIcon size={18} />
              </div>
              <h3 className="settings-card__title">{t('admin.settings.application')}</h3>
            </div>

            <div className="ui-field">
              <label className="ui-field__label">{t('admin.settings.appName')}</label>
              <input
                type="text"
                value={localSettings.appName || ''}
                onChange={(e) => handleChange('appName', e.target.value)}
                className="ui-input"
              />
            </div>

            <div className="ui-field" style={{ marginBottom: 0 }}>
              <label className="ui-field__label">{t('admin.settings.appDescription')}</label>
              <textarea
                value={localSettings.appDescription || ''}
                onChange={(e) => handleChange('appDescription', e.target.value)}
                rows="2"
                className="ui-textarea"
              />
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="ui-card ui-card--pad-lg">
            <div className="settings-card__head">
              <div className="settings-card__icon settings-card__icon--blue">
                <Target size={18} />
              </div>
              <h3 className="settings-card__title">{t('admin.settings.featureToggles')}</h3>
            </div>

            {[
              { key: 'carbonGoalEnabled', label: t('admin.settings.carbonGoals'), icon: <Target size={16} color="#f59e0b" /> },
              { key: 'leaderboardEnabled', label: t('admin.settings.leaderboard'), icon: <Trophy size={16} color="#8b5cf6" /> },
              { key: 'badgesEnabled', label: t('admin.settings.badges'), icon: <Award size={16} color="#ec4899" /> },
              { key: 'allowSocialLogin', label: t('admin.settings.socialLogin'), icon: <Users size={16} color="#22c55e" /> },
            ].map((item) => (
              <div key={item.key} className="settings-toggle-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="settings-toggle-row__icon">{item.icon}</div>
                  <div>
                    <div className="settings-toggle-row__label">{item.label}</div>
                    <div className={`settings-toggle-row__status ${localSettings[item.key] ? 'is-on' : 'is-off'}`}>
                      {t('admin.settings.featureStatus')}: {localSettings[item.key] ? t('admin.settings.on') : t('admin.settings.off')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  className={`ui-switch ${localSettings[item.key] ? 'is-on' : ''}`}
                  aria-label={item.label}
                >
                  <span className="ui-switch__thumb" />
                </button>
              </div>
            ))}

            <div className="settings-hint">
              💡 {t('admin.settings.toggleFeatures')}
            </div>
          </div>

          {/* User Management */}
          <div className="ui-card ui-card--pad-lg">
            <div className="settings-card__head">
              <div className="settings-card__icon settings-card__icon--amber">
                <Users size={18} />
              </div>
              <h3 className="settings-card__title">{t('admin.settings.userManagement')}</h3>
            </div>

            <div className="settings-toggle-row">
              <div>
                <div className="settings-toggle-row__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <UserPlus size={16} />
                  {t('admin.settings.userRegistration')}
                </div>
                <div className={`settings-toggle-row__status ${localSettings.userRegistration ? 'is-on' : 'is-off'}`}>
                  {t('admin.settings.featureStatus')}: {localSettings.userRegistration ? t('admin.settings.on') : t('admin.settings.off')}
                </div>
              </div>
              <button
                onClick={() => handleToggle('userRegistration')}
                className={`ui-switch ${localSettings.userRegistration ? 'is-on' : ''}`}
              >
                <span className="ui-switch__thumb" />
              </button>
            </div>

            <div className="ui-field">
              <label className="ui-field__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={16} />
                {t('admin.settings.defaultRole')}
              </label>
              <select
                value={localSettings.defaultRole || 'USER'}
                onChange={(e) => handleChange('defaultRole', e.target.value)}
                className="ui-select"
              >
                <option value="USER">{t('admin.users.user')}</option>
                <option value="ADMIN">{t('admin.users.admin')}</option>
                <option value="MODERATOR">{t('admin.users.moderator')}</option>
              </select>
            </div>

            <div className="settings-toggle-row" style={{ borderBottom: 'none' }}>
              <div>
                <div className="settings-toggle-row__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={16} />
                  {t('admin.settings.emailNotifications')}
                </div>
                <div className={`settings-toggle-row__status ${localSettings.emailNotifications ? 'is-on' : 'is-off'}`}>
                  {t('admin.settings.featureStatus')}: {localSettings.emailNotifications ? t('admin.settings.on') : t('admin.settings.off')}
                </div>
              </div>
              <button
                onClick={() => handleToggle('emailNotifications')}
                className={`ui-switch ${localSettings.emailNotifications ? 'is-on' : ''}`}
              >
                <span className="ui-switch__thumb" />
              </button>
            </div>
          </div>

          {/* Appearance */}
          <div className="ui-card ui-card--pad-lg">
            <div className="settings-card__head">
              <div className="settings-card__icon settings-card__icon--purple">
                <Palette size={18} />
              </div>
              <h3 className="settings-card__title">{t('admin.settings.appearance')}</h3>
            </div>

            <div className="ui-field">
              <label className="ui-field__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Palette size={16} />
                {t('admin.settings.theme')}
              </label>
              <div className="theme-choice-row">
                <button
                  onClick={() => handleChange('theme', 'light')}
                  className={`theme-choice ${localSettings.theme === 'light' ? 'is-active' : ''}`}
                >
                  {getThemeIcon('light')}
                  {t('admin.settings.light')}
                  {localSettings.theme === 'light' && <Check size={14} color="#16a34a" />}
                </button>
                <button
                  onClick={() => handleChange('theme', 'dark')}
                  className={`theme-choice ${localSettings.theme === 'dark' ? 'is-active' : ''}`}
                >
                  {getThemeIcon('dark')}
                  {t('admin.settings.dark')}
                  {localSettings.theme === 'dark' && <Check size={14} color="#16a34a" />}
                </button>
              </div>
              <div className="settings-hint" style={{ marginTop: 12, marginBottom: 0 }}>
                {t('admin.settings.currentTheme')}: <strong>{localSettings.theme === 'dark' ? t('admin.settings.dark') : t('admin.settings.light')}</strong>
              </div>
            </div>
          </div>

          {/* Maintenance */}
          <div className="ui-card ui-card--pad-lg" style={{
            border: localSettings.maintenanceMode
              ? '2px solid rgba(239,68,68,.5)'
              : '1px solid var(--border)',
          }}>
            <div className="settings-card__head">
              <div className="settings-card__icon settings-card__icon--danger">
                <AlertTriangle size={18} />
              </div>
              <h3 className="settings-card__title" style={{ color: 'var(--pill-danger-fg)' }}>
                {t('admin.settings.maintenance')}
              </h3>
            </div>

            <div className="settings-toggle-row" style={{ borderBottom: 'none' }}>
              <div>
                <div className="settings-toggle-row__label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle size={16} />
                  {t('admin.settings.maintenanceMode')}
                </div>
                <div className={`settings-toggle-row__status ${localSettings.maintenanceMode ? 'is-off' : 'is-on'}`}>
                  {t('admin.settings.featureStatus')}: {localSettings.maintenanceMode ? t('admin.settings.on') : t('admin.settings.off')}
                </div>
              </div>
              <button
                onClick={() => handleToggle('maintenanceMode')}
                className={`ui-switch ui-switch--danger ${localSettings.maintenanceMode ? 'is-on' : ''}`}
              >
                <span className="ui-switch__thumb" />
              </button>
            </div>

            {localSettings.maintenanceMode && (
              <div style={{
                marginTop: 12,
                padding: '12px 16px',
                background: 'var(--pill-danger-bg)',
                borderRadius: 8,
                border: '1px solid rgba(239,68,68,.28)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <AlertTriangle size={18} color="var(--pill-danger-fg)" />
                <span style={{ fontSize: 13, color: 'var(--pill-danger-fg)', fontWeight: 600 }}>
                  {t('admin.settings.maintenanceActive')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer status */}
        <div className="admin-settings-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Globe size={18} color="var(--text-muted)" />
            <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
              {hasChanges ? (
                <span style={{ color: 'var(--pill-warn-fg)', fontWeight: 700 }}>
                  ⚡ {t('admin.settings.unsaved')}
                </span>
              ) : (
                t('admin.settings.allSaved')
              )}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={requestReset}
              disabled={resetting}
              className="ui-btn ui-btn--secondary"
            >
              <RefreshCw size={14} />
              {t('admin.settings.resetDefaults')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="ui-btn ui-btn--primary"
            >
              <Save size={14} />
              {hasChanges ? t('admin.settings.saveChanges') : t('admin.settings.noChanges')}
            </button>
          </div>
        </div>
      </div>

      {/* --- UI: reset confirmation modal --- */}
      {confirmReset && (
        <div className="app-confirm-overlay" onClick={() => setConfirmReset(false)}>
          <div className="app-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm__icon">
              <AlertTriangle size={28} color="var(--pill-danger-fg)" />
            </div>
            <h2 className="app-confirm__title">{t('admin.settings.resetToDefaults')}</h2>
            <p className="app-confirm__text">{t('admin.settings.resetSettings') || 'All settings will be reset to their default values. This action cannot be undone.'}</p>
            <div className="app-confirm__actions">
              <button type="button" className="app-confirm__cancel" onClick={() => setConfirmReset(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="app-confirm__danger" onClick={executeReset} disabled={resetting}>
                {resetting ? (
                  <>
                    <span className="ui-btn__spinner" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    {t('admin.settings.resetDefaults')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        .admin-settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 20px;
          margin-bottom: 24px;
        }

        .settings-card__head {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        .settings-card__icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: grid; place-items: center;
        }
        .settings-card__icon--green  { background: rgba(34,197,94,.12); color: #22c55e; }
        .settings-card__icon--blue   { background: rgba(59,130,246,.12); color: #3b82f6; }
        .settings-card__icon--amber  { background: rgba(245,158,11,.12); color: #f59e0b; }
        .settings-card__icon--purple { background: rgba(139,92,246,.12); color: #8b5cf6; }
        .settings-card__icon--danger { background: rgba(239,68,68,.12); color: #ef4444; }
        .settings-card__title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
          color: var(--text-strong);
          letter-spacing: -.2px;
        }

        .settings-toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--border);
          gap: 12px;
        }
        .settings-toggle-row:last-of-type { border-bottom: none; }
        .settings-toggle-row__icon {
          width: 28px; height: 28px;
          border-radius: 6px;
          background: var(--bg-subtle);
          display: grid; place-items: center;
          flex-shrink: 0;
        }
        .settings-toggle-row__label {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-strong);
        }
        .settings-toggle-row__status {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: .03em;
          margin-top: 2px;
          text-transform: uppercase;
        }
        .settings-toggle-row__status.is-on  { color: var(--green-600); }
        .settings-toggle-row__status.is-off { color: var(--pill-danger-fg); }

        .ui-switch {
          position: relative;
          width: 52px;
          height: 28px;
          border-radius: 14px;
          background: var(--border-strong);
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          transition: background .3s var(--ease);
          padding: 0;
        }
        .ui-switch.is-on { background: #22c55e; box-shadow: 0 2px 8px rgba(34,197,94,.35); }
        .ui-switch--danger.is-on { background: #dc2626; box-shadow: 0 2px 8px rgba(220,38,38,.35); }
        .ui-switch__thumb {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 4px rgba(0,0,0,.2);
          transition: left .3s var(--ease);
        }
        .ui-switch.is-on .ui-switch__thumb { left: 27px; }

        .settings-hint {
          margin-top: 12px;
          padding: 10px 14px;
          background: var(--bg-subtle);
          border-radius: 8px;
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .theme-choice-row { display: flex; gap: 12px; }
        .theme-choice {
          flex: 1;
          padding: 12px;
          border-radius: 8px;
          border: 1.5px solid var(--border);
          background: var(--bg-surface);
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all .2s var(--ease);
        }
        .theme-choice:hover { border-color: var(--green-400); background: var(--tint-1); }
        .theme-choice.is-active {
          border-color: var(--green-600);
          background: var(--tint-1);
          color: var(--text-strong);
          box-shadow: 0 2px 8px rgba(34,197,94,.15);
        }

        .admin-settings-footer {
          margin-top: 24px;
          padding: 16px 20px;
          background: var(--bg-subtle);
          border-radius: 12px;
          border: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
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
        .app-confirm__danger:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(239,68,68,.4); }
        .app-confirm__danger:disabled { opacity: .7; cursor: not-allowed; }

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .admin-settings-grid { grid-template-columns: minmax(0, 1fr); }
          .theme-choice-row { flex-direction: column; }
        }
      `}</style>
    </Layout>
  );
};

export default AdminSettings;