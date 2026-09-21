import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Target, Calendar, Trash2, TrendingUp,
  Award, Plus, RefreshCw, CheckCircle, XCircle,
  Clock, AlertCircle, Check, X, Edit2, Save,
  Car, Zap, Utensils, ShoppingBag, Leaf, AlertTriangle
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

const Goals = () => {
  const { t } = useLanguage();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [toastMessage, setToastMessage] = useState({ type: '', message: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null });
  const [formData, setFormData] = useState({
    goalName: '',
    category: '',
    targetCO2: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const categories = ['Transport', 'Electricity', 'Food', 'Shopping', 'Overall'];

  const categoryConfigs = {
    'Transport':   { color: '#22c55e', bg: '#22c55e15', icon: Car,         label: t('activity.transport') },
    'Electricity': { color: '#3b82f6', bg: '#3b82f615', icon: Zap,         label: t('activity.electricity') },
    'Food':        { color: '#f59e0b', bg: '#f59e0b15', icon: Utensils,    label: t('activity.food') },
    'Shopping':    { color: '#8b5cf6', bg: '#8b5cf615', icon: ShoppingBag, label: t('activity.shopping') },
    'Overall':     { color: '#0f172a', bg: '#0f172a15', icon: Target,      label: 'Overall' }
  };

  const showToast = (type, message) => setToastMessage({ type, message });
  const hideToast = () => setToastMessage({ type: '', message: '' });

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    return { userId };
  };

  const loadGoals = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosClient.get(`/goals/user/${userId}`);
      setGoals(response.data || []);
    } catch (error) {
      console.error('Error loading goals:', error);
      showToast('error', 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const recalculateGoals = async () => {
    const { userId } = getCurrentUser();
    if (!userId) return;

    try {
      await axiosClient.post(`/goals/user/${userId}/recalculate-all`);
      await loadGoals();
      showToast('success', '✅ Goals progress updated!');
    } catch (error) {
      console.error('Error recalculating goals:', error);
      showToast('error', 'Failed to update goals progress');
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    const handleActivityLogged = () => {
      setTimeout(() => recalculateGoals(), 1000);
    };
    const handleGoalUpdate = () => loadGoals();

    window.addEventListener('activityLogged', handleActivityLogged);
    window.addEventListener('goalUpdated', handleGoalUpdate);

    return () => {
      window.removeEventListener('activityLogged', handleActivityLogged);
      window.removeEventListener('goalUpdated', handleGoalUpdate);
    };
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
    setSubmitting(true);

    const { userId } = getCurrentUser();
    if (!userId) {
      showToast('error', 'Please login first');
      setSubmitting(false);
      return;
    }

    if (!formData.goalName.trim()) {
      showToast('error', 'Please enter a goal name');
      setSubmitting(false);
      return;
    }

    if (!formData.category) {
      showToast('error', 'Please select a category');
      setSubmitting(false);
      return;
    }

    if (!formData.targetCO2 || parseFloat(formData.targetCO2) <= 0) {
      showToast('error', 'Please enter a valid target CO₂ value');
      setSubmitting(false);
      return;
    }

    if (formData.startDate >= formData.endDate) {
      showToast('error', 'End date must be after start date');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        userId: parseInt(userId),
        goalName: formData.goalName.trim(),
        category: formData.category,
        targetCO2: parseFloat(formData.targetCO2),
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      let response;
      if (editingGoal) {
        response = await axiosClient.put(`/goals/${editingGoal.id}`, payload);
      } else {
        response = await axiosClient.post('/goals', payload);
      }

      if (response.data.success) {
        showToast('success', editingGoal ? t('goals.edit') + ' ✅' : t('goals.setNew') + ' ✅');
        setShowForm(false);
        setEditingGoal(null);
        resetForm();
        await loadGoals();
        setTimeout(() => recalculateGoals(), 500);
        window.dispatchEvent(new Event('goalUpdated'));
        window.dispatchEvent(new Event('notificationReceived'));
      } else {
        showToast('error', response.data.error || 'Failed to save goal');
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      showToast('error', 'Failed to save goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormData({
      goalName: goal.goalName,
      category: goal.category,
      targetCO2: goal.targetCO2.toString(),
      startDate: goal.startDate,
      endDate: goal.endDate,
    });
    setShowForm(true);
    setTimeout(() => {
      const element = document.getElementById(`goal-${goal.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 200);
  };

  const requestDelete = (id) => {
    setConfirmDelete({ show: true, id });
  };

  const closeConfirmDelete = () => {
    setConfirmDelete({ show: false, id: null });
  };

  const executeDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return;

    const { userId } = getCurrentUser();
    try {
      await axiosClient.delete(`/goals/${id}/user/${userId}`);
      showToast('success', '✅ ' + t('goals.deleteText') + ' ' + t('common.success'));
      await loadGoals();
      window.dispatchEvent(new Event('goalUpdated'));
      window.dispatchEvent(new Event('notificationReceived'));
    } catch (error) {
      console.error('Error deleting goal:', error);
      showToast('error', 'Failed to delete goal');
    } finally {
      closeConfirmDelete();
    }
  };

  const resetForm = () => {
    setFormData({
      goalName: '',
      category: '',
      targetCO2: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    resetForm();
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'NOT_STARTED': { label: t('common.notStarted'), color: '#94a3b8', bg: '#f1f5f9', icon: <Clock size={16} /> },
      'IN_PROGRESS': { label: t('common.inProgress'), color: '#3b82f6', bg: '#eff6ff', icon: <Target size={16} /> },
      'COMPLETED':   { label: t('common.completed'),  color: '#22c55e', bg: '#dcfce7', icon: <CheckCircle size={16} /> },
      'FAILED':      { label: t('common.failed'),     color: '#ef4444', bg: '#fef2f2', icon: <XCircle size={16} /> },
    };
    return statusMap[status] || statusMap['NOT_STARTED'];
  };

  const getCategoryColor = (category) => {
    const config = categoryConfigs[category];
    return config ? config.color : '#64748b';
  };

  const getCategoryBg = (category) => {
    const config = categoryConfigs[category];
    return config ? config.bg : '#f1f5f9';
  };

  const getCategoryIcon = (category) => {
    const config = categoryConfigs[category];
    const Icon = config ? config.icon : Target;
    return <Icon size={20} color={config ? config.color : '#64748b'} />;
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

  const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS' || g.status === 'NOT_STARTED');
  const completedGoals = goals.filter(g => g.status === 'COMPLETED');
  const failedGoals = goals.filter(g => g.status === 'FAILED');

  return (
    <Layout userRole="user">
      <Toast type={toastMessage.type} message={toastMessage.message} onClose={hideToast} />

      <div className="ui-fade-in-up">

        {/* --- UI: brand hero --- */}
        <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Target size={24} /></div>
              <div className="ui-hero__text">
                <h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.sustainabilityGoals')}</h1>
                <p className="ui-hero__subtitle ui-hero__subtitle--compact">
                  {activeGoals.length} {t('goals.active')} · {completedGoals.length} {t('goals.completed')}
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={recalculateGoals}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
              <button
                className="ui-btn ui-btn--hero-ghost"
                onClick={() => {
                  resetForm();
                  setEditingGoal(null);
                  setShowForm(true);
                  setTimeout(() => {
                    const formElement = document.getElementById('goal-form');
                    if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 200);
                }}
              >
                <Plus size={16} />
                {t('goals.setNew')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: summary cards --- */}
        <div className="ui-grid ui-grid--4" style={{ marginBottom: 24 }}>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Target size={20} /></div>
            </div>
            <div className="ui-stat__value">{activeGoals.length}</div>
            <div className="ui-stat__label">{t('goals.active')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><CheckCircle size={20} /></div>
            </div>
            <div className="ui-stat__value">{completedGoals.length}</div>
            <div className="ui-stat__label">{t('goals.completed')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #ef4444' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--red"><XCircle size={20} /></div>
            </div>
            <div className="ui-stat__value">{failedGoals.length}</div>
            <div className="ui-stat__label">{t('goals.failed')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #f59e0b' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--amber"><Award size={20} /></div>
            </div>
            <div className="ui-stat__value">{goals.length}</div>
            <div className="ui-stat__label">{t('goals.total')}</div>
          </div>
        </div>

        {/* --- UI: create form --- */}
        {showForm && !editingGoal && (
          <div className="ui-card ui-card--pad-lg" id="goal-form" style={{ marginBottom: 24, borderTop: '3px solid var(--green-600)' }}>
            <div className="ui-card__head">
              <h3 className="ui-card__title">🎯 {t('goals.createNew')}</h3>
              <button className="ui-modal__close" onClick={closeForm} aria-label="Close"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="goal-form-grid">
              <div className="ui-field" style={{ gridColumn: '1 / -1' }}>
                <label className="ui-field__label">{t('goals.name')} <span className="ui-field__req">*</span></label>
                <input
                  type="text"
                  value={formData.goalName}
                  onChange={(e) => setFormData({ ...formData, goalName: e.target.value })}
                  placeholder={t('goals.placeholder')}
                  className="ui-input"
                  required
                />
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('common.category')} <span className="ui-field__req">*</span></label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="ui-select"
                  required
                >
                  <option value="">{t('common.select')}...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{categoryConfigs[cat]?.label || cat}</option>
                  ))}
                </select>
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('goals.target')} <span className="ui-field__req">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.targetCO2}
                  onChange={(e) => setFormData({ ...formData, targetCO2: e.target.value })}
                  placeholder="e.g., 100"
                  className="ui-input"
                  required
                />
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('goals.startDate')} <span className="ui-field__req">*</span></label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="ui-input"
                  required
                />
              </div>
              <div className="ui-field">
                <label className="ui-field__label">{t('goals.endDate')} <span className="ui-field__req">*</span></label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="ui-input"
                  required
                />
              </div>
              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="submit" disabled={submitting} className="ui-btn ui-btn--primary ui-btn--lg">
                  {submitting ? (
                    <>
                      <span className="ui-btn__spinner" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {t('goals.setNew')}
                    </>
                  )}
                </button>
                <button type="button" onClick={closeForm} className="ui-btn ui-btn--secondary ui-btn--lg">
                  {t('common.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- UI: goals list --- */}
        <div>
          <h3 className="ui-card__title" style={{ marginBottom: 16 }}>
            {t('goals.title')}
          </h3>
          {goals.length === 0 ? (
            <div className="ui-card">
              <div className="ui-state">
                <div className="ui-state__icon"><Target size={28} /></div>
                <p className="ui-state__title">{t('goals.none')}</p>
                <p className="ui-state__text">{t('goals.createFirst')}</p>
                <div className="ui-state__actions">
                  <button
                    className="ui-btn ui-btn--primary"
                    onClick={() => {
                      resetForm();
                      setEditingGoal(null);
                      setShowForm(true);
                      setTimeout(() => {
                        const formElement = document.getElementById('goal-form');
                        if (formElement) formElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 200);
                    }}
                  >
                    <Plus size={16} />
                    {t('goals.setNew')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            goals.map((goal) => {
              const statusInfo = getStatusInfo(goal.status);
              const progress = Math.min(100, Math.round(goal.progressPercentage || 0));
              const categoryColor = getCategoryColor(goal.category);
              const isCompleted = goal.status === 'COMPLETED';
              const isFailed = goal.status === 'FAILED';
              const isEditing = editingGoal && editingGoal.id === goal.id;

              return (
                <div key={goal.id}>
                  {isEditing && showForm && (
                    /* --- UI: inline edit form — tinted by category --- */
                    <div
                      className="cat-card cat-card--edit"
                      data-category={goal.category}
                      data-status={goal.status}
                    >
                      <div className="ui-card__head">
                        <h3 className="ui-card__title">✏️ {t('goals.edit')}: {editingGoal.goalName}</h3>
                        <button className="ui-modal__close" onClick={closeForm} aria-label="Close"><X size={16} /></button>
                      </div>
                      <form onSubmit={handleSubmit} className="goal-form-grid">
                        <div className="ui-field" style={{ gridColumn: '1 / -1' }}>
                          <label className="ui-field__label">{t('goals.name')} <span className="ui-field__req">*</span></label>
                          <input
                            type="text"
                            value={formData.goalName}
                            onChange={(e) => setFormData({ ...formData, goalName: e.target.value })}
                            placeholder={t('goals.placeholder')}
                            className="ui-input"
                            required
                          />
                        </div>
                        <div className="ui-field">
                          <label className="ui-field__label">{t('common.category')} <span className="ui-field__req">*</span></label>
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="ui-select"
                            required
                          >
                            <option value="">{t('common.select')}...</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{categoryConfigs[cat]?.label || cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="ui-field">
                          <label className="ui-field__label">{t('goals.target')} <span className="ui-field__req">*</span></label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.targetCO2}
                            onChange={(e) => setFormData({ ...formData, targetCO2: e.target.value })}
                            className="ui-input"
                            required
                          />
                        </div>
                        <div className="ui-field">
                          <label className="ui-field__label">{t('goals.startDate')} <span className="ui-field__req">*</span></label>
                          <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="ui-input"
                            required
                          />
                        </div>
                        <div className="ui-field">
                          <label className="ui-field__label">{t('goals.endDate')} <span className="ui-field__req">*</span></label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="ui-input"
                            required
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12, marginTop: 8 }}>
                          <button type="submit" disabled={submitting} className="ui-btn ui-btn--primary ui-btn--lg">
                            {submitting ? (
                              <>
                                <span className="ui-btn__spinner" />
                                {t('common.loading')}
                              </>
                            ) : (
                              <>
                                <Save size={18} />
                                {t('goals.edit')}
                              </>
                            )}
                          </button>
                          <button type="button" onClick={closeForm} className="ui-btn ui-btn--secondary ui-btn--lg">
                            {t('common.cancel')}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* --- UI: goal display card — full category tint --- */}
                  <div
                    className="cat-card"
                    data-category={goal.category}
                    data-status={goal.status}
                    id={`goal-${goal.id}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: isCompleted ? 'rgba(34,197,94,.18)' : isFailed ? 'rgba(239,68,68,.18)' : getCategoryBg(goal.category),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {isCompleted ? (
                              <CheckCircle size={20} color="#22c55e" />
                            ) : isFailed ? (
                              <XCircle size={20} color="#ef4444" />
                            ) : (
                              getCategoryIcon(goal.category)
                            )}
                          </div>
                          <h4 style={{
                            fontSize: 19, fontWeight: 700,
                            color: isCompleted ? '#16a34a' : isFailed ? '#dc2626' : 'var(--text-strong)',
                            margin: 0,
                          }}>
                            {goal.goalName}
                          </h4>
                          <span className={`ui-pill ${
                            isCompleted ? 'ui-pill--success' :
                            isFailed ? 'ui-pill--danger' :
                            goal.status === 'IN_PROGRESS' ? 'ui-pill--info' :
                            'ui-pill--neutral'
                          }`}>
                            {statusInfo.icon}
                            {statusInfo.label}
                          </span>
                          <span className="ui-pill ui-pill--neutral">
                            {categoryConfigs[goal.category]?.label || goal.category}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginTop: 12, fontSize: 14, color: 'var(--text-body)' }}>
                          <span>🎯 {t('goals.target')}: <strong style={{ color: isCompleted ? '#16a34a' : 'var(--text-strong)' }}>{goal.targetCO2} kg</strong></span>
                          <span>📊 {t('goals.current')}: <strong style={{ color: '#3b82f6' }}>{goal.currentCO2} kg</strong></span>
                          <span>📉 {t('goals.remaining')}: <strong style={{ color: progress >= 100 ? '#22c55e' : '#f59e0b' }}>{goal.remainingCO2} kg</strong></span>
                          <span>📅 {goal.startDate} → {goal.endDate}</span>
                        </div>
                        {goal.statusMessage && (
                          <p style={{
                            fontSize: 14, marginTop: 6, fontStyle: 'italic', fontWeight: 500,
                            color: isCompleted ? '#16a34a' : isFailed ? '#dc2626' : categoryColor,
                          }}>
                            {goal.statusMessage}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleEdit(goal)}
                          className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                          style={{ color: '#3b82f6' }}
                          aria-label="Edit goal"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => requestDelete(goal.id)}
                          className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm"
                          style={{ color: 'var(--pill-danger-fg)' }}
                          aria-label="Delete goal"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-body)', marginBottom: 6 }}>
                        <span style={{ fontWeight: 500 }}>{t('goals.progress')}</span>
                        <span style={{ fontWeight: 700, color: progress >= 100 ? '#22c55e' : '#3b82f6' }}>{progress}%</span>
                      </div>
                      <div style={{
                        width: '100%', height: 12, background: 'var(--bg-subtle)',
                        borderRadius: 9999, overflow: 'hidden', position: 'relative',
                      }}>
                        <div style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${progress >= 100 ? '#22c55e' : categoryColor}, ${progress >= 100 ? '#15803d' : categoryColor})`,
                          borderRadius: 9999,
                          transition: 'width .8s cubic-bezier(.4,0,.2,1)',
                        }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>
                        <span>{t('goals.startDate')}: {goal.startDate}</span>
                        <span style={{ fontWeight: 500 }}>{t('goals.target')}: {goal.targetCO2} kg</span>
                        <span>{t('goals.endDate')}: {goal.endDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
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
            <h2 className="app-confirm__title">Delete this goal?</h2>
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
        /* ==========================================================
           CATEGORY-COLORED CARD — shared by Goals cards
           Uses data-category attribute for the color, data-status
           to override completed/failed states.
           ========================================================== */
        .cat-card {
          position: relative;
          padding: 24px;
          border-radius: var(--radius-lg);
          margin-bottom: 16px;
          background:
            linear-gradient(135deg,
              rgba(100,116,139,.10) 0%,
              rgba(100,116,139,.03) 100%),
            var(--bg-surface);
          border: 1px solid rgba(100,116,139,.25);
          border-left: 6px solid #64748b;
          box-shadow: 0 2px 4px rgba(0,0,0,.04);
          transition: transform .2s var(--ease-out),
                      box-shadow .2s var(--ease-out),
                      border-color .2s var(--ease),
                      background .2s var(--ease);
        }
        .cat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 26px rgba(100,116,139,.18);
        }

        /* ---------- Category: Transport (green) ---------- */
        .cat-card[data-category="Transport"] {
          background:
            linear-gradient(135deg,
              rgba(34,197,94,.12) 0%,
              rgba(34,197,94,.04) 100%),
            var(--bg-surface);
          border-color: rgba(34,197,94,.30);
          border-left-color: #22c55e;
        }
        .cat-card[data-category="Transport"]:hover {
          border-color: rgba(34,197,94,.45);
          box-shadow: 0 10px 26px rgba(34,197,94,.20);
        }

        /* ---------- Category: Electricity (blue) ---------- */
        .cat-card[data-category="Electricity"] {
          background:
            linear-gradient(135deg,
              rgba(59,130,246,.12) 0%,
              rgba(59,130,246,.04) 100%),
            var(--bg-surface);
          border-color: rgba(59,130,246,.30);
          border-left-color: #3b82f6;
        }
        .cat-card[data-category="Electricity"]:hover {
          border-color: rgba(59,130,246,.45);
          box-shadow: 0 10px 26px rgba(59,130,246,.20);
        }

        /* ---------- Category: Food (orange) ---------- */
        .cat-card[data-category="Food"] {
          background:
            linear-gradient(135deg,
              rgba(245,158,11,.14) 0%,
              rgba(245,158,11,.05) 100%),
            var(--bg-surface);
          border-color: rgba(245,158,11,.32);
          border-left-color: #f59e0b;
        }
        .cat-card[data-category="Food"]:hover {
          border-color: rgba(245,158,11,.48);
          box-shadow: 0 10px 26px rgba(245,158,11,.22);
        }

        /* ---------- Category: Shopping (purple) ---------- */
        .cat-card[data-category="Shopping"] {
          background:
            linear-gradient(135deg,
              rgba(139,92,246,.12) 0%,
              rgba(139,92,246,.04) 100%),
            var(--bg-surface);
          border-color: rgba(139,92,246,.30);
          border-left-color: #8b5cf6;
        }
        .cat-card[data-category="Shopping"]:hover {
          border-color: rgba(139,92,246,.45);
          box-shadow: 0 10px 26px rgba(139,92,246,.20);
        }

        /* ---------- Category: Overall (neutral) ---------- */
        .cat-card[data-category="Overall"] {
          background:
            linear-gradient(135deg,
              rgba(15,23,42,.08) 0%,
              rgba(15,23,42,.02) 100%),
            var(--bg-surface);
          border-color: rgba(15,23,42,.20);
          border-left-color: #0f172a;
        }

        /* ---------- Status overrides (completed / failed) ---------- */
        .cat-card[data-status="COMPLETED"] {
          --cat-color: #22c55e;
          background:
            linear-gradient(135deg,
              rgba(34,197,94,.16) 0%,
              rgba(34,197,94,.05) 100%),
            var(--bg-surface);
          border-color: rgba(34,197,94,.40);
          border-left-color: #22c55e;
        }
        .cat-card[data-status="COMPLETED"]:hover {
          border-color: rgba(34,197,94,.55);
          box-shadow: 0 10px 26px rgba(34,197,94,.24);
        }

        .cat-card[data-status="FAILED"] {
          --cat-color: #ef4444;
          background:
            linear-gradient(135deg,
              rgba(239,68,68,.14) 0%,
              rgba(239,68,68,.04) 100%),
            var(--bg-surface);
          border-color: rgba(239,68,68,.38);
          border-left-color: #ef4444;
        }
        .cat-card[data-status="FAILED"]:hover {
          border-color: rgba(239,68,68,.52);
          box-shadow: 0 10px 26px rgba(239,68,68,.22);
        }

        /* Inline edit form variant */
        .cat-card--edit {
          padding: 24px;
        }

        /* Hero text */
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
        .goal-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* Toast + modal animations */
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
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
        .app-confirm__title {
          font-size: 20px; font-weight: 700; color: var(--text-strong);
          margin: 0 0 8px; letter-spacing: -.3px;
        }
        .app-confirm__text {
          font-size: 14px; color: var(--text-muted);
          line-height: 1.55; margin: 0 0 22px;
        }
        .app-confirm__actions { display: flex; gap: 10px; }
        .app-confirm__cancel,
        .app-confirm__danger {
          flex: 1; padding: 11px 16px;
          border-radius: 10px; font-family: inherit;
          font-size: 14px; font-weight: 600;
          cursor: pointer; border: none;
          display: inline-flex; align-items: center; justify-content: center; gap: 6px;
          transition: transform .2s var(--ease-out), box-shadow .2s var(--ease-out), background .2s var(--ease);
        }
        .app-confirm__cancel { background: var(--bg-subtle); color: var(--text-body); }
        .app-confirm__cancel:hover { background: var(--border); transform: translateY(-1px); }
        .app-confirm__danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          box-shadow: 0 4px 14px rgba(239,68,68,.3);
        }
        .app-confirm__danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239,68,68,.4);
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .ui-grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 720px) {
          .ui-hero__title--module { font-size: 22px; }
          .ui-hero__subtitle--compact { font-size: 13.5px; }
          .ui-grid--4 { grid-template-columns: minmax(0, 1fr); }
          .goal-form-grid { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </Layout>
  );
};

export default Goals;