import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../../../api/axiosClient';
import {
  Leaf, User, Mail, Lock, Building2, Phone, MapPin, FileText,
  ArrowLeft, Users, TrendingUp, Shield,
  Check, AlertCircle, Eye, EyeOff, Crown, Sparkles,
} from 'lucide-react';

const OrganizerRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationDescription: '',
    organizationPhone: '',
    organizationAddress: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    let n = 0;
    const target = 3;
    const timer = setInterval(() => {
      n += 1;
      setMemberCount(n);
      if (n >= target) clearInterval(timer);
    }, 350);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.fullName.trim()) return setError('Please enter your full name');
    if (!formData.email.trim()) return setError('Please enter your email address');
    if (!formData.password || formData.password.length < 6) return setError('Password must be at least 6 characters');
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match');
    if (!formData.organizationName.trim()) return setError('Please enter your organization name');

    setLoading(true);
    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        organizationDescription: formData.organizationDescription,
        organizationEmail: formData.email,
        organizationPhone: formData.organizationPhone,
        organizationAddress: formData.organizationAddress,
      };
      const response = await axiosClient.post('/organizations/register', payload);

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        const user = response.data.user;
        localStorage.setItem('userRole', user.role);
        localStorage.setItem('userName', user.fullName);
        localStorage.setItem('userId', user.id.toString());
        localStorage.setItem('userEmail', user.email);
        setSuccess('Organization registered successfully!');
        setTimeout(() => navigate('/organizer/dashboard'), 1200);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, title: 'Manage your team', desc: 'Add members & control accounts in one place' },
    { icon: TrendingUp, title: 'Org-wide insights', desc: "Track your whole team's footprint" },
    { icon: Shield, title: 'Private workspace', desc: 'Your data stays within your organization' },
  ];

  return (
    <div className="auth-page">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeSlideRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes floatY { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }

        html, body { overflow: hidden; }

        .auth-page {
          height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1.15fr;
          background: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        /* ============ LEFT ============ */
        .auth-left {
          position: relative;
          padding: 28px 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #14532d;
          overflow: hidden;
          background: #dcfce7;
          animation: fadeSlideLeft 0.7s ease;
          height: 100vh;
        }
        .auth-left-image {
          position: absolute;
          inset: 0;
          background-image: url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=80');
          background-size: cover;
          background-position: center;
          opacity: 0.18;
          z-index: 0;
          filter: blur(2px);
        }
        .auth-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(140deg, rgba(240,253,244,0.88) 0%, rgba(220,252,231,0.78) 55%, rgba(187,247,208,0.68) 100%);
          z-index: 1;
        }
        .auth-left-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          pointer-events: none;
          z-index: 1;
        }
        .auth-left-blob.b1 {
          width: 380px; height: 380px;
          top: -140px; right: -100px;
          background: rgba(187, 247, 208, 0.7);
        }
        .auth-left-blob.b2 {
          width: 320px; height: 320px;
          bottom: -140px; left: -80px;
          background: rgba(134, 239, 172, 0.6);
        }

        .auth-left-inner {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
        }

        .auth-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #15803d;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          padding: 7px 14px 7px 11px;
          border-radius: 100px;
          background: rgba(255,255,255,0.65);
          border: 1px solid rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
          transition: all 0.25s ease;
          cursor: pointer;
          margin-bottom: 18px;
          align-self: flex-start;
          font-family: inherit;
        }
        .auth-back:hover {
          color: #14532d;
          background: #ffffff;
          transform: translateX(-3px);
          box-shadow: 0 6px 18px rgba(22,163,74,0.15);
        }

        .auth-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 20px;
        }
        .auth-brand-icon {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 16px rgba(22,163,74,0.35);
        }
        .auth-brand-text {
          font-size: 20px;
          font-weight: 800;
          letter-spacing: -0.4px;
          color: #14532d;
        }

        .auth-headline {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -1.4px;
          margin-bottom: 10px;
          color: #14532d;
        }
        .auth-headline .accent {
          display: inline;
          background: linear-gradient(135deg, #15803d, #16a34a);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .auth-subline {
          font-size: 14px;
          line-height: 1.55;
          color: #166534;
          margin-bottom: 20px;
          max-width: 420px;
          font-weight: 500;
        }

        .auth-preview {
          background: rgba(255,255,255,0.72);
          border: 1px solid rgba(255,255,255,0.95);
          backdrop-filter: blur(16px);
          border-radius: 16px;
          padding: 14px 18px;
          margin-bottom: 16px;
          box-shadow: 0 12px 32px rgba(20,83,45,0.10);
          animation: floatY 6s ease-in-out infinite;
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
          background: rgba(22,163,74,0.15);
          border-radius: 100px;
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.8px;
          color: #15803d;
        }
        .auth-preview-live-dot {
          width: 6px; height: 6px;
          background: #16a34a;
          border-radius: 50%;
          animation: pulseDot 1.4s ease-in-out infinite;
        }

        .auth-counter {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 12px;
        }
        .auth-counter-value {
          font-size: 34px;
          font-weight: 800;
          letter-spacing: -1.2px;
          color: #14532d;
        }
        .auth-counter-label {
          font-size: 12px;
          font-weight: 600;
          color: #15803d;
        }

        .auth-member-list {
          display: flex;
          align-items: center;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(22,163,74,0.18);
        }
        .auth-member-avatars {
          display: flex;
        }
        .auth-member-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 800;
          font-size: 11.5px;
          margin-left: -8px;
          animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 3px 8px rgba(20,83,45,0.15);
        }
        .auth-member-avatar:first-child { margin-left: 0; }
        .auth-member-text {
          font-size: 12px;
          font-weight: 600;
          color: #15803d;
        }

        .auth-features {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .auth-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: rgba(255,255,255,0.55);
          border: 1px solid rgba(255,255,255,0.85);
          border-radius: 11px;
          backdrop-filter: blur(8px);
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .auth-feature:hover {
          background: rgba(255,255,255,0.85);
          transform: translateX(5px);
          box-shadow: 0 6px 18px rgba(22,163,74,0.10);
        }
        .auth-feature-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(22,163,74,0.25);
        }
        .auth-feature-text {
          font-size: 13px;
          font-weight: 700;
          color: #14532d;
          line-height: 1.3;
        }
        .auth-feature-text small {
          display: block;
          font-size: 11.5px;
          font-weight: 500;
          color: #15803d;
          margin-top: 1px;
        }

        .auth-tagline {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid rgba(22,163,74,0.18);
          font-size: 10.5px;
          font-weight: 800;
          color: #15803d;
          letter-spacing: 2.5px;
          text-transform: uppercase;
        }

        /* ============ RIGHT ============ */
        .auth-right {
          padding: 24px 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #f0fdf4 100%);
          animation: fadeSlideRight 0.7s ease;
          height: 100vh;
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
          max-width: 580px;
          position: relative;
          z-index: 1;
          background: #ffffff;
          padding: 28px 32px;
          border-radius: 22px;
          box-shadow: 0 30px 80px rgba(15,23,42,0.08), 0 8px 24px rgba(15,23,42,0.04);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .auth-form-heading {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.8px;
          margin-bottom: 4px;
        }
        .auth-form-sub {
          font-size: 13.5px;
          color: #64748b;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .auth-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .auth-field { margin-bottom: 12px; }

        .auth-label {
          display: block;
          font-size: 11.5px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 5px;
        }

        .auth-input-wrap { position: relative; }
        .auth-input {
          width: 100%;
          padding: 11px 40px 11px 42px;
          border: 1.5px solid #e2e8f0;
          border-radius: 11px;
          font-size: 13.5px;
          font-family: inherit;
          color: #0f172a;
          background: #ffffff;
          outline: none;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        .auth-input::placeholder { color: #94a3b8; font-weight: 400; }
        .auth-input:hover { border-color: #cbd5e1; background: #fafbfc; }
        .auth-input:focus {
          border-color: #16a34a;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(22,163,74,0.14);
        }

        textarea.auth-input {
          padding: 11px 12px 11px 42px;
          resize: none;
          min-height: 60px;
        }

        .auth-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.2s ease;
        }
        textarea.auth-input + .auth-input-icon {
          top: 22px;
          transform: none;
        }
        .auth-input-wrap:focus-within .auth-input-icon { color: #15803d; }

        .auth-eye-btn {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 5px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s ease;
        }
        .auth-eye-btn:hover { color: #15803d; background: #f0fdf4; }

        .auth-section-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 10.5px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin: 6px 0 10px;
        }
        .auth-section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, #f1f5f9, transparent);
        }

        .auth-btn {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          background-size: 200% 100%;
          color: #ffffff;
          border: none;
          border-radius: 11px;
          font-size: 14.5px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
          transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 20px rgba(22,163,74,0.35), inset 0 1px 0 rgba(255,255,255,0.25);
          font-family: inherit;
        }
        .auth-btn:hover:not(:disabled) {
          background-position: 100% 0;
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(22,163,74,0.45), inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .auth-btn:disabled { background: #94a3b8; cursor: not-allowed; box-shadow: none; }

        .auth-alert {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 12.5px;
          font-weight: 600;
          margin-bottom: 12px;
        }
        .auth-alert.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .auth-alert.success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }

        .auth-footer {
          margin-top: 18px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .auth-footer p { font-size: 12.5px; color: #64748b; margin: 0; }
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

        /* ============================================================
           DARK THEME OVERRIDES
           ============================================================ */
        body.dark-theme .auth-page { background: #0b1210; }

        body.dark-theme .auth-left { background: #052e16; }
        body.dark-theme .auth-left-image { opacity: 0.10; }
        body.dark-theme .auth-left-overlay {
          background: linear-gradient(140deg, rgba(5,46,22,0.92) 0%, rgba(6,78,59,0.82) 55%, rgba(21,128,61,0.72) 100%);
        }
        body.dark-theme .auth-left-blob.b1 { background: rgba(34,197,94,0.30); }
        body.dark-theme .auth-left-blob.b2 { background: rgba(74,222,128,0.22); }

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
        body.dark-theme .auth-tagline {
          color: #86efac;
          border-top-color: rgba(34,197,94,0.22);
        }

        body.dark-theme .auth-preview {
          background: rgba(18, 26, 23, 0.75);
          border-color: rgba(34,197,94,0.28);
          box-shadow: 0 12px 32px rgba(0,0,0,0.5);
          backdrop-filter: blur(12px);
        }
        body.dark-theme .auth-preview-label { color: #86efac; }
        body.dark-theme .auth-preview-live {
          background: rgba(34,197,94,0.18);
          color: #86efac;
        }
        body.dark-theme .auth-preview-live-dot { background: #4ade80; }
        body.dark-theme .auth-counter-value { color: #f2f7f4; }
        body.dark-theme .auth-counter-label { color: #cbd8d1; }
        body.dark-theme .auth-member-list {
          border-top-color: rgba(34,197,94,0.22);
        }
        body.dark-theme .auth-member-avatar { border-color: #121a17; }
        body.dark-theme .auth-member-text { color: #cbd8d1; }

        body.dark-theme .auth-feature {
          background: rgba(18, 26, 23, 0.55);
          border-color: rgba(34,197,94,0.20);
        }
        body.dark-theme .auth-feature:hover {
          background: rgba(18, 26, 23, 0.90);
          border-color: rgba(34,197,94,0.45);
          box-shadow: 0 6px 18px rgba(0,0,0,0.4);
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
          border-color: #16a34a;
          box-shadow: 0 0 0 4px rgba(22,163,74,0.22);
        }
        body.dark-theme .auth-input-icon { color: #64748b; }
        body.dark-theme .auth-input-wrap:focus-within .auth-input-icon { color: #4ade80; }

        body.dark-theme .auth-eye-btn { color: #8fa39a; }
        body.dark-theme .auth-eye-btn:hover {
          color: #4ade80;
          background: rgba(34,197,94,0.14);
        }

        body.dark-theme .auth-section-label { color: #64748b; }
        body.dark-theme .auth-section-label::after {
          background: linear-gradient(90deg, #24312b, transparent);
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

        body.dark-theme .auth-footer p { color: #8fa39a; }
        body.dark-theme .auth-footer a,
        body.dark-theme .auth-footer button.link { color: #4ade80; }
        body.dark-theme .auth-footer a:hover,
        body.dark-theme .auth-footer button.link:hover { color: #86efac; }

        @media (max-width: 900px) {
          .auth-page { grid-template-columns: 1fr; }
          .auth-left { display: none; }
          .auth-right { padding: 24px; }
          .auth-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ================= LEFT ================= */}
      <div className="auth-left">
        <div className="auth-left-image" />
        <div className="auth-left-overlay" />
        <div className="auth-left-blob b1" />
        <div className="auth-left-blob b2" />

        <div className="auth-left-inner">
          <button type="button" className="auth-back" onClick={() => navigate('/')}>
            <ArrowLeft size={13} /> Back to Home
          </button>

          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Leaf size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div className="auth-brand-text">Carbon Tracker</div>
          </div>

          <h1 className="auth-headline">
            Bring your <span className="accent">whole team on board.</span>
          </h1>

          <p className="auth-subline">
            Register your organization, add your members, and track everyone's carbon footprint from one private workspace.
          </p>

          <div className="auth-preview">
            <div className="auth-preview-header">
              <span className="auth-preview-label">Organization</span>
              <span className="auth-preview-live">
                <span className="auth-preview-live-dot" />
                SETTING UP
              </span>
            </div>
            <div className="auth-counter">
              <span className="auth-counter-value">{memberCount}</span>
              <span className="auth-counter-label">
                {memberCount === 1 ? 'member added' : 'members added'}
              </span>
            </div>
            <div className="auth-member-list">
              <div className="auth-member-avatars">
                {['Y', 'T', 'A'].slice(0, memberCount).map((c, i) => (
                  <div
                    key={i}
                    className="auth-member-avatar"
                    style={{ background: ['#16a34a', '#3b82f6', '#f59e0b'][i] }}
                  >
                    {c}
                  </div>
                ))}
              </div>
              <div className="auth-member-text">
                {memberCount === 0
                  ? 'Invite your first team member'
                  : 'Your team is growing'}
              </div>
            </div>
          </div>

          <div className="auth-features">
            {features.map((f, i) => (
              <div key={i} className="auth-feature">
                <div className="auth-feature-icon">
                  <f.icon size={15} color="#ffffff" strokeWidth={2.4} />
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 5px 12px rgba(22,163,74,0.3)',
            }}>
              <Crown size={16} color="#ffffff" strokeWidth={2.5} />
            </div>
            <span style={{
              fontSize: '10.5px', fontWeight: 800, color: '#15803d',
              textTransform: 'uppercase', letterSpacing: '1.4px',
            }}>
              Organization Admin
            </span>
          </div>

          <h2 className="auth-form-heading">Create your organization</h2>
          <p className="auth-form-sub">
            Set up an admin account and start adding your team members 📋
          </p>

          {error && (
            <div className="auth-alert error">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          {success && (
            <div className="auth-alert success">
              <Check size={14} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="auth-section-label">Admin Account</div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Owner name</label>
                <div className="auth-input-wrap">
                  <input
                    type="text" name="fullName"
                    className="auth-input"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your full name"
                    required
                  />
                  <User size={16} className="auth-input-icon" />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Email</label>
                <div className="auth-input-wrap">
                  <input
                    type="email" name="email"
                    className="auth-input"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                  />
                  <Mail size={16} className="auth-input-icon" />
                </div>
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div className="auth-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="auth-input"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength="6"
                  />
                  <Lock size={16} className="auth-input-icon" />
                  <button
                    type="button" className="auth-eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Confirm</label>
                <div className="auth-input-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    className="auth-input"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                  <Lock size={16} className="auth-input-icon" />
                  <button
                    type="button" className="auth-eye-btn"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="auth-section-label">Organization Details</div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Organization name</label>
                <div className="auth-input-wrap">
                  <input
                    type="text" name="organizationName"
                    className="auth-input"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="e.g. Infosys"
                    required
                  />
                  <Building2 size={16} className="auth-input-icon" />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Phone (optional)</label>
                <div className="auth-input-wrap">
                  <input
                    type="text" name="organizationPhone"
                    className="auth-input"
                    value={formData.organizationPhone}
                    onChange={handleChange}
                    placeholder="Mobile number"
                  />
                  <Phone size={16} className="auth-input-icon" />
                </div>
              </div>
            </div>

            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Description (optional)</label>
                <div className="auth-input-wrap">
                  <textarea
                    name="organizationDescription"
                    className="auth-input"
                    value={formData.organizationDescription}
                    onChange={handleChange}
                    placeholder="Brief description..."
                  />
                  <FileText size={16} className="auth-input-icon" />
                </div>
              </div>
              <div className="auth-field">
                <label className="auth-label">Address (optional)</label>
                <div className="auth-input-wrap">
                  <input
                    type="text" name="organizationAddress"
                    className="auth-input"
                    value={formData.organizationAddress}
                    onChange={handleChange}
                    placeholder="123 Main St, City"
                  />
                  <MapPin size={16} className="auth-input-icon" />
                </div>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? (
                <>
                  <span style={{
                    width: '16px', height: '16px',
                    border: '2.5px solid rgba(255,255,255,0.35)',
                    borderTop: '2.5px solid #ffffff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    display: 'inline-block',
                  }} />
                  Registering...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Create Organization
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Registering as an individual?{' '}
              <Link to="/login?register=true">Personal account</Link>
            </p>
            <p>
              Already have an account?{' '}
              <Link to="/login">Login</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerRegister;