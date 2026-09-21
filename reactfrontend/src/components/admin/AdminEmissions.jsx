import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import { useLanguage } from '../../contexts/LanguageContext';
import axiosClient from '../../api/axiosClient';
import {
  Plus, Trash2, RefreshCw, Edit, Save, X,
  FileText, Database, AlertCircle, Check, Search, AlertTriangle
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

const AdminEmissions = () => {
  const { t } = useLanguage();
  const [factors, setFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [formData, setFormData] = useState({
    category: 'Transport',
    activityType: '',
    unit: '',
    factor: '',
    source: 'IPCC',
    effectiveDate: new Date().toISOString().split('T')[0],
  });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const loadFactors = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/emission-factors');
      if (response.data && response.data.length > 0) {
        setFactors(response.data);
      } else {
        setFactors(getDefaultFactors());
      }
    } catch (error) {
      console.error('Error loading emission factors:', error);
      setFactors(getDefaultFactors());
    }
    setLoading(false);
  };

  const getDefaultFactors = () => {
    return [
      { id: 1, category: 'Transport', activityType: 'CAR', unit: 'km', factor: 0.171, source: 'IPCC', effectiveDate: '2024-01-01' },
      { id: 2, category: 'Transport', activityType: 'FLIGHT', unit: 'km', factor: 0.285, source: 'IPCC', effectiveDate: '2024-01-01' },
      { id: 3, category: 'Transport', activityType: 'CAR', unit: 'miles', factor: 0.275, source: 'IPCC', effectiveDate: '2024-01-01' },
      { id: 4, category: 'Transport', activityType: 'FLIGHT', unit: 'miles', factor: 0.459, source: 'IPCC', effectiveDate: '2024-01-01' },
      { id: 5, category: 'Transport', activityType: 'PUBLIC TRANSIT', unit: 'km', factor: 0.042, source: 'IPCC', effectiveDate: '2024-01-01' },
      { id: 6, category: 'Electricity', activityType: 'GRID', unit: 'kWh', factor: 0.475, source: 'EPA', effectiveDate: '2024-01-01' },
      { id: 7, category: 'Electricity', activityType: 'SOLAR', unit: 'kWh', factor: 0.041, source: 'EPA', effectiveDate: '2024-01-01' },
      { id: 8, category: 'Food', activityType: 'BEEF', unit: 'serving', factor: 6.61, source: 'IPCC', effectiveDate: '2024-01-01' },
      { id: 9, category: 'Food', activityType: 'CHICKEN', unit: 'serving', factor: 2.10, source: 'IPCC', effectiveDate: '2024-01-01' },
      { id: 10, category: 'Shopping', activityType: 'CLOTHING', unit: 'USD', factor: 0.012, source: 'EPA', effectiveDate: '2024-01-01' },
    ];
  };

  useEffect(() => {
    loadFactors();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setConfirmDelete({ show: false, id: null });
    };
    if (confirmDelete.show) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete.show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        setFactors(factors.map(f =>
          f.id === editingId ? { ...f, ...formData, id: editingId } : f
        ));
        showToast('success', `✅ ${t('admin.emissions.updated')}`);
      } else {
        const newFactor = { id: factors.length + 1, ...formData };
        setFactors([...factors, newFactor]);
        showToast('success', `✅ ${t('admin.emissions.added')}`);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving factor:', error);
      showToast('error', t('common.error'));
    }
  };

  const handleEdit = (factor) => {
    setEditingId(factor.id);
    setFormData({
      category: factor.category,
      activityType: factor.activityType,
      unit: factor.unit,
      factor: factor.factor.toString(),
      source: factor.source,
      effectiveDate: factor.effectiveDate || new Date().toISOString().split('T')[0],
    });
    setShowForm(true);
  };

  const requestDelete = (id) => setConfirmDelete({ show: true, id });
  const closeConfirmDelete = () => setConfirmDelete({ show: false, id: null });

  const executeDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return;
    try {
      setFactors(factors.filter(f => f.id !== id));
      showToast('success', `✅ ${t('admin.emissions.deleted')}`);
    } catch (error) {
      console.error('Error deleting factor:', error);
      showToast('error', t('common.error'));
    } finally {
      closeConfirmDelete();
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'Transport',
      activityType: '',
      unit: '',
      factor: '',
      source: 'IPCC',
      effectiveDate: new Date().toISOString().split('T')[0],
    });
    setEditingId(null);
    setShowForm(false);
  };

  const openForm = () => {
    resetForm();
    setShowForm(true);
  };

  const categories = ['Transport', 'Electricity', 'Food', 'Shopping'];
  const sources = ['IPCC', 'EPA'];

  const filteredFactors = factors.filter(f => {
    const matchesSearch = f.activityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || f.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category) => {
    switch (category) {
      case 'Transport': return t('activity.transport');
      case 'Electricity': return t('activity.electricity');
      case 'Food': return t('activity.food');
      case 'Shopping': return t('activity.shopping');
      default: return category;
    }
  };

  const getCategoryPillStyle = (category) => {
    switch (category) {
      case 'Transport':   return { background: 'rgba(34,197,94,.14)',  color: '#15803d', borderColor: 'rgba(34,197,94,.28)' };
      case 'Electricity': return { background: 'rgba(59,130,246,.14)', color: '#1d4ed8', borderColor: 'rgba(59,130,246,.28)' };
      case 'Food':        return { background: 'rgba(245,158,11,.14)', color: '#b45309', borderColor: 'rgba(245,158,11,.28)' };
      case 'Shopping':    return { background: 'rgba(139,92,246,.14)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,.28)' };
      default:            return { background: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-fg)', borderColor: 'var(--border)' };
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

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><FileText size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('admin.emissions.title')}</h1>
                <p className="ui-hero__subtitle--compact">
                  {factors.length} {t('admin.emissions.factorsConfigured')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero-ghost" onClick={loadFactors}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
              <button className="ui-btn ui-btn--hero" onClick={openForm}>
                <Plus size={16} />
                {t('admin.emissions.addFactor')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: search + filter --- */}
        <div className="ui-card ui-card--pad-sm" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder={t('admin.emissions.searchFactors')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ui-input"
                style={{ paddingLeft: 40 }}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="ui-select"
              >
                <option value="all">{t('admin.emissions.allCategories')}</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* --- UI: form --- */}
        {showForm && (
          <div className="ui-card ui-card--pad-lg" style={{ marginBottom: 20, borderTop: '3px solid var(--green-600)' }}>
            <div className="ui-card__head">
              <h3 className="ui-card__title">
                {editingId ? `✏️ ${t('admin.emissions.editFactor')}` : `➕ ${t('admin.emissions.addNewFactor')}`}
              </h3>
              <button className="ui-modal__close" onClick={resetForm} aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="factor-form-grid">
              <div className="ui-field">
                <label className="ui-field__label">{t('common.category')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="ui-select"
                  required
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{getCategoryLabel(cat)}</option>
                  ))}
                </select>
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('activity.activityType')}</label>
                <input
                  type="text"
                  value={formData.activityType}
                  onChange={(e) => setFormData({ ...formData, activityType: e.target.value.toUpperCase() })}
                  placeholder="e.g., CAR"
                  className="ui-input"
                  required
                />
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('activity.unit')}</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value.toLowerCase() })}
                  placeholder="e.g., km"
                  className="ui-input"
                  required
                />
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('admin.emissions.factor')}</label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.factor}
                  onChange={(e) => setFormData({ ...formData, factor: e.target.value })}
                  placeholder="0.000000"
                  className="ui-input"
                  required
                />
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('admin.emissions.source')}</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="ui-select"
                  required
                >
                  {sources.map(src => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('admin.emissions.effectiveDate')}</label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  className="ui-input"
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" className="ui-btn ui-btn--primary ui-btn--lg">
                  <Save size={18} />
                  {editingId ? t('common.update') : t('common.save')}
                </button>
                <button type="button" onClick={resetForm} className="ui-btn ui-btn--secondary ui-btn--lg">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- UI: table --- */}
        <div className="ui-card ui-card--flush">
          {filteredFactors.length === 0 ? (
            <div className="ui-state">
              <div className="ui-state__icon"><Database size={28} /></div>
              <p className="ui-state__title">{t('admin.emissions.noFactors')}</p>
              <p className="ui-state__text">{t('admin.emissions.addFirstFactor')}</p>
              <div className="ui-state__actions">
                <button className="ui-btn ui-btn--primary" onClick={openForm}>
                  <Plus size={16} />
                  {t('admin.emissions.addFactor')}
                </button>
              </div>
            </div>
          ) : (
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr>
                    <th>{t('common.category')}</th>
                    <th>{t('activity.activityType')}</th>
                    <th>{t('activity.unit')}</th>
                    <th style={{ textAlign: 'right' }}>{t('admin.emissions.factor')}</th>
                    <th>{t('admin.emissions.source')}</th>
                    <th style={{ textAlign: 'center' }}>{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFactors.map((factor) => (
                    <tr key={factor.id}>
                      <td>
                        <span className="ui-pill" style={getCategoryPillStyle(factor.category)}>
                          <span className="ui-pill__dot" />
                          {getCategoryLabel(factor.category)}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-strong)' }}>{factor.activityType}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{factor.unit}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--text-strong)' }}>
                        {factor.factor}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{factor.source}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          <button
                            onClick={() => handleEdit(factor)}
                            className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                            style={{ color: '#3b82f6' }}
                            title={t('common.edit')}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => requestDelete(factor.id)}
                            className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                            style={{ color: 'var(--pill-danger-fg)' }}
                            title={t('common.delete')}
                          >
                            <Trash2 size={18} />
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

      {/* --- UI: delete confirmation modal --- */}
      {confirmDelete.show && (
        <div className="app-confirm-overlay" onClick={closeConfirmDelete}>
          <div className="app-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm__icon">
              <AlertTriangle size={28} color="var(--pill-danger-fg)" />
            </div>
            <h2 className="app-confirm__title">Delete this emission factor?</h2>
            <p className="app-confirm__text">This action cannot be undone.</p>
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

        .factor-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
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
        .app-confirm__danger:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(239,68,68,.4); }

        @media (max-width: 900px) { .factor-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .factor-form-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default AdminEmissions;