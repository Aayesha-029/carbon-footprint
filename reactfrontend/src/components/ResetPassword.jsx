import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Lock, Check, X } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get('token');
    if (t) setToken(t);
    else {
      setToast({ type: 'error', message: 'Invalid or missing reset token.' });
    }
  }, [location]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast({ type: '', message: '' }), 5000);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const response = await axiosClient.post(
        `/auth/reset-password?token=${token}&newPassword=${newPassword}`
      );
      if (response.data.message) {
        showToast('success', '✅ ' + response.data.message);
        setTimeout(() => navigate('/login'), 2500);
      } else if (response.data.error) {
        showToast('error', response.data.error);
      } else {
        showToast('error', 'Failed to reset password.');
      }
    } catch (error) {
      console.error('Reset error:', error);
      showToast('error', error.response?.data?.error || 'Failed to reset password.');
    }
    setLoading(false);
  };

  return (
    <div style={{ ...styles.container }}>
      <div style={styles.card}>
        {toast.message && (
          <div style={{ ...styles.toast, background: toast.type === 'success' ? '#dcfce7' : '#fef2f2', color: toast.type === 'success' ? '#16a34a' : '#dc2626' }}>
            {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
            {toast.message}
          </div>
        )}
        <div style={styles.header}>
          <div style={styles.icon}>🔑</div>
          <h1 style={styles.title}>Set New Password</h1>
          <p style={styles.sub}>Enter your new password below.</p>
        </div>
        <form onSubmit={handleReset}>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                minLength="6"
                style={styles.input}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                style={styles.input}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ ...styles.button, background: loading ? '#94a3b8' : '#16a34a' }}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <div style={styles.backLink}>
            <Link to="/login" style={{ color: '#16a34a', textDecoration: 'none' }}>← Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', padding: '24px' },
  card: { width: '100%', maxWidth: '440px', background: '#fff', borderRadius: '24px', padding: '40px', boxShadow: '0 25px 50px rgba(0,0,0,0.12)', animation: 'fadeInUp 0.5s ease' },
  toast: { padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', border: '1px solid #e2e8f0' },
  header: { textAlign: 'center', marginBottom: '32px' },
  icon: { width: '56px', height: '56px', background: 'linear-gradient(135deg, #22c55e, #15803d)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px' },
  title: { fontSize: '24px', fontWeight: 700, color: '#0f172a' },
  sub: { color: '#64748b', fontSize: '14px', marginTop: '4px' },
  field: { marginBottom: '16px' },
  label: { display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#475569' },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' },
  input: { width: '100%', padding: '10px 14px 10px 40px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' },
  eyeButton: { position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#64748b' },
  button: { width: '100%', padding: '12px', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  backLink: { textAlign: 'center', marginTop: '16px' },
};

export default ResetPassword;