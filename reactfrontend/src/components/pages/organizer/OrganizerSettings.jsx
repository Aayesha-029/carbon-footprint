import React, { useState, useEffect } from 'react';
import Layout from '../../Layout';
import { useLanguage } from '../../../contexts/LanguageContext';
import axiosClient from '../../../api/axiosClient';
import { Settings, Save, RefreshCw, Building2, Mail, Phone, MapPin, FileText } from 'lucide-react';

const OrganizerSettings = () => {
  const { t } = useLanguage();
  const [org, setOrg] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const loadOrg = async () => {
    try {
      const res = await axiosClient.get('/organizations/me');
      setOrg(res.data);
      setFormData({
        name: res.data.name || '',
        description: res.data.description || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrg();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await axiosClient.put(`/organizations/${org.id}`, formData);
      setMessage('✅ Organization updated successfully');
      loadOrg();
    } catch (err) {
      setMessage('❌ Failed to update: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout userRole="organizer">
        <div className="ui-state">
          <div className="ui-spinner" />
          <p className="ui-state__text">{t('common.loading')}</p>
        </div>
      </Layout>
    );
  }

  const isSuccess = message.includes('✅');

  return (
    <Layout userRole="organizer">
      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Settings size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">
                  {t('organizer.settings.title')}
                </h1>
                <p className="ui-hero__subtitle--compact">{org?.name || 'Organization Settings'}</p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadOrg}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        <div className="ui-card ui-card--pad-lg" style={{ maxWidth: 720 }}>
          <div className="ui-card__head">
            <h3 className="ui-card__title">
              <Building2 size={18} color="var(--green-600)" />
              Organization Information
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="ui-field">
              <label className="ui-field__label">
                <Building2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Organization Name <span className="ui-field__req">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="ui-input"
                required
              />
            </div>

            <div className="ui-field">
              <label className="ui-field__label">
                <FileText size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="ui-textarea"
              />
            </div>

            <div className="ui-field">
              <label className="ui-field__label">
                <Mail size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="ui-input"
              />
            </div>

            <div className="ui-field">
              <label className="ui-field__label">
                <Phone size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Phone
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="ui-input"
              />
            </div>

            <div className="ui-field">
              <label className="ui-field__label">
                <MapPin size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="ui-input"
              />
            </div>

            {message && (
              <div style={{
                marginBottom: 16,
                padding: '12px 16px',
                background: isSuccess ? 'var(--pill-success-bg)' : 'var(--pill-danger-bg)',
                color: isSuccess ? 'var(--pill-success-fg)' : 'var(--pill-danger-fg)',
                border: `1px solid ${isSuccess ? 'var(--tint-border)' : 'rgba(239,68,68,.28)'}`,
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
              }}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="ui-btn ui-btn--primary ui-btn--lg"
            >
              {saving ? (
                <>
                  <span className="ui-btn__spinner" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .ui-hero__title--module { font-size: 28px; font-weight: 800; letter-spacing: -.6px; line-height: 1.15; color: #fff; margin: 0 0 4px; }
        .ui-hero__subtitle--compact { font-size: 14.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,.90); margin: 0; max-width: 62ch; }

        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
        }
      `}</style>
    </Layout>
  );
};

export default OrganizerSettings;