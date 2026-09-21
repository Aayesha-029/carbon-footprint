import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { ArrowLeft, Mail, Check, X } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 5000);
  };

  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      showToast('error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosClient.post('/auth/forgot-password', { email: trimmedEmail });
      if (response.data.message) {
        showToast('success', '✅ ' + response.data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else if (response.data.error) {
        showToast('error', response.data.error);
      } else {
        showToast('info', 'If an account exists, you will receive reset instructions.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      console.error(error);
      showToast('error', 'Failed to send reset link. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {toast.message && (
          <div style={{ ...styles.toast, background: toast.type === 'success' ? '#dcfce7' : '#fef2f2', color: toast.type === 'success' ? '#16a34a' : '#dc2626' }}>
            {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
            {toast.message}
          </div>
        )}
        <div style={styles.header}>
          <div style={styles.icon}>🔑</div>
          <h1 style={styles.title}>Reset Password</h1>
          <p style={styles.sub}>Enter your email to receive a reset link.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={styles.input}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...styles.button, background: loading ? '#94a3b8' : '#16a34a' }}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <div style={styles.backLink}>
            <Link to="/login" style={{ color: '#16a34a', textDecoration: 'none' }}>
              <ArrowLeft size={16} style={{ verticalAlign: 'middle' }} /> Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', padding: '24px' },
  card: { width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.12)' },
  toast: { padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', border: '1px solid #e2e8f0' },
  header: { textAlign: 'center', marginBottom: '32px' },
  icon: { width: '56px', height: '56px', background: 'linear-gradient(135deg, #22c55e, #15803d)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#0f172a' },
  sub: { color: '#64748b', fontSize: '14px', marginTop: '4px' },
  field: { marginBottom: '20px' },
  label: { display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#475569' },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  input: { width: '100%', padding: '10px 14px 10px 40px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' },
  button: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer' },
  backLink: { textAlign: 'center', marginTop: '16px' },
};

export default ForgotPassword;