import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import axiosClient from '../api/axiosClient';
import {
  Leaf, Mail, Lock, User, Eye, EyeOff, ArrowLeft, ArrowRight,
  LineChart, Target, Globe, Check, AlertCircle, Building2,
  TrendingDown, Users,
} from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, loading: settingsLoading } = useSettings();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  const appName = settings?.appName || 'Carbon Tracker';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('register') === 'true') setIsLogin(false);
    if (params.get('switch') === 'true') {
      ['token', 'userRole', 'userName', 'userId', 'userEmail'].forEach((k) => localStorage.removeItem(k));
    }
  }, [location]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('switch') === 'true') return;
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && !redirecting) {
      setRedirecting(true);
      if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
      else if (role === 'ORGANIZER') navigate('/organizer/dashboard', { replace: true });
      else navigate('/dashboard', { replace: true });
    }
  }, [navigate, redirecting, location]);

  const isValidEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const clearForm = () => {
    setEmail(''); setPassword(''); setFullName(''); setError(''); setSuccessMessage('');
  };

  const switchMode = () => { setIsLogin(!isLogin); clearForm(); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccessMessage('');
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!isValidEmail(trimmedEmail)) { setError('Please enter a valid email address'); setLoading(false); return; }
    if (!trimmedPassword || trimmedPassword.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
    if (!isLogin) {
      const trimmedFullName = fullName.trim();
      if (!trimmedFullName || trimmedFullName.length < 2) { setError('Please enter your full name'); setLoading(false); return; }
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const data = isLogin
        ? { email: trimmedEmail, password: trimmedPassword }
        : { email: trimmedEmail, password: trimmedPassword, fullName: fullName.trim() };

      const response = await axiosClient.post(endpoint, data);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const user = response.data.user;
        const role = user?.role || 'USER';
        const userName = user?.fullName || 'User';
        const userId = user?.id;
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', userName);
        if (userId) localStorage.setItem('userId', userId.toString());
        if (user?.email) localStorage.setItem('userEmail', user.email);

        clearForm();
        setSuccessMessage(isLogin ? '✅ Login successful!' : '✅ Registration successful!');

        setTimeout(() => {
          setSuccessMessage(''); setLoading(false); setRedirecting(true);
          if (role === 'ADMIN') navigate('/admin/dashboard', { replace: true });
          else if (role === 'ORGANIZER') navigate('/organizer/dashboard', { replace: true });
          else navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        setError(response.data.error || 'Something went wrong');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Error:', err);
      if (err.code === 'ERR_NETWORK') setError('⚠️ Cannot connect to backend.');
      else if (err.response) setError(err.response.data?.error || err.response.data?.message || 'Something went wrong');
      else setError('An unexpected error occurred.');
      setLoading(false);
    }
  };

  if (settingsLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
        <div className="spinner" style={{
          width: '48px', height: '48px',
          border: '4px solid #dcfce7', borderTop: '4px solid #16a34a',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  const features = [
    { icon: LineChart, title: 'Daily & weekly trends', desc: 'Track where your footprint comes from' },
    { icon: Target, title: 'Personalized goals', desc: 'Small changes celebrated, repeated' },
    { icon: Globe, title: 'Real-world impact', desc: 'Understand your footprint globally' },
  ];

  return (
    <div className="auth-page">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeSlideRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulseSoft { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
        @keyframes barGrow { from { height: 4px; opacity: 0.4; } }
        @keyframes floatSoft { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes rotateBlob {
          0%   { transform: translate(0, 0) scale(1); }
          50%  { transform: translate(30px, -20px) scale(1.08); }
          100% { transform: translate(0, 0) scale(1); }
        }

        html, body { overflow: hidden; }

        .auth-page {
          height: 100vh;
          max-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        /* ================= LEFT PANEL ================= */
        .auth-left {
          position: relative;
          padding: 32px 56px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          overflow: hidden;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%);
          animation: fadeSlideLeft 0.6s ease;
        }

        .auth-left-pattern {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 15% 20%, rgba(22,163,74,0.10), transparent 40%),
            radial-gradient(circle at 85% 75%, rgba(74,222,128,0.10), transparent 42%),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='3' cy='3' r='1.2' fill='%2316a34a' opacity='0.08'/><circle cx='19' cy='19' r='1.2' fill='%2316a34a' opacity='0.08'/></svg>");
          background-size: auto, auto, 32px 32px;
          pointer-events: none;
          z-index: 0;
        }

        .auth-left-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          z-index: 0;
        }
        .auth-left-blob.b1 {
          width: 380px; height: 380px;
          top: -140px; right: -120px;
          background: rgba(134, 239, 172, 0.5);
          animation: rotateBlob 16s ease-in-out infinite;
        }
        .auth-left-blob.b2 {
          width: 320px; height: 320px;
          bottom: -120px; left: -100px;
          background: rgba(74, 222, 128, 0.4);
          animation: rotateBlob 20s ease-in-out infinite reverse;
        }
        .auth-left-blob.b3 {
          width: 220px; height: 220px;
          top: 30%; right: -60px;
          background: rgba(190, 242, 100, 0.5);
          animation: rotateBlob 14s ease-in-out infinite;
        }

        .auth-left-inner {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          max-width: 480px;
          height: 100%;
          padding: 8px 0;
        }

        .auth-back {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #15803d;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          padding: 7px 14px 7px 12px;
          border-radius: 100px;
          background: rgba(255,255,255,0.8);
          border: 1px solid rgba(22,163,74,0.25);
          transition: all 0.25s ease;
          cursor: pointer;
          margin-bottom: 18px;
          align-self: flex-start;
          font-family: inherit;
          backdrop-filter: blur(6px);
        }
        .auth-back:hover {
          color: #0f172a;
          background: #ffffff;
          transform: translateX(-3px);
          border-color: #16a34a;
          box-shadow: 0 6px 16px rgba(22,163,74,0.18);
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 22px;
        }

        .auth-brand-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(22, 163, 74, 0.3);
        }

        .auth-brand-text {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.4px;
          color: #0f172a;
        }

        .auth-headline {
          font-size: 38px;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -1.4px;
          margin-bottom: 12px;
          color: #0f172a;
          white-space: nowrap;
        }
        .auth-headline .accent {
          display: inline-block;
          background: linear-gradient(135deg, #16a34a, #15803d);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-subline {
          font-size: 14.5px;
          line-height: 1.55;
          color: #475569;
          margin-bottom: 22px;
          max-width: 400px;
          font-weight: 500;
        }

        .auth-preview {
          background: #ffffff;
          border: 1px solid rgba(22,163,74,0.22);
          border-radius: 16px;
          padding: 16px 18px;
          margin-bottom: 18px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 12px 32px rgba(22,163,74,0.10), 0 2px 6px rgba(22,163,74,0.06);
          animation: floatSoft 6s ease-in-out infinite;
        }
        .auth-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .auth-preview-label {
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.4px;
          text-transform: uppercase;
          color: #15803d;
        }
        .auth-preview-live {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          background: #dcfce7;
          border-radius: 100px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 1px;
          color: #15803d;
        }
        .auth-preview-live-dot {
          width: 5px; height: 5px;
          background: #16a34a;
          border-radius: 50%;
          animation: pulseSoft 1.4s ease-in-out infinite;
        }
        .auth-preview-metric {
          display: flex;
          align-items: baseline;
          gap: 7px;
          margin-bottom: 12px;
        }
        .auth-preview-value {
          font-size: 30px;
          font-weight: 800;
          letter-spacing: -1px;
          color: #0f172a;
        }
        .auth-preview-unit {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }
        .auth-preview-change {
          padding: 3px 8px;
          background: #dcfce7;
          border-radius: 100px;
          font-size: 10.5px;
          font-weight: 800;
          color: #15803d;
          display: inline-flex;
          align-items: center;
          gap: 3px;
        }
        .auth-preview-bars {
          display: flex;
          align-items: flex-end;
          gap: 4px;
          height: 38px;
          margin-bottom: 5px;
        }
        .auth-preview-bar {
          flex: 1;
          background: #e2e8f0;
          border-radius: 3px 3px 2px 2px;
          animation: barGrow 0.7s ease-out;
        }
        .auth-preview-bar.hi {
          background: linear-gradient(180deg, #16a34a, #15803d);
          box-shadow: 0 0 10px rgba(22,163,74,0.4);
        }
        .auth-preview-days {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }

        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 18px;
          width: 100%;
          max-width: 400px;
        }

        .auth-feature {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 11px 16px;
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(22,163,74,0.20);
          border-radius: 12px;
          backdrop-filter: blur(8px);
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .auth-feature:hover {
          background: #ffffff;
          transform: translateX(5px);
          border-color: #16a34a;
          box-shadow: 0 8px 22px rgba(22,163,74,0.15);
        }

        .auth-feature-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(22,163,74,0.28);
        }

        .auth-feature-text {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .auth-feature-text small {
          display: block;
          font-size: 11.5px;
          font-weight: 500;
          color: #64748b;
          margin-top: 1px;
        }

        .auth-tagline {
          font-size: 10.5px;
          font-weight: 800;
          color: #15803d;
          letter-spacing: 3px;
          text-transform: uppercase;
          opacity: 0.75;
        }

        /* ================= RIGHT PANEL ================= */
        .auth-right {
          padding: 32px 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%);
          animation: fadeSlideRight 0.6s ease;
          overflow: hidden;
          position: relative;
        }

        .auth-right::before {
          content: '';
          position: absolute;
          top: -100px;
          right: -100px;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(22,163,74,0.08), transparent 70%);
          pointer-events: none;
        }

        .auth-form-wrap {
          width: 100%;
          max-width: 440px;
          position: relative;
          z-index: 1;
          background: #ffffff;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 30px 80px rgba(15,23,42,0.08), 0 8px 24px rgba(15,23,42,0.04);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .auth-form-heading {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          margin-bottom: 6px;
        }
        .auth-form-sub {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 22px;
          line-height: 1.5;
        }

        .auth-tabs {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: #f1f5f9;
          border-radius: 12px;
          margin-bottom: 22px;
        }
        .auth-tab {
          flex: 1;
          padding: 10px 14px;
          border: none;
          border-radius: 9px;
          background: transparent;
          font-size: 13.5px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
        }
        .auth-tab:hover:not(.active) { color: #0f172a; }
        .auth-tab.active {
          background: #ffffff;
          color: #15803d;
          box-shadow: 0 3px 8px rgba(15,23,42,0.06);
        }

        .auth-field { margin-bottom: 14px; }
        .auth-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 6px;
          letter-spacing: 0.2px;
        }

        .auth-input-wrap { position: relative; }

        .auth-input {
          width: 100%;
          padding: 13px 42px 13px 44px;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #f8fafc;
          outline: none;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        .auth-input::placeholder { color: #94a3b8; font-weight: 400; }
        .auth-input:hover { border-color: #cbd5e1; background: #f1f5f9; }
        .auth-input:focus {
          border-color: #16a34a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(22,163,74,0.14);
        }

        .auth-input-icon {
          position: absolute;
          left: 15px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          transition: all 0.2s ease;
        }
        .auth-input-wrap:focus-within .auth-input-icon { color: #15803d; }

        .auth-eye-btn {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 6px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s ease;
        }
        .auth-eye-btn:hover { color: #15803d; background: #f0fdf4; }

        .auth-forgot {
          text-align: right;
          margin-top: -8px;
          margin-bottom: 16px;
        }
        .auth-forgot a {
          font-size: 12.5px;
          color: #64748b;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .auth-forgot a:hover { color: #15803d; }

        .auth-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          background-size: 200% 100%;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 6px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 24px rgba(22,163,74,0.35), inset 0 1px 0 rgba(255,255,255,0.25);
          font-family: inherit;
          letter-spacing: 0.2px;
        }
        .auth-btn:hover:not(:disabled) {
          background-position: 100% 0;
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(22,163,74,0.42), inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .auth-btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }

        .auth-alert {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 11px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 14px;
        }
        .auth-alert.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .auth-alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 16px 0 12px;
          color: #94a3b8;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }
        .auth-divider::before, .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
        }

        .auth-google {
          width: 100%;
          padding: 12px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          text-decoration: none;
          transition: all 0.25s ease;
          font-family: inherit;
        }
        .auth-google:hover {
          border-color: #16a34a;
          background: #f8fafc;
          transform: translateY(-2px);
          box-shadow: 0 8px 18px rgba(22,163,74,0.12);
        }

        .auth-footer {
          margin-top: 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .auth-footer p { font-size: 13px; color: #64748b; margin: 0; }
        .auth-footer a, .auth-footer button.link {
          color: #15803d;
          font-weight: 800;
          text-decoration: none;
          transition: color 0.2s ease;
          background: none;
          border: none;
          padding: 0;
          font-size: inherit;
          cursor: pointer;
          font-family: inherit;
        }
        .auth-footer a:hover, .auth-footer button.link:hover {
          color: #166534;
          text-decoration: underline;
        }

        .auth-org-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }

        /* ============================================================
           DARK THEME OVERRIDES
           ============================================================ */
        body.dark-theme .auth-page { background: #0b1210; }

        body.dark-theme .auth-left {
          background: linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%);
        }
        body.dark-theme .auth-left-pattern {
          background-image:
            radial-gradient(circle at 15% 20%, rgba(22,163,74,0.16), transparent 40%),
            radial-gradient(circle at 85% 75%, rgba(74,222,128,0.12), transparent 42%),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'><circle cx='3' cy='3' r='1.2' fill='%234ade80' opacity='0.12'/><circle cx='19' cy='19' r='1.2' fill='%234ade80' opacity='0.12'/></svg>");
        }
        body.dark-theme .auth-left-blob.b1 { background: rgba(34,197,94,0.35); }
        body.dark-theme .auth-left-blob.b2 { background: rgba(74,222,128,0.28); }
        body.dark-theme .auth-left-blob.b3 { background: rgba(190,242,100,0.20); }

        body.dark-theme .auth-back {
          color: #bbf7d0;
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.18);
        }
        body.dark-theme .auth-back:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.16);
          border-color: rgba(34,197,94,0.5);
          box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }

        body.dark-theme .auth-brand-text { color: #f2f7f4; }
        body.dark-theme .auth-headline { color: #f2f7f4; }
        body.dark-theme .auth-subline { color: #cbd8d1; }
        body.dark-theme .auth-tagline { color: #86efac; opacity: 0.85; }

        body.dark-theme .auth-preview {
          background: rgba(18, 26, 23, 0.75);
          border-color: rgba(34,197,94,0.28);
          box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 2px 6px rgba(0,0,0,0.3);
          backdrop-filter: blur(10px);
        }
        body.dark-theme .auth-preview-label { color: #86efac; }
        body.dark-theme .auth-preview-live {
          background: rgba(34,197,94,0.18);
          color: #86efac;
        }
        body.dark-theme .auth-preview-live-dot { background: #4ade80; }
        body.dark-theme .auth-preview-value { color: #f2f7f4; }
        body.dark-theme .auth-preview-unit { color: #8fa39a; }
        body.dark-theme .auth-preview-change {
          background: rgba(34,197,94,0.18);
          color: #4ade80;
        }
        body.dark-theme .auth-preview-bar { background: rgba(148,163,184,0.22); }
        body.dark-theme .auth-preview-bar.hi {
          background: linear-gradient(180deg, #22c55e, #16a34a);
          box-shadow: 0 0 10px rgba(34,197,94,0.6);
        }
        body.dark-theme .auth-preview-days { color: #8fa39a; }

        body.dark-theme .auth-feature {
          background: rgba(18, 26, 23, 0.55);
          border-color: rgba(34,197,94,0.20);
        }
        body.dark-theme .auth-feature:hover {
          background: rgba(18, 26, 23, 0.90);
          border-color: rgba(34,197,94,0.45);
          box-shadow: 0 8px 22px rgba(0,0,0,0.4);
        }
        body.dark-theme .auth-feature-text { color: #f2f7f4; }
        body.dark-theme .auth-feature-text small { color: #8fa39a; }

        body.dark-theme .auth-right {
          background: linear-gradient(135deg, #0b1210 0%, #0f1a15 100%);
        }
        body.dark-theme .auth-right::before {
          background: radial-gradient(circle, rgba(34,197,94,0.14), transparent 70%);
        }

        body.dark-theme .auth-form-wrap {
          background: #121a17;
          border-color: #24312b;
          box-shadow: 0 30px 80px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35);
        }

        body.dark-theme .auth-form-heading { color: #f2f7f4; }
        body.dark-theme .auth-form-sub { color: #8fa39a; }

        body.dark-theme .auth-tabs { background: rgba(148,163,184,0.10); }
        body.dark-theme .auth-tab { color: #8fa39a; }
        body.dark-theme .auth-tab:hover:not(.active) { color: #f2f7f4; }
        body.dark-theme .auth-tab.active {
          background: rgba(34,197,94,0.15);
          color: #4ade80;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        }

        body.dark-theme .auth-label { color: #cbd8d1; }
        body.dark-theme .auth-input {
          background: rgba(148,163,184,0.06);
          border-color: #24312b;
          color: #f2f7f4;
        }
        body.dark-theme .auth-input::placeholder { color: #64748b; }
        body.dark-theme .auth-input:hover {
          background: rgba(148,163,184,0.10);
          border-color: #33443b;
        }
        body.dark-theme .auth-input:focus {
          background: #121a17;
          border-color: #22c55e;
          box-shadow: 0 0 0 4px rgba(34,197,94,0.20);
        }
        body.dark-theme .auth-input-icon { color: #64748b; }
        body.dark-theme .auth-input-wrap:focus-within .auth-input-icon { color: #4ade80; }

        body.dark-theme .auth-eye-btn { color: #8fa39a; }
        body.dark-theme .auth-eye-btn:hover {
          color: #4ade80;
          background: rgba(34,197,94,0.14);
        }

        body.dark-theme .auth-forgot a { color: #8fa39a; }
        body.dark-theme .auth-forgot a:hover { color: #4ade80; }

        body.dark-theme .auth-btn {
          box-shadow: 0 8px 24px rgba(34,197,94,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        body.dark-theme .auth-btn:hover:not(:disabled) {
          box-shadow: 0 12px 26px rgba(34,197,94,0.38), inset 0 1px 0 rgba(255,255,255,0.15);
        }
        body.dark-theme .auth-btn:disabled { background: #33443b; }

        body.dark-theme .auth-alert.error {
          background: rgba(239,68,68,0.12);
          border-color: rgba(239,68,68,0.32);
          color: #f87171;
        }
        body.dark-theme .auth-alert.success {
          background: rgba(34,197,94,0.12);
          border-color: rgba(34,197,94,0.32);
          color: #4ade80;
        }

        body.dark-theme .auth-divider { color: #64748b; }
        body.dark-theme .auth-divider::before,
        body.dark-theme .auth-divider::after {
          background: linear-gradient(90deg, transparent, #24312b, transparent);
        }

        body.dark-theme .auth-google {
          background: #121a17;
          border-color: #24312b;
          color: #f2f7f4;
        }
        body.dark-theme .auth-google:hover {
          background: rgba(34,197,94,0.10);
          border-color: #22c55e;
          box-shadow: 0 8px 18px rgba(0,0,0,0.35);
        }

        body.dark-theme .auth-footer p { color: #8fa39a; }
        body.dark-theme .auth-footer a,
        body.dark-theme .auth-footer button.link { color: #4ade80; }
        body.dark-theme .auth-footer a:hover,
        body.dark-theme .auth-footer button.link:hover { color: #86efac; }

        @media (max-width: 900px) {
          .auth-page { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 24px 20px; }
          .auth-form-wrap { padding: 24px; }
        }
      `}</style>

      {/* ================= LEFT ================= */}
      <div className="auth-left">
        <div className="auth-left-pattern" />
        <div className="auth-left-blob b1" />
        <div className="auth-left-blob b2" />
        <div className="auth-left-blob b3" />

        <div className="auth-left-inner">
          <button type="button" className="auth-back" onClick={() => navigate('/')}>
            <ArrowLeft size={13} /> Back to Home
          </button>

          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Leaf size={22} color="#ffffff" strokeWidth={2.6} />
            </div>
            <div className="auth-brand-text">{appName}</div>
          </div>

          <h1 className="auth-headline">
            {isLogin ? (
              <>Welcome <span className="accent">back.</span></>
            ) : (
              <>Start where <span className="accent">you are today.</span></>
            )}
          </h1>

          <p className="auth-subline">
            {isLogin
              ? 'Pick up where you left off — your emissions history, streaks, and goals are waiting.'
              : 'Create an account in minutes and get a clear picture of your carbon footprint from day one.'}
          </p>

          <div className="auth-preview">
            <div className="auth-preview-header">
              <span className="auth-preview-label">This Week</span>
              <span className="auth-preview-live">
                <span className="auth-preview-live-dot" />
                LIVE
              </span>
            </div>
            <div className="auth-preview-metric">
              <span className="auth-preview-value">142.4</span>
              <span className="auth-preview-unit">kg CO₂e</span>
              <span className="auth-preview-change">
                <TrendingDown size={10} /> 18%
              </span>
            </div>
            <div className="auth-preview-bars">
              {[58, 44, 62, 38, 70, 30, 48].map((h, i) => (
                <div
                  key={i}
                  className={`auth-preview-bar ${i === 5 ? 'hi' : ''}`}
                  style={{ height: `${h}%`, animationDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
            <div className="auth-preview-days">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} style={{ color: i === 5 ? '#15803d' : undefined }}>{d}</span>
              ))}
            </div>
          </div>

          <div className="auth-features">
            {features.map((f, i) => (
              <div key={i} className="auth-feature">
                <div className="auth-feature-icon">
                  <f.icon size={16} color="#ffffff" strokeWidth={2.4} />
                </div>
                <div className="auth-feature-text">
                  {f.title}
                  <small>{f.desc}</small>
                </div>
              </div>
            ))}
          </div>

          <div className="auth-tagline">Measure • Reduce • Sustain</div>
        </div>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <h2 className="auth-form-heading">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="auth-form-sub">
            {isLogin
              ? 'Log in to your Carbon Tracker account'
              : 'Join Carbon Tracker and start measuring today 🌱'}
          </p>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { if (!isLogin) switchMode(); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { if (isLogin) switchMode(); }}
            >
              Register
            </button>
          </div>

          {error && <div className="auth-alert error"><AlertCircle size={15} /> {error}</div>}
          {successMessage && <div className="auth-alert success"><Check size={15} /> {successMessage}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label">Username</label>
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    className="auth-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your username"
                    required={!isLogin}
                  />
                  <User size={17} className="auth-input-icon" />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label">{isLogin ? 'Email' : 'Email address'}</label>
              <div className="auth-input-wrap">
                <input
                  type="email"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
                <Mail size={17} className="auth-input-icon" />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <Lock size={17} className="auth-input-icon" />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isLogin && (
              <div className="auth-forgot">
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <span style={{
                    width: '17px', height: '17px',
                    border: '2.5px solid rgba(255,255,255,0.35)',
                    borderTop: '2.5px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Login' : 'Register'} <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {isLogin && (
            <>
              <div className="auth-divider">OR CONTINUE WITH</div>
              <a href="http://localhost:8080/oauth2/authorization/google" className="auth-google">
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  style={{ width: '17px', height: '17px' }}
                />
                Sign in with Google
              </a>
            </>
          )}

          <div className="auth-footer">
            {isLogin ? (
              <>
                <p>
                  Don't have an account?{' '}
                  <button type="button" className="link" onClick={switchMode}>Register</button>
                </p>
                <p className="auth-org-link">
                  <Building2 size={13} />
                  <Link to="/organizer/register">Register an organization</Link>
                </p>
              </>
            ) : (
              <>
                <p>
                  Already have an account?{' '}
                  <button type="button" className="link" onClick={switchMode}>Login</button>
                </p>
                <p className="auth-org-link">
                  <Building2 size={13} />
                  <Link to="/organizer/register">Register an organization</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;