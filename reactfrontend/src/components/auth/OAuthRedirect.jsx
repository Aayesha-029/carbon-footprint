import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const OAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const user = params.get('user');
    const role = params.get('role');
    const id = params.get('id');

    if (token) {
      localStorage.setItem('token', token);
      if (user) localStorage.setItem('userName', user);
      if (role) localStorage.setItem('userRole', role);
      if (id) localStorage.setItem('userId', id);

      // Redirect to dashboard
            // Redirect based on role
      if (role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'ORGANIZER') {
        navigate('/organizer/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      // If no token, redirect to login with error
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [location, navigate]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ 
          width: '48px', height: '48px',
          border: '4px solid #e2e8f0', borderTop: '4px solid #22c55e',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <p style={{ color: '#64748b', fontSize: '16px' }}>Logging you in with Google...</p>
      </div>
    </div>
  );
};

export default OAuthRedirect;