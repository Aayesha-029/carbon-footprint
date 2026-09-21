import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import { Check, X, AlertCircle } from 'lucide-react';

const InvitationAccept = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [valid, setValid] = useState(null);
  const [email, setEmail] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!token) {
      setValid(false);
      setLoading(false);
      return;
    }
    axiosClient.get(`/invitations/validate?token=${token}`)
      .then(res => {
        setValid(true);
        setEmail(res.data.email);
        setOrgName(res.data.organizationName);
      })
      .catch(err => {
        setValid(false);
        setError(err.response?.data?.error || 'Invalid invitation');
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password && password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      await axiosClient.post('/invitations/accept', {
        token,
        password: password || undefined,
        fullName: fullName || undefined,
      });
      setSuccess('✅ Invitation accepted! You can now login.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', border: '4px solid #e2e8f0', borderTop: '4px solid #22c55e', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (valid === false) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <X size={64} color="#dc2626" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>Invalid Invitation</h2>
          <p style={{ color: '#64748b' }}>{error || 'This invitation link is invalid or expired.'}</p>
          <button onClick={() => navigate('/login')} style={{ marginTop: '16px', padding: '10px 24px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#ffffff',
        borderRadius: '24px',
        padding: '40px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.12)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #22c55e, #15803d)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 12px' }}>
            <Check size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>Accept Invitation</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            You've been invited to join <strong>{orgName}</strong> ({email})
          </p>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: '10px', color: '#16a34a', fontSize: '13px', marginBottom: '16px' }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>Full Name (if new user)</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>Password (if new user)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" minLength="6" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500, color: '#475569' }}>Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
          </div>
          <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', background: submitting ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? 'Accepting...' : 'Accept Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InvitationAccept;