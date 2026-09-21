import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Car, Plane, Bus, Bike,
  Zap, Wind,
  Beef, Utensils, Fish,
  ShoppingBag, Shirt, Smartphone, Sofa, BookOpen,
  Trash2, Leaf, Activity, CheckCircle, XCircle, RefreshCw, AlertCircle,
  AlertTriangle
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
    success: {
      background: 'var(--pill-success-bg)',
      border: '1px solid var(--tint-border)',
      color: 'var(--pill-success-fg)',
      icon: <CheckCircle size={20} />
    },
    error: {
      background: 'var(--pill-danger-bg)',
      border: '1px solid rgba(239,68,68,.28)',
      color: 'var(--pill-danger-fg)',
      icon: <XCircle size={20} />
    },
    info: {
      background: 'var(--pill-info-bg)',
      border: '1px solid rgba(59,130,246,.28)',
      color: 'var(--pill-info-fg)',
      icon: <AlertCircle size={20} />
    }
  };

  const style = styles[type] || styles.info;

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      right: 24,
      zIndex: 9999,
      padding: '16px 24px',
      borderRadius: 12,
      boxShadow: '0 10px 40px rgba(0,0,0,.15)',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      minWidth: 320,
      maxWidth: 500,
      animation: 'slideInRight .4s var(--ease-out)',
      ...style
    }}>
      {style.icon}
      <span style={{ fontSize: 14, fontWeight: 500, flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'inherit', opacity: .6, padding: 4 }}>×</button>
    </div>
  );
};

const ActivityLog = () => {
  const { t } = useLanguage();
  const translateActivityType = (type) => {
    const camelKey = type
      .split(' ')
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join('');
    const translationKey = `activity.${camelKey}`;
    const translated = t(translationKey);
    return translated === translationKey ? type : translated;
  };
  const [activeCategory, setActiveCategory] = useState('transport');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [formData, setFormData] = useState({
    activityType: '',
    quantity: '',
    unit: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [confirmDelete, setConfirmDelete] = useState({
    show: false,
    id: null,
    type: '',
    quantity: '',
    unit: '',
  });

  const categories = [
    { id: 'transport', label: t('activity.transport'), icon: Car, color: '#22c55e', backendCategory: 'Transport' },
    { id: 'electricity', label: t('activity.electricity'), icon: Zap, color: '#3b82f6', backendCategory: 'Electricity' },
    { id: 'food', label: t('activity.food'), icon: Utensils, color: '#f59e0b', backendCategory: 'Food' },
    { id: 'shopping', label: t('activity.shopping'), icon: ShoppingBag, color: '#8b5cf6', backendCategory: 'Shopping' },
  ];

  const activityTypes = {
    transport: ['Car', 'Flight', 'Public Transit', 'Bike', 'Walk'],
    electricity: ['Grid', 'Solar', 'Wind', 'Hydro'],
    food: ['Beef', 'Chicken', 'Pork', 'Fish', 'Vegetarian', 'Vegan'],
    shopping: ['Clothing', 'Electronics', 'Furniture', 'Books'],
  };

  const units = {
    transport: ['km', 'miles'],
    electricity: ['kWh'],
    food: ['serving', 'meal'],
    shopping: ['USD', 'EUR'],
  };

  const unitLabels = {
    'km': t('activity.kilometers'),
    'miles': t('activity.miles'),
    'kWh': t('activity.kWh'),
    'serving': t('activity.serving'),
    'meal': t('activity.meal'),
    'USD': t('activity.usd'),
    'EUR': t('activity.eur')
  };

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  const getCurrentUser = () => {
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');
    return { userId, userName };
  };

  const recalculateGoals = async (userId) => {
    if (!userId) return;
    try {
      console.log('🔄 Recalculating goals for user:', userId);
      await axiosClient.post(`/goals/user/${userId}/recalculate-all`);
      window.dispatchEvent(new Event('goalUpdated'));
    } catch (error) {
      console.error('Error recalculating goals:', error);
    }
  };

  const loadActivities = async () => {
    const { userId } = getCurrentUser();
    if (!userId) {
      setActivities([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const response = await axiosClient.get(`/activities/user/${userId}`);
      setActivities(response.data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
      if (error.response?.status === 401) {
        showToast('error', 'Session expired. Please login again.');
      } else {
        showToast('error', 'Failed to load activities. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    const handleActivityLogged = () => loadActivities();
    window.addEventListener('activityLogged', handleActivityLogged);
    return () => window.removeEventListener('activityLogged', handleActivityLogged);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setConfirmDelete({ show: false, id: null, type: '', quantity: '', unit: '' });
      }
    };
    if (confirmDelete.show) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [confirmDelete.show]);

  const handleCategoryChange = (categoryId) => {
    setActiveCategory(categoryId);
    setFormData(prev => ({
      ...prev,
      activityType: '',
      unit: '',
      quantity: '',
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      activityType: '',
      quantity: '',
      unit: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const { userId } = getCurrentUser();

    if (!userId) {
      showToast('error', 'Please login first to log activities.');
      setSubmitting(false);
      return;
    }

    if (!formData.activityType) {
      showToast('error', 'Please select an activity type.');
      setSubmitting(false);
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      showToast('error', 'Please enter a valid quantity.');
      setSubmitting(false);
      return;
    }

    if (!formData.unit) {
      showToast('error', 'Please select a unit.');
      setSubmitting(false);
      return;
    }

    try {
      const categoryObj = categories.find(c => c.id === activeCategory);
      const categoryLabel = categoryObj ? categoryObj.backendCategory : activeCategory;

      const payload = {
        userId: parseInt(userId),
        category: categoryLabel,
        activityType: formData.activityType,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        date: formData.date,
        notes: formData.notes || '',
      };

      const response = await axiosClient.post('/activities', payload);

      if (response.data.success) {
        showToast('success', `✅ ${t('activity.logged')}! CO₂e: ${response.data.co2eKg} kg`);
        resetForm();
        await loadActivities();
        await recalculateGoals(userId);
        window.dispatchEvent(new Event('activityLogged'));
        window.dispatchEvent(new Event('goalUpdated'));
        window.dispatchEvent(new Event('notificationReceived'));
      } else {
        showToast('error', `❌ ${response.data.error || 'Failed to log activity'}`);
      }
    } catch (error) {
      console.error('Error logging activity:', error);
      if (error.response?.status === 401) {
        showToast('error', 'Session expired. Please login again.');
      } else if (error.response?.data?.error) {
        showToast('error', `❌ ${error.response.data.error}`);
      } else {
        showToast('error', '❌ Failed to log activity. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (activity) => {
    setConfirmDelete({
      show: true,
      id: activity.id,
      type: activity.activityType || '',
      quantity: activity.quantity,
      unit: activity.unit,
    });
  };

  const closeConfirmDelete = () => {
    if (deletingId) return;
    setConfirmDelete({ show: false, id: null, type: '', quantity: '', unit: '' });
  };

  const executeDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return;

    setDeletingId(id);

    const { userId } = getCurrentUser();
    try {
      const response = await axiosClient.delete(`/activities/${id}/user/${userId}`);

      if (response.data.success) {
        showToast('success', `✅ ${t('activity.deleted')}`);
        await loadActivities();
        await recalculateGoals(userId);
        window.dispatchEvent(new Event('activityLogged'));
        window.dispatchEvent(new Event('goalUpdated'));
        window.dispatchEvent(new Event('notificationReceived'));
      } else {
        showToast('error', `❌ ${response.data.error || 'Failed to delete activity'}`);
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      if (error.response?.status === 401) {
        showToast('error', 'Session expired. Please login again.');
      } else if (error.response?.data?.error) {
        showToast('error', `❌ ${error.response.data.error}`);
      } else {
        showToast('error', '❌ Failed to delete activity. Please try again.');
      }
    } finally {
      setDeletingId(null);
      setConfirmDelete({ show: false, id: null, type: '', quantity: '', unit: '' });
    }
  };

  const quickLogs = [
    { icon: Car, label: t('activity.carTrip'), category: 'transport', type: 'Car', unit: 'km', color: '#22c55e' },
    { icon: Plane, label: t('activity.flight'), category: 'transport', type: 'Flight', unit: 'km', color: '#22c55e' },
    { icon: Bus, label: t('activity.publicTransit'), category: 'transport', type: 'Public Transit', unit: 'km', color: '#22c55e' },
    { icon: Zap, label: t('activity.electricityUsage'), category: 'electricity', type: 'Grid', unit: 'kWh', color: '#3b82f6' },
    { icon: Beef, label: t('activity.beefMeal'), category: 'food', type: 'Beef', unit: 'meal', color: '#f59e0b' },
    { icon: ShoppingBag, label: t('activity.shoppingTrip'), category: 'shopping', type: 'Clothing', unit: 'USD', color: '#8b5cf6' },
  ];

  const handleQuickLog = (log) => {
    setActiveCategory(log.category);
    setFormData({
      activityType: log.type,
      quantity: '1',
      unit: log.unit,
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const totalCO2 = activities.reduce((sum, a) => sum + parseFloat(a.co2eKg || 0), 0);
  const totalActivities = activities.length;

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

  const { userName } = getCurrentUser();

  return (
    <Layout userRole="user">
      <Toast type={toast.type} message={toast.message} onClose={hideToast} />

      <div className="ui-fade-in-up">

        {/* --- UI: hero with new deep emerald gradient --- */}
       <div className="ui-hero ui-hero--brand" style={{ marginBottom: 24 }}>
          <div className="ui-hero__blob ui-hero__blob--1" />
          <div className="ui-hero__blob ui-hero__blob--2" />
          <div className="ui-hero__inner">
            <div className="ui-hero__left">
              <div className="ui-hero__icon"><Activity size={24} /></div>
              <div className="ui-hero__text">
               <h1 className="ui-hero__title ui-hero__title--module">{t('bannerTitles.activityLogging')}</h1>
                <p className="ui-hero__subtitle">
                  {userName ? `${t('common.welcome')}, ${userName}! ` : ''}
                  {t('dashboard.trackYourFootprint')} ({totalActivities} {t('activity.totalActivities')}, {totalCO2.toFixed(2)} kg CO₂e)
                </p>
              </div>
            </div>
            <div className="ui-hero__actions">
              <button className="ui-btn ui-btn--hero" onClick={loadActivities}>
                <RefreshCw size={16} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* --- UI: two summary cards --- */}
        <div className="activity-stats">
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #22c55e' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--green"><Activity size={20} /></div>
            </div>
            <div className="ui-stat__value">{totalActivities}</div>
            <div className="ui-stat__label">{t('activity.totalActivities')}</div>
          </div>
          <div className="ui-card ui-card--hover ui-stat" style={{ borderTop: '3px solid #3b82f6' }}>
            <div className="ui-stat__top">
              <div className="ui-stat__icon ui-stat__icon--blue"><Leaf size={20} /></div>
            </div>
            <div className="ui-stat__value">
              {totalCO2.toFixed(2)}<span style={{ fontSize: 14, marginLeft: 4 }}>kg</span>
            </div>
            <div className="ui-stat__label">{t('dashboard.totalCO2')}</div>
          </div>
        </div>

        {/* --- UI: Quick Log --- */}
        <div className="ui-card ui-card--pad-lg activity-quicklog">
          <div className="ui-card__head" style={{ marginBottom: 16 }}>
            <div>
              <h3 className="ui-card__title">
                <Zap size={18} color="var(--green-600)" />
                {t('activity.quickLog')}
              </h3>
              <p className="ui-card__subtitle">
                One-tap logging for common activities
              </p>
            </div>
          </div>
          <div className="activity-quicklog__grid">
            {quickLogs.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickLog(item)}
                  className="activity-quicklog__btn"
                  style={{ '--ql-color': item.color }}
                >
                  <Icon size={22} style={{ color: item.color }} />
                  <span className="activity-quicklog__label">{item.label}</span>
                  <span className="activity-quicklog__sub">1 {item.unit}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- UI: Form | Recent --- */}
        <div className="activity-split">

          <div className="ui-card ui-card--pad-lg">
            <h3 className="ui-card__title" style={{ marginBottom: 18 }}>
              <Leaf size={18} color="var(--green-600)" />
              {t('activity.logNew')}
            </h3>

            <div className="activity-cat-grid">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`activity-cat ${isActive ? 'is-active' : ''}`}
                    style={{ '--cat-color': cat.color }}
                  >
                    <Icon size={20} style={{ color: cat.color }} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="ui-field">
                <label className="ui-field__label">
                  {t('activity.activityType')} <span className="ui-field__req">*</span>
                </label>
                <select
                  name="activityType"
                  value={formData.activityType}
                  onChange={handleInputChange}
                  className="ui-select"
                  required
                >
                  <option value="">{t('activity.selectActivity')}</option>
                  {activityTypes[activeCategory]?.map((type) => (
                    <option key={type} value={type}>{translateActivityType(type)}</option>
                  ))}
                </select>
              </div>

              <div className="activity-form-row">
                <div className="ui-field">
                  <label className="ui-field__label">
                    {t('activity.quantity')} <span className="ui-field__req">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="ui-input"
                    placeholder="0.00"
                    required
                    min="0.01"
                    step="0.01"
                  />
                </div>
                <div className="ui-field">
                  <label className="ui-field__label">
                    {t('activity.unit')} <span className="ui-field__req">*</span>
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="ui-select"
                    required
                  >
                    <option value="">{t('activity.selectUnit')}</option>
                    {units[activeCategory]?.map((unit) => (
                      <option key={unit} value={unit}>{unitLabels[unit] || unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ui-field">
                <label className="ui-field__label">{t('activity.date')}</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="ui-input"
                  required
                />
              </div>

              <div className="ui-field">
                <label className="ui-field__label">{t('activity.notes')}</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="ui-input"
                  placeholder="Add any notes..."
                />
              </div>

              <button
                type="submit"
                className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="ui-btn__spinner" />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <Leaf size={18} />
                    {t('activity.logNew')}
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="ui-card ui-card--pad-lg">
            <div className="ui-card__head">
              <div>
                <h3 className="ui-card__title">
                  <Activity size={18} color="var(--green-600)" />
                  {t('dashboard.recentActivities')}
                </h3>
                <p className="ui-card__subtitle">
                  {activities.length} {t('activity.totalActivities')}
                </p>
              </div>
              <span className="ui-pill ui-pill--success">
                <span className="ui-pill__dot" />
                {totalCO2.toFixed(2)} kg
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="ui-state">
                <div className="ui-state__icon"><Leaf size={28} /></div>
                <p className="ui-state__title">{t('dashboard.noActivitiesYet')}</p>
                <p className="ui-state__text">
                  {t('dashboard.trackYourFootprint')}
                </p>
              </div>
            ) : (
              <div className="activity-recent-list ui-scroll">
               {activities.slice(0, 12).map((activity) => {
  const cat = activity.category;
  const pillStyle =
    cat === 'Transport'   ? { background: 'rgba(34,197,94,.14)',  color: '#15803d', borderColor: 'rgba(34,197,94,.28)' } :
    cat === 'Electricity' ? { background: 'rgba(59,130,246,.14)', color: '#1d4ed8', borderColor: 'rgba(59,130,246,.28)' } :
    cat === 'Food'        ? { background: 'rgba(245,158,11,.14)', color: '#b45309', borderColor: 'rgba(245,158,11,.28)' } :
    cat === 'Shopping'    ? { background: 'rgba(139,92,246,.14)', color: '#8b5cf6', borderColor: 'rgba(139,92,246,.28)' } :
    { background: 'var(--pill-neutral-bg)', color: 'var(--pill-neutral-fg)', borderColor: 'var(--border)' };
  return (
                    <div key={activity.id} className="activity-recent-item">
                      <div className="activity-recent-item__main">
                        <div className="activity-recent-item__title">
                          {activity.activityType}
                          <span className="activity-recent-item__qty">
                            {activity.quantity} {activity.unit}
                          </span>
                        </div>
                        <div className="activity-recent-item__meta">
                          <span className="ui-pill" style={pillStyle}>
  <span className="ui-pill__dot" />
  {translateActivityType(cat || '')}
</span>
                          <span className="activity-recent-item__date">
                            {activity.logDate}
                          </span>
                          {activity.notes && (
                            <span className="activity-recent-item__notes">
                              {activity.notes}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="activity-recent-item__right">
                        <div className="activity-recent-item__co2">
                          {parseFloat(activity.co2eKg || 0).toFixed(2)}
                          <span> kg</span>
                        </div>
                        <button
                          onClick={() => requestDelete(activity)}
                          disabled={deletingId === activity.id}
                          className="ui-btn ui-btn--ghost ui-btn--icon ui-btn--sm activity-recent-item__del"
                          aria-label="Delete activity"
                        >
                          {deletingId === activity.id ? (
                            <span className="ui-spinner ui-spinner--sm" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- UI: Delete confirmation modal --- */}
      {confirmDelete.show && (
        <div className="app-confirm-overlay" onClick={closeConfirmDelete}>
          <div className="app-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="app-confirm__icon">
              <AlertTriangle size={28} color="var(--pill-danger-fg)" />
            </div>

            <h2 className="app-confirm__title">Delete this activity?</h2>

            <p className="app-confirm__text">
              {confirmDelete.type
                ? <>You're about to permanently delete <strong>{confirmDelete.type}</strong>
                  {confirmDelete.quantity ? <> · {confirmDelete.quantity} {confirmDelete.unit}</> : null}.
                  This action cannot be undone.</>
                : 'This action cannot be undone.'}
            </p>

            <div className="app-confirm__actions">
              <button
                type="button"
                className="app-confirm__cancel"
                onClick={closeConfirmDelete}
                disabled={deletingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                className="app-confirm__danger"
                onClick={executeDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? (
                  <>
                    <span className="ui-btn__spinner" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- UI: local layout CSS --- */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes confirmPop {
          from { opacity: 0; transform: scale(.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes overlayFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* ============ DEEP EMERALD HERO ============ 
        .ui-hero--emerald {
          background: linear-gradient(135deg, #064e3b 0%, #047857 45%, #059669 100%) !important;
          box-shadow: 0 10px 30px rgba(4, 120, 87, .30) !important;
        }
        .ui-hero--emerald .ui-hero__blob--1 { background: rgba(255,255,255,.30); }
        .ui-hero--emerald .ui-hero__blob--2 { background: rgba(16,185,129,.75); }*/
        /* ============ BRAND HERO — matches sidebar active tab ============ */
.ui-hero--brand {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%) !important;
  box-shadow: 0 6px 16px rgba(22, 163, 74, .35) !important;
}
.ui-hero--brand .ui-hero__blob--1 { background: rgba(255, 255, 255, .35); }
.ui-hero--brand .ui-hero__blob--2 { background: rgba(74, 222, 128, .85); }

        /* ============ STAT CARDS ============ */
        .activity-stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 24px;
        }

        /* ============ QUICK LOG ============ */
        .activity-quicklog { margin-bottom: 24px; }
        .activity-quicklog__grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 10px;
        }
        .activity-quicklog__btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 14px 10px;
          background: var(--bg-surface);
          border: 1.5px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          text-align: center;
          transition: transform .2s var(--ease-out),
                      border-color .2s var(--ease),
                      background .2s var(--ease),
                      box-shadow .2s var(--ease);
        }
        .activity-quicklog__btn:hover {
          transform: translateY(-2px);
          border-color: var(--ql-color);
          background: var(--tint-1);
          box-shadow: 0 8px 20px rgba(0,0,0,.06);
        }
        .activity-quicklog__label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-strong);
          line-height: 1.2;
        }
        .activity-quicklog__sub {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
        }

        /* ============ SPLIT ============ */
        .activity-split {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
          gap: 20px;
          align-items: start;
        }

        /* ============ CATEGORY PICKER ============ */
        .activity-cat-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
          margin-bottom: 20px;
        }
        .activity-cat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 6px;
          border: 2px solid var(--border);
          background: var(--bg-surface);
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          transition: all .2s var(--ease);
        }
        .activity-cat:hover { border-color: var(--cat-color); }
        .activity-cat.is-active {
          border-color: var(--cat-color);
          background: color-mix(in srgb, var(--cat-color) 10%, transparent);
          color: var(--text-strong);
          font-weight: 700;
        }

        /* ============ FORM ROW ============ */
        .activity-form-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 16px;
        }

        /* ============ RECENT ============ */
        .activity-recent-list {
          max-height: 520px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .activity-recent-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }
        .activity-recent-item:last-child { border-bottom: none; }
        .activity-recent-item__main { min-width: 0; flex: 1; }
        .activity-recent-item__title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-strong);
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .activity-recent-item__qty {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
        }
        .activity-recent-item__meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          flex-wrap: wrap;
        }
        .activity-recent-item__date {
          font-size: 12px;
          color: var(--text-muted);
        }
        .activity-recent-item__notes {
          font-size: 12px;
          color: var(--text-muted);
          font-style: italic;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 200px;
        }
        .activity-recent-item__right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .activity-recent-item__co2 {
          font-size: 14px;
          font-weight: 700;
          color: var(--green-700);
          white-space: nowrap;
        }
        .activity-recent-item__co2 span {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
        }
        .activity-recent-item__del { color: var(--pill-danger-fg); }

        /* ============ DELETE CONFIRM ============ */
        .app-confirm-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(6, 20, 12, .55);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          animation: overlayFade .2s var(--ease) both;
        }
        .app-confirm {
          width: 100%;
          max-width: 420px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 28px 24px 22px;
          text-align: center;
          box-shadow: 0 25px 60px rgba(0,0,0,.28);
          animation: confirmPop .28s var(--ease-pop) both;
        }
        .app-confirm__icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--pill-danger-bg);
          display: grid;
          place-items: center;
          margin: 0 auto 18px;
          border: 2px solid rgba(239,68,68,.28);
        }
        .app-confirm__title {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-strong);
          margin: 0 0 8px;
          letter-spacing: -.3px;
        }
        .app-confirm__text {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.55;
          margin: 0 0 22px;
        }
        .app-confirm__text strong {
          color: var(--text-strong);
          font-weight: 700;
        }
        .app-confirm__actions { display: flex; gap: 10px; }
        .app-confirm__cancel,
        .app-confirm__danger {
          flex: 1;
          padding: 11px 16px;
          border-radius: 10px;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: transform .2s var(--ease-out),
                      box-shadow .2s var(--ease-out),
                      background .2s var(--ease);
        }
        .app-confirm__cancel {
          background: var(--bg-subtle);
          color: var(--text-body);
        }
        .app-confirm__cancel:hover:not(:disabled) {
          background: var(--border);
          transform: translateY(-1px);
        }
        .app-confirm__danger {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: #fff;
          box-shadow: 0 4px 14px rgba(239,68,68,.3);
        }
        .app-confirm__danger:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(239,68,68,.4);
        }
        .app-confirm__cancel:disabled,
        .app-confirm__danger:disabled {
          opacity: .6;
          cursor: not-allowed;
          transform: none !important;
        }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 1100px) {
          .activity-quicklog__grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (max-width: 960px) {
          .activity-split { grid-template-columns: minmax(0, 1fr); }
          .activity-recent-list { max-height: 420px; }
        }
        @media (max-width: 640px) {
          .activity-stats { grid-template-columns: minmax(0, 1fr); }
          .activity-quicklog__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .activity-cat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .activity-form-row { grid-template-columns: minmax(0, 1fr); }
          .app-confirm { padding: 24px 20px 20px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .app-confirm,
          .app-confirm-overlay { animation: none !important; }
          .activity-quicklog__btn,
          .activity-cat,
          .app-confirm__cancel,
          .app-confirm__danger { transition: none !important; }
        }
      `}</style>
    </Layout>
  );
};

export default ActivityLog;