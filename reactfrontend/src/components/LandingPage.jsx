import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import {
  Leaf, Activity, BarChart3, Target, Users, Award,
  TrendingUp, ArrowRight, ChevronRight, Star, Trophy,
  LogIn, UserPlus, Menu, X, Shield, Sparkles,
  TrendingDown, Crown, Zap,
} from 'lucide-react';
import ChatFloatingButton from './chat/ChatFloatingButton';
import ChatPopup from './chat/ChatPopup';
import ThemeToggle from './ThemeToggle';

const LandingPage = () => {
  const navigate = useNavigate();
  const { settings, loading } = useSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const appName = settings?.appName || 'Carbon Tracker';
  const appDescription = settings?.appDescription || 'Track your carbon footprint. Make a difference.';

  const features = [
    { icon: Activity, title: 'Activity Logging', description: 'Log your daily activities across transport, electricity, food, and shopping categories with ease.', color: '#16a34a' },
    { icon: BarChart3, title: 'Real-time Analytics', description: 'View detailed insights with interactive charts showing your carbon footprint breakdown.', color: '#3b82f6' },
    { icon: Target, title: 'Sustainability Goals', description: 'Set and track personalized carbon reduction goals with real-time progress monitoring.', color: '#f59e0b' },
    { icon: Trophy, title: 'Leaderboard', description: 'Compete with others and earn badges for achieving sustainability milestones.', color: '#8b5cf6' },
    { icon: Award, title: 'Badges & Achievements', description: 'Earn badges for consistent tracking, emission reductions, and goal completions.', color: '#ec4899' },
    { icon: TrendingUp, title: 'AI Recommendations', description: 'Get AI-powered recommendations to reduce your carbon footprint effectively.', color: '#06b6d4' },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users' },
    { value: '50K+', label: 'Activities Logged' },
    { value: '100K+', label: 'CO₂e Tracked' },
    { value: '500+', label: 'Goals Achieved' },
  ];

  const steps = [
    { icon: Users, title: 'Create Account', description: 'Sign up for free and set up your profile' },
    { icon: Activity, title: 'Log Activities', description: 'Track your daily carbon footprint activities' },
    { icon: Target, title: 'Set Goals', description: 'Define your sustainability targets' },
    { icon: Award, title: 'Earn Rewards', description: 'Get badges and recognition for your efforts' },
  ];

  const testimonials = [
    { name: 'Sarah Johnson', role: 'Environmental Scientist', image: 'S', quote: 'CarbonTrack has transformed how I monitor my carbon footprint. The real-time analytics and goal tracking are invaluable.', rating: 5 },
    { name: 'Michael Chen', role: 'Sustainability Consultant', image: 'M', quote: 'The recommendations feature helped me reduce my emissions by 30% in just 3 months. Highly recommended!', rating: 5 },
    { name: 'Emily Rodriguez', role: 'Eco-conscious Professional', image: 'E', quote: 'Finally a tool that makes carbon tracking simple and engaging. The gamification keeps me motivated!', rating: 5 },
  ];

  const navLinks = [
    { label: 'Features', target: 'features' },
    { label: 'How it Works', target: 'how-it-works' },
    { label: 'Reviews', target: 'reviews' },
    { label: 'Support', target: 'support' },
    { label: 'Contact', target: 'contact' },
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleLogin = () => navigate('/login');
  const handleSignUp = () => navigate('/login', { state: { signUp: true } });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0fdf4' }}>
        <div className="spinner" style={{
          width: '48px', height: '48px',
          border: '4px solid #dcfce7', borderTop: '4px solid #16a34a',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div className="landing-root">
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.55; } 50% { opacity: 0.95; } }
        @keyframes pulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.45; transform: scale(0.75); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes drawLine {
          from { stroke-dashoffset: 1000; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        html { scroll-behavior: smooth; }
        .spinner { display: inline-block; }

        /* =========================================================
           BASE ROOT — light + dark
           ========================================================= */
        .landing-root {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          background: #ffffff;
          transition: background 0.3s ease, color 0.3s ease;
        }

        /* =========================================================
           THEME TOGGLE — matches the dashboard header chip
           ========================================================= */
        .app-theme-toggle {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          display: grid;
          place-items: center;
          cursor: pointer;
          padding: 0;
          flex-shrink: 0;
          transition: all .2s cubic-bezier(.4, 0, .2, 1);
        }
        .app-theme-toggle:hover {
          background: #f0fdf4;
          border-color: #86efac;
          color: #16a34a;
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(22, 163, 74, .12);
        }
        .app-theme-toggle:active {
          transform: translateY(0) scale(.96);
        }
        .app-theme-toggle:focus-visible {
          outline: 3px solid rgba(34, 197, 94, .35);
          outline-offset: 2px;
        }

        /* Dark theme override */
        body.dark-theme .app-theme-toggle {
          background: #121a17;
          border-color: #24312b;
          color: #cbd8d1;
        }
        body.dark-theme .app-theme-toggle:hover {
          background: rgba(34, 197, 94, .14);
          border-color: rgba(34, 197, 94, .45);
          color: #4ade80;
          box-shadow: 0 4px 10px rgba(0, 0, 0, .35);
        }

        /* =========================================================
           HEADER
           ========================================================= */
        .landing-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: saturate(180%) blur(14px);
          -webkit-backdrop-filter: saturate(180%) blur(14px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.7);
          height: 76px;
          display: flex;
          align-items: center;
        }
        .landing-header__brand-text {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.4px;
          text-shadow: 0 1px 0 rgba(255,255,255,0.6);
        }
        .landing-header__signin {
          padding: 10px 20px;
          background: transparent;
          color: #0f172a;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .landing-header__signin:hover {
          border-color: #16a34a;
          color: #15803d;
          background: #f0fdf4;
        }
        .landing-header__menu-icon { color: #0f172a; }

        .landing-mobile-menu {
          position: absolute;
          top: 76px; left: 0; right: 0;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 24px 24px;
          animation: slideDown 0.25s ease;
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
        }
        .landing-mobile-menu__link {
          padding: 12px 16px;
          background: transparent;
          border: none;
          text-align: left;
          font-size: 15px;
          font-weight: 500;
          color: #0f172a;
          cursor: pointer;
          border-radius: 8px;
        }

        /* =========================================================
           HERO
           ========================================================= */
        .landing-hero {
          min-height: 100vh;
          padding-top: 76px;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%);
          position: relative;
          overflow: hidden;
        }
        .landing-hero__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          background: rgba(22,163,74,0.12);
          border-radius: 24px;
          margin-bottom: 24px;
          border: 1px solid rgba(22,163,74,0.2);
        }
        .landing-hero__badge-text {
          font-size: 13px;
          font-weight: 700;
          color: #15803d;
          letter-spacing: 0.2px;
        }
        .landing-hero__headline {
          font-size: 58px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.08;
          letter-spacing: -1.5px;
          margin-bottom: 22px;
          text-shadow: 0 2px 4px rgba(15,23,42,0.05);
        }
        .landing-hero__headline-accent {
          display: block;
          background: linear-gradient(135deg, #16a34a, #15803d);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .landing-hero__desc {
          font-size: 19px;
          color: #475569;
          line-height: 1.65;
          margin-bottom: 36px;
          max-width: 540px;
        }
        .landing-hero__cta-secondary {
          padding: 16px 38px;
          background: rgba(255,255,255,0.85);
          color: #0f172a;
          border: 1.5px solid #e2e8f0;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          backdrop-filter: blur(8px);
        }
        .landing-hero__stats-border { border-top: 1px solid rgba(226,232,240,0.9); }
        .landing-hero__stat-value {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.5px;
          margin-bottom: 4px;
        }
        .landing-hero__stat-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }

        /* Snapshot card */
        .landing-snapshot {
          position: relative;
          background: #ffffff;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 30px 80px rgba(15,23,42,0.12), 0 8px 24px rgba(15,23,42,0.06);
          border: 1px solid rgba(226,232,240,0.6);
          z-index: 1;
        }
        .landing-snapshot__company { font-size: 14px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; }
        .landing-snapshot__sub { font-size: 11px; color: #94a3b8; font-weight: 500; }
        .landing-snapshot__chart {
          padding: 18px 20px 14px;
          background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          margin-bottom: 16px;
        }
        .landing-snapshot__chart-label {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .landing-snapshot__chart-value { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.8px; }
        .landing-snapshot__chart-unit { font-size: 13px; font-weight: 600; color: #64748b; }
        .landing-snapshot__stat-tile {
          padding: 12px 14px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .landing-snapshot__stat-tile-value {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.4px;
          line-height: 1.1;
        }
        .landing-snapshot__stat-tile-label {
          font-size: 10.5px;
          color: #64748b;
          font-weight: 600;
          margin-top: 2px;
        }
        .landing-snapshot__top-performer {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-radius: 14px;
          border: 1px solid #fde68a;
        }
        .landing-snapshot__performer-name {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        /* =========================================================
           SECTIONS (Features / How it Works / Reviews)
           ========================================================= */
        .landing-section { padding: 100px 32px; }
        .landing-section--white { background: #ffffff; }
        .landing-section--subtle { background: #f8fafc; }

        .landing-section__badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          background: rgba(22,163,74,0.08);
          border-radius: 20px;
          margin-bottom: 20px;
        }
        .landing-section__badge-text {
          font-size: 12px;
          font-weight: 700;
          color: #15803d;
          letter-spacing: 0.8px;
          text-transform: uppercase;
        }
        .landing-section__title {
          font-size: 44px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 18px;
          letter-spacing: -1px;
          line-height: 1.15;
        }
        .landing-section__title--tight { margin-bottom: 18px; letter-spacing: -1px; }
        .landing-section__accent { color: #16a34a; }
        .landing-section__desc {
          font-size: 18px;
          color: #64748b;
          max-width: 620px;
          margin: 0 auto 64px;
          line-height: 1.6;
        }

        /* Feature / testimonial cards */
        .landing-card {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 36px 28px;
          background: #ffffff;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          text-align: left;
        }
        .landing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(22, 163, 74, 0.08);
        }
        .landing-card__icon-box {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .landing-card__title {
          font-size: 19px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 10px;
          letter-spacing: -0.2px;
        }
        .landing-card__desc {
          font-size: 14.5px;
          color: #64748b;
          line-height: 1.65;
        }

        .landing-card--testimonial { padding: 32px 28px; }
        .landing-card__quote {
          font-size: 15px;
          color: #334155;
          line-height: 1.65;
          font-style: italic;
          margin-bottom: 20px;
        }
        .landing-card__author-name { font-weight: 700; color: #0f172a; font-size: 14px; }
        .landing-card__author-role { font-size: 13px; color: #64748b; }

        /* Steps */
        .landing-step__icon-wrap {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: linear-gradient(135deg, #16a34a, #15803d);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          box-shadow: 0 8px 24px rgba(22,163,74,0.32);
          position: relative;
        }
        .landing-step__num {
          position: absolute;
          top: -6px; right: -6px;
          width: 26px; height: 26px;
          border-radius: 50%;
          background: #ffffff;
          color: #15803d;
          font-size: 12px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #16a34a;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        }
        .landing-step__title {
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .landing-step__desc {
          font-size: 14px;
          color: #64748b;
          line-height: 1.55;
          max-width: 220px;
          margin: 0 auto;
        }

        /* =========================================================
           BUTTONS
           ========================================================= */
        .btn-hero {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-hero:hover { transform: translateY(-3px); }

        .btn-primary-green {
          padding: 10px 24px;
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(22, 163, 74, 0.32);
          transition: all 0.25s ease;
        }
        .btn-primary-green:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 22px rgba(22, 163, 74, 0.42);
        }

        .landing-nav-link {
          position: relative;
          color: #475569;
          font-size: 15px;
          font-weight: 600;
          text-decoration: none;
          padding: 8px 4px;
          transition: color 0.25s ease;
          cursor: pointer;
          background: transparent;
          border: none;
          font-family: inherit;
          letter-spacing: -0.1px;
        }
        .landing-nav-link::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #16a34a, #15803d);
          transition: width 0.3s ease;
          border-radius: 2px;
        }
        .landing-nav-link:hover { color: #15803d; }
        .landing-nav-link:hover::after { width: 100%; }

        /* =========================================================
           RESPONSIVE
           ========================================================= */
        @media (max-width: 900px) {
          .hide-mobile { display: none !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .landing-hero__headline { font-size: 40px; }
          .landing-section__title { font-size: 32px; }
        }
        @media (min-width: 901px) {
          .show-mobile { display: none !important; }
        }

        /* =========================================================
           DARK THEME OVERRIDES
           Applied when body has class "dark-theme"
           ========================================================= */
        body.dark-theme .landing-root {
          background: #0b1210;
          color: #f2f7f4;
        }

        /* ---- HEADER ---- */
        body.dark-theme .landing-header {
          background: rgba(11, 18, 16, 0.85);
          border-bottom-color: #24312b;
        }
        body.dark-theme .landing-header__brand-text { color: #f2f7f4; text-shadow: none; }
        body.dark-theme .landing-header__signin {
          color: #cbd8d1;
          border-color: #24312b;
          background: transparent;
        }
        body.dark-theme .landing-header__signin:hover {
          border-color: #22c55e;
          color: #4ade80;
          background: rgba(34,197,94,0.10);
        }
        body.dark-theme .landing-header__menu-icon { color: #f2f7f4; }

        body.dark-theme .landing-mobile-menu {
          background: #121a17;
          border-bottom-color: #24312b;
          box-shadow: 0 12px 24px rgba(0,0,0,0.5);
        }
        body.dark-theme .landing-mobile-menu__link { color: #f2f7f4; }

        body.dark-theme .landing-nav-link { color: #cbd8d1; }
        body.dark-theme .landing-nav-link:hover { color: #4ade80; }

        /* ---- HERO ---- */
        body.dark-theme .landing-hero {
          background: linear-gradient(135deg, #052e16 0%, #064e3b 50%, #065f46 100%);
        }
        body.dark-theme .landing-hero__badge {
          background: rgba(34,197,94,0.16);
          border-color: rgba(34,197,94,0.32);
        }
        body.dark-theme .landing-hero__badge-text { color: #86efac; }
        body.dark-theme .landing-hero__headline { color: #f2f7f4; text-shadow: none; }
        body.dark-theme .landing-hero__headline-accent {
          background: linear-gradient(135deg, #4ade80, #22c55e);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        body.dark-theme .landing-hero__desc { color: #cbd8d1; }
        body.dark-theme .landing-hero__cta-secondary {
          background: rgba(255,255,255,0.08);
          color: #f2f7f4;
          border-color: rgba(255,255,255,0.18);
        }
        body.dark-theme .landing-hero__cta-secondary:hover {
          background: rgba(255,255,255,0.14);
          border-color: rgba(255,255,255,0.32);
        }
        body.dark-theme .landing-hero__stats-border {
          border-top-color: rgba(34,197,94,0.20);
        }
        body.dark-theme .landing-hero__stat-value { color: #f2f7f4; }
        body.dark-theme .landing-hero__stat-label { color: #8fa39a; }

        /* ---- SNAPSHOT CARD ---- */
        body.dark-theme .landing-snapshot {
          background: #121a17;
          border-color: #24312b;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4);
        }
        body.dark-theme .landing-snapshot__company { color: #f2f7f4; }
        body.dark-theme .landing-snapshot__sub { color: #8fa39a; }
        body.dark-theme .landing-snapshot__chart {
          background: linear-gradient(180deg, rgba(148,163,184,0.06) 0%, rgba(148,163,184,0.02) 100%);
          border-color: #24312b;
        }
        body.dark-theme .landing-snapshot__chart-label { color: #8fa39a; }
        body.dark-theme .landing-snapshot__chart-value { color: #f2f7f4; }
        body.dark-theme .landing-snapshot__chart-unit { color: #8fa39a; }
        body.dark-theme .landing-snapshot__stat-tile {
          background: rgba(148,163,184,0.06);
          border-color: #24312b;
        }
        body.dark-theme .landing-snapshot__stat-tile-value { color: #f2f7f4; }
        body.dark-theme .landing-snapshot__stat-tile-label { color: #8fa39a; }
        body.dark-theme .landing-snapshot__performer-name { color: #f2f7f4; }
        body.dark-theme .landing-snapshot__top-performer {
          background: linear-gradient(135deg, rgba(245,158,11,0.14) 0%, rgba(245,158,11,0.08) 100%);
          border-color: rgba(245,158,11,0.30);
        }

        /* ---- SECTIONS ---- */
        body.dark-theme .landing-section--white { background: #0b1210; }
        body.dark-theme .landing-section--subtle { background: #0f1a15; }

        body.dark-theme .landing-section__badge {
          background: rgba(34,197,94,0.14);
        }
        body.dark-theme .landing-section__badge-text { color: #86efac; }
        body.dark-theme .landing-section__title { color: #f2f7f4; }
        body.dark-theme .landing-section__accent { color: #4ade80; }
        body.dark-theme .landing-section__desc { color: #8fa39a; }

        /* ---- CARDS ---- */
        body.dark-theme .landing-card {
          background: #121a17;
          border-color: #24312b;
        }
        body.dark-theme .landing-card:hover {
          border-color: rgba(34,197,94,0.35);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
        }
        body.dark-theme .landing-card__title { color: #f2f7f4; }
        body.dark-theme .landing-card__desc { color: #8fa39a; }
        body.dark-theme .landing-card__quote { color: #cbd8d1; }
        body.dark-theme .landing-card__author-name { color: #f2f7f4; }
        body.dark-theme .landing-card__author-role { color: #8fa39a; }

        /* ---- STEPS ---- */
        body.dark-theme .landing-step__num {
          background: #121a17;
          color: #4ade80;
          border-color: #22c55e;
        }
        body.dark-theme .landing-step__title { color: #f2f7f4; }
        body.dark-theme .landing-step__desc { color: #8fa39a; }

        /* ---- BUTTONS (dark adjustments) ---- */
        body.dark-theme .btn-primary-green {
          box-shadow: 0 4px 14px rgba(34,197,94,0.28);
        }
        body.dark-theme .btn-primary-green:hover {
          box-shadow: 0 8px 22px rgba(34,197,94,0.40);
        }

        /* Support CTA — already dark in light mode, only slight tweak needed */
        body.dark-theme #support {
          background: linear-gradient(135deg, #050a08 0%, #0b1210 100%) !important;
        }
        body.dark-theme #contact {
          background: #050a08 !important;
          border-top-color: #1a2621 !important;
        }
      `}</style>

      {/* =============================================
          HEADER
          ============================================= */}
      <header className="landing-header">
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <div style={{
              width: '42px', height: '42px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(22, 163, 74, 0.3)',
            }}>
              <Leaf size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <span className="landing-header__brand-text">{appName}</span>
          </button>

          <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
            {navLinks.map((link) => (
              <button key={link.label} onClick={() => scrollToSection(link.target)} className="landing-nav-link">
                {link.label}
              </button>
            ))}
          </nav>

          {/* --- UI: right cluster with ThemeToggle + Sign In + Get Started --- */}
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ThemeToggle />
            <button onClick={handleLogin} className="landing-header__signin">
              Sign In
            </button>
            <button onClick={handleSignUp} className="btn-primary-green">
              Get Started
            </button>
          </div>

          <button
            className="show-mobile"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}
          >
            {mobileMenuOpen
              ? <X size={24} className="landing-header__menu-icon" />
              : <Menu size={24} className="landing-header__menu-icon" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="show-mobile landing-mobile-menu">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navLinks.map((link) => (
                <button
                  key={link.label}
                  onClick={() => scrollToSection(link.target)}
                  className="landing-mobile-menu__link"
                >
                  {link.label}
                </button>
              ))}

              {/* --- UI: theme toggle row in mobile menu --- */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                marginTop: '8px',
                background: 'rgba(22,163,74,0.06)',
                borderRadius: '10px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Theme</span>
                <ThemeToggle />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button onClick={handleLogin} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1.5px solid #e2e8f0', color: 'inherit', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
                <button onClick={handleSignUp} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}>Get Started</button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* =============================================
          HERO
          ============================================= */}
      <section className="landing-hero">
        <div style={{
          position: 'absolute', top: '-180px', right: '-120px',
          width: '520px', height: '520px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(22,163,74,0.12), transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-160px', left: '-120px',
          width: '460px', height: '460px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)',
        }} />

        <div
          className="hero-grid"
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '40px 32px',
            display: 'grid',
            gridTemplateColumns: '1.05fr 1fr',
            gap: '60px',
            alignItems: 'center',
            width: '100%',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* ===================== LEFT: COPY ===================== */}
          <div>
            <div className="landing-hero__badge">
              <Sparkles size={16} color="#15803d" />
              <span className="landing-hero__badge-text">
                Track Your Carbon Footprint
              </span>
            </div>

            <h1 className="landing-hero__headline">
              Monitor Your
              <span className="landing-hero__headline-accent">
                Carbon Footprint
              </span>
              Make Sustainable Choices
            </h1>

            <p className="landing-hero__desc">{appDescription}</p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '48px' }}>
              <button
                onClick={handleSignUp}
                className="btn-hero"
                style={{
                  padding: '16px 38px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: 'white', border: 'none', borderRadius: '14px',
                  fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
                  letterSpacing: '0.2px',
                }}
              >
                Get Started Free <ArrowRight size={18} />
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="btn-hero landing-hero__cta-secondary"
              >
                Learn More <ChevronRight size={18} />
              </button>
            </div>

            <div
              className="landing-hero__stats-border"
              style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px', paddingTop: '28px',
              }}
            >
              {stats.map((stat, index) => (
                <div key={index}>
                  <div className="landing-hero__stat-value">{stat.value}</div>
                  <div className="landing-hero__stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ===================== RIGHT: TEAM IMPACT SNAPSHOT ===================== */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '520px' }}>
              {/* Glow */}
              <div style={{
                position: 'absolute',
                inset: '-40px',
                background: 'radial-gradient(circle, rgba(22,163,74,0.20), transparent 65%)',
                borderRadius: '40px',
                animation: 'pulseGlow 5s ease-in-out infinite',
                zIndex: 0,
              }} />

              <div className="landing-snapshot">
                {/* ==== Header: Team + LIVE ==== */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: '20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px',
                      background: 'linear-gradient(135deg, #16a34a, #15803d)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                    }}>
                      <Leaf size={19} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div>
                      <div className="landing-snapshot__company">Acme Corp</div>
                      <div className="landing-snapshot__sub">Team Snapshot · This week</div>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '5px 12px', background: '#dcfce7',
                    borderRadius: '20px',
                  }}>
                    <span style={{
                      width: '7px', height: '7px', borderRadius: '50%',
                      background: '#16a34a',
                      animation: 'pulseDot 1.5s ease-in-out infinite',
                    }} />
                    <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#15803d', letterSpacing: '0.5px' }}>
                      LIVE
                    </span>
                  </div>
                </div>

                {/* ==== Main Chart ==== */}
                <div className="landing-snapshot__chart">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <div className="landing-snapshot__chart-label">Weekly CO₂ Emissions</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '4px' }}>
                        <span className="landing-snapshot__chart-value">142.4</span>
                        <span className="landing-snapshot__chart-unit">kg</span>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: '3px',
                          padding: '2px 8px', background: '#dcfce7',
                          color: '#15803d', borderRadius: '10px',
                          fontSize: '11px', fontWeight: 800,
                        }}>
                          <TrendingDown size={10} /> 18%
                        </span>
                      </div>
                    </div>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '10px',
                      background: '#fef3c7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Zap size={17} color="#d97706" />
                    </div>
                  </div>

                  {/* SVG Area Chart */}
                  <svg width="100%" height="90" viewBox="0 0 320 90" preserveAspectRatio="none" style={{ marginTop: '4px' }}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#16a34a" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#16a34a" />
                        <stop offset="100%" stopColor="#15803d" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 60 L 45 45 L 90 55 L 135 30 L 180 42 L 225 22 L 270 35 L 315 15 L 315 90 L 0 90 Z"
                      fill="url(#areaGradient)"
                    />
                    <path
                      d="M 0 60 L 45 45 L 90 55 L 135 30 L 180 42 L 225 22 L 270 35 L 315 15"
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        strokeDasharray: 1000,
                        strokeDashoffset: 0,
                        animation: 'drawLine 1.5s ease-out',
                      }}
                    />
                    <circle cx="315" cy="15" r="4" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
                  </svg>

                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginTop: '6px', padding: '0 2px',
                    fontSize: '9.5px', fontWeight: 600, color: '#94a3b8',
                  }}>
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
                      <span key={d} style={{ color: i === 6 ? '#15803d' : '#94a3b8' }}>{d}</span>
                    ))}
                  </div>
                </div>

                {/* ==== 3 Stat Tiles ==== */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '16px',
                }}>
                  <SnapshotStat
                    icon={<Users size={15} color="#8b5cf6" />}
                    bg="#f3e8ff"
                    value="24"
                    label="Members"
                  />
                  <SnapshotStat
                    icon={<Activity size={15} color="#f59e0b" />}
                    bg="#fef3c7"
                    value="142"
                    label="Activities"
                  />
                  <SnapshotStat
                    icon={<TrendingDown size={15} color="#16a34a" />}
                    bg="#dcfce7"
                    value="-18%"
                    label="CO₂"
                  />
                </div>

                {/* ==== Top Performer Strip ==== */}
                <div className="landing-snapshot__top-performer">
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 10px rgba(245,158,11,0.3)',
                  }}>
                    <Crown size={17} color="#ffffff" strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                      Top Performer
                    </div>
                    <div className="landing-snapshot__performer-name">Sarah Chen</div>
                  </div>
                  <div style={{
                    padding: '4px 10px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#15803d',
                    border: '1px solid #bbf7d0',
                    whiteSpace: 'nowrap',
                  }}>
                    🏅 8 badges
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =============================================
          FEATURES
          ============================================= */}
      <section id="features" className="landing-section landing-section--white">
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <div className="landing-section__badge">
            <Star size={14} color="#15803d" />
            <span className="landing-section__badge-text">Features</span>
          </div>
          <h2 className="landing-section__title">
            Everything You Need to <span className="landing-section__accent">Track Carbon</span>
          </h2>
          <p className="landing-section__desc">
            A complete suite of tools to monitor, analyze, and reduce your carbon footprint.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {features.map((feature, index) => (
              <div key={index} className="landing-card">
                <div
                  className="landing-card__icon-box"
                  style={{ background: `${feature.color}15` }}
                >
                  <feature.icon size={26} color={feature.color} strokeWidth={2.2} />
                </div>
                <h3 className="landing-card__title">{feature.title}</h3>
                <p className="landing-card__desc">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          HOW IT WORKS
          ============================================= */}
      <section id="how-it-works" className="landing-section landing-section--subtle">
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="landing-section__title landing-section__title--tight">
            How It Works
          </h2>
          <p className="landing-section__desc">
            Four simple steps to start tracking your carbon footprint.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', position: 'relative' }}>
            {steps.map((step, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <div className="landing-step__icon-wrap">
                  <step.icon size={30} color="white" strokeWidth={2.2} />
                  <div className="landing-step__num">{index + 1}</div>
                </div>
                <h3 className="landing-step__title">{step.title}</h3>
                <p className="landing-step__desc">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          REVIEWS
          ============================================= */}
      <section id="reviews" className="landing-section landing-section--white">
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="landing-section__title landing-section__title--tight">
            What Our Users Say
          </h2>
          <p className="landing-section__desc">
            Join thousands of users making a difference.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {testimonials.map((t, index) => (
              <div key={index} className="landing-card landing-card--testimonial">
                <div style={{ display: 'flex', gap: '2px', marginBottom: '18px' }}>
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <p className="landing-card__quote">"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #16a34a, #15803d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '16px',
                  }}>
                    {t.image}
                  </div>
                  <div>
                    <div className="landing-card__author-name">{t.name}</div>
                    <div className="landing-card__author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =============================================
          SUPPORT / CTA
          ============================================= */}
      <section id="support" style={{ padding: '100px 32px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', color: 'white' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', background: 'rgba(22,163,74,0.15)',
            borderRadius: '20px', marginBottom: '24px',
          }}>
            <Shield size={14} color="#22c55e" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Support</span>
          </div>
          <h2 style={{ fontSize: '46px', fontWeight: 800, marginBottom: '20px', letterSpacing: '-1.2px', lineHeight: 1.15 }}>
            Ready to Make a Difference?
          </h2>
          <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '40px', lineHeight: 1.6 }}>
            Join thousands of users tracking their carbon footprint and making sustainable choices.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleLogin}
              className="btn-hero"
              style={{
                padding: '16px 40px',
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1.5px solid rgba(255,255,255,0.2)',
                borderRadius: '14px',
                fontSize: '16px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
            >
              <LogIn size={18} /> Log In
            </button>
            <button
              onClick={handleSignUp}
              className="btn-hero"
              style={{
                padding: '16px 44px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: 'white', border: 'none', borderRadius: '14px',
                fontSize: '16px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '10px',
                boxShadow: '0 8px 24px rgba(22,163,74,0.45)',
              }}
            >
              <UserPlus size={18} /> Sign Up Free
            </button>
          </div>
        </div>
      </section>

      {/* =============================================
          FOOTER
          ============================================= */}
      <footer id="contact" style={{
        padding: '60px 32px 32px',
        background: '#0f172a',
        borderTop: '1px solid #1e293b',
      }}>
        <div style={{
          maxWidth: '1280px', margin: '0 auto',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px', height: '38px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Leaf size={20} color="#ffffff" strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: '17px', fontWeight: 800, color: 'white', letterSpacing: '-0.3px' }}>
              {appName}
            </span>
          </div>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            © {new Date().getFullYear()} {appName}. All rights reserved.
          </span>
        </div>
      </footer>

      {/* ============ AI CHATBOT ============ */}
      <ChatFloatingButton />
      <ChatPopup />
    </div>
  );
};

// ============ Snapshot Stat Tile ============
const SnapshotStat = ({ icon, bg, value, label }) => (
  <div className="landing-snapshot__stat-tile">
    <div style={{
      width: '26px', height: '26px', borderRadius: '8px',
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: '8px',
    }}>
      {icon}
    </div>
    <div className="landing-snapshot__stat-tile-value">{value}</div>
    <div className="landing-snapshot__stat-tile-label">{label}</div>
  </div>
);

export default LandingPage;