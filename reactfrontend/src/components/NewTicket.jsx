import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import axiosClient from '../api/axiosClient';
import {
  Send, AlertCircle, Check, X,
  FileText
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

const NewTicket = ({ onTicketCreated }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    priority: 'MEDIUM',
    description: '',
  });

  const showToast = (type, message) => setToast({ type, message });
  const hideToast = () => setToast({ type: '', message: '' });

  useEffect(() => {
    loadCategoriesAndPriorities();
  }, []);

  const loadCategoriesAndPriorities = async () => {
    try {
      const [catRes, priRes] = await Promise.all([
        axiosClient.get('/tickets/categories'),
        axiosClient.get('/tickets/priorities')
      ]);
      setCategories(catRes.data.categories || []);
      setPriorities(priRes.data.priorities || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(['Dashboard Issue', 'Activity Logging', 'Goal Tracking', 'Analytics', 'Profile', 'Authentication', 'Bug Report', 'Feature Request', 'Other']);
      setPriorities(['LOW', 'MEDIUM', 'HIGH']);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      showToast('error', t('support.briefSummary'));
      return;
    }

    if (!formData.category) {
      showToast('error', t('support.selectCategory'));
      return;
    }

    if (!formData.description.trim()) {
      showToast('error', t('support.describeIssue'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        subject: formData.subject,
        category: formData.category,
        priority: formData.priority,
        description: formData.description,
      };

      const response = await axiosClient.post('/tickets', payload);

      if (response.data.success) {
        showToast('success', '✅ ' + t('support.created'));
        window.dispatchEvent(new Event('ticketCreated'));
        window.dispatchEvent(new Event('notificationReceived'));

        setFormData({
          subject: '',
          category: '',
          priority: 'MEDIUM',
          description: '',
        });

        if (onTicketCreated) onTicketCreated();
      } else {
        showToast('error', response.data.error || t('common.error'));
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      if (error.response?.status === 401) {
        showToast('error', '⚠️ Please login again to submit a ticket');
      } else if (error.response?.data?.error) {
        showToast('error', error.response.data.error);
      } else {
        showToast('error', t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority) => {
    switch(priority) {
      case 'HIGH': return '🔴 ' + t('support.high');
      case 'MEDIUM': return '🟡 ' + t('support.medium');
      case 'LOW': return '🟢 ' + t('support.low');
      default: return priority;
    }
  };

  return (
    <>
      <Toast type={toast.type} message={toast.message} onClose={hideToast} />

      <div className="ui-card ui-card--pad-lg" style={{ maxWidth: 820 }}>
        <div className="ui-card__head">
          <div>
            <h3 className="ui-card__title">
              <FileText size={18} color="var(--green-600)" />
              {t('support.createTicket')}
            </h3>
            <p className="ui-card__subtitle">
              {t('support.description')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ui-field">
            <label className="ui-field__label">
              {t('support.subject')} <span className="ui-field__req">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              placeholder={t('support.briefSummary')}
              className="ui-input"
              required
            />
          </div>

          <div className="newticket-form-row">
            <div className="ui-field">
              <label className="ui-field__label">
                {t('support.category')} <span className="ui-field__req">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="ui-select"
                required
              >
                <option value="">{t('support.selectCategory')}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="ui-field">
              <label className="ui-field__label">
                {t('support.priority')} <span className="ui-field__req">*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="ui-select"
                required
              >
                {priorities.map((pri) => (
                  <option key={pri} value={pri}>
                    {getPriorityLabel(pri)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ui-field">
            <label className="ui-field__label">
              {t('support.description')} <span className="ui-field__req">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('support.describeIssue')}
              rows="5"
              className="ui-textarea"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg"
          >
            {loading ? (
              <>
                <span className="ui-btn__spinner" />
                {t('common.loading')}
              </>
            ) : (
              <>
                <Send size={18} />
                {t('support.submit')}
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        .newticket-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (max-width: 720px) {
          .newticket-form-row { grid-template-columns: minmax(0, 1fr); }
        }
      `}</style>
    </>
  );
};

export default NewTicket;