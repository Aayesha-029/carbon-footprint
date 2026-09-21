import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    appName: 'CarbonTrack',
    appDescription: 'Track your carbon footprint. Make a difference.',
    emailNotifications: true,
    userRegistration: true,
    defaultRole: 'USER',
    carbonGoalEnabled: true,
    leaderboardEnabled: true,
    badgesEnabled: true,
    allowSocialLogin: true,
    maintenanceMode: false,
    theme: 'light',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Apply theme to entire application
  const applyTheme = useCallback((theme) => {
    console.log('🎨 Applying theme:', theme);
    
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
      
      document.documentElement.style.setProperty('--bg-primary', '#0f172a');
      document.documentElement.style.setProperty('--bg-secondary', '#1e293b');
      document.documentElement.style.setProperty('--bg-card', '#1e293b');
      document.documentElement.style.setProperty('--text-primary', '#f1f5f9');
      document.documentElement.style.setProperty('--text-secondary', '#94a3b8');
      document.documentElement.style.setProperty('--border-color', '#334155');
      
      document.body.style.backgroundColor = '#0f172a';
      document.body.style.color = '#f1f5f9';
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
      
      document.documentElement.style.setProperty('--bg-primary', '#ffffff');
      document.documentElement.style.setProperty('--bg-secondary', '#f8fafc');
      document.documentElement.style.setProperty('--bg-card', '#ffffff');
      document.documentElement.style.setProperty('--text-primary', '#0f172a');
      document.documentElement.style.setProperty('--text-secondary', '#475569');
      document.documentElement.style.setProperty('--border-color', '#e2e8f0');
      
      document.body.style.backgroundColor = '#f1f5f9';
      document.body.style.color = '#0f172a';
    }
  }, []);

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('⚠️ No token, using default settings');
        setLoading(false);
        return;
      }

      console.log('📊 Loading system settings...');
      const response = await axiosClient.get('/admin/settings');
      
      console.log('📊 Response:', response.data);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        console.log('✅ Settings loaded:', data);
        setSettings(data);
        
        if (data.theme) {
          applyTheme(data.theme);
        }
        
        return data;
      } else {
        console.error('❌ Failed to load settings');
        setError('Failed to load settings');
      }
    } catch (err) {
      console.error('❌ Error loading settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [applyTheme]);

  // Update settings
  const updateSettings = useCallback(async (newSettings) => {
    try {
      console.log('📤 CALLING updateSettings with:', newSettings);
      
      const payload = {
        appName: newSettings.appName || 'CarbonTrack',
        appDescription: newSettings.appDescription || '',
        emailNotifications: newSettings.emailNotifications !== undefined ? newSettings.emailNotifications : true,
        userRegistration: newSettings.userRegistration !== undefined ? newSettings.userRegistration : true,
        defaultRole: newSettings.defaultRole || 'USER',
        carbonGoalEnabled: newSettings.carbonGoalEnabled !== undefined ? newSettings.carbonGoalEnabled : true,
        leaderboardEnabled: newSettings.leaderboardEnabled !== undefined ? newSettings.leaderboardEnabled : true,
        badgesEnabled: newSettings.badgesEnabled !== undefined ? newSettings.badgesEnabled : true,
        allowSocialLogin: newSettings.allowSocialLogin !== undefined ? newSettings.allowSocialLogin : true,
        maintenanceMode: newSettings.maintenanceMode !== undefined ? newSettings.maintenanceMode : false,
        theme: newSettings.theme || 'light',
      };
      
      console.log('📤 Sending PUT request to /admin/settings with payload:', payload);
      
      const response = await axiosClient.put('/admin/settings', payload);
      
      console.log('📤 PUT Response:', response.data);
      
      if (response.data && response.data.success) {
        const data = response.data.data;
        console.log('✅ Settings updated successfully:', data);
        setSettings(data);
        
        if (data.theme) {
          applyTheme(data.theme);
        }
        
        window.dispatchEvent(new Event('settingsUpdated'));
        return { success: true, data };
      } else {
        console.error('❌ Update failed:', response.data);
        return { success: false, error: response.data?.error || 'Update failed' };
      }
    } catch (err) {
      console.error('❌ Error updating settings:', err);
      console.error('❌ Error details:', err.response?.data);
      return { success: false, error: err.message };
    }
  }, [applyTheme]);

  // Reset settings
  const resetSettings = useCallback(async () => {
    try {
      console.log('🔄 Resetting settings...');
      const response = await axiosClient.post('/admin/settings/reset');
      console.log('🔄 Reset Response:', response.data);
      
      if (response.data && response.data.success) {
        await loadSettings();
        window.dispatchEvent(new Event('settingsUpdated'));
        return { success: true };
      }
      return { success: false, error: response.data?.error };
    } catch (err) {
      console.error('Error resetting settings:', err);
      return { success: false, error: err.message };
    }
  }, [loadSettings]);

  // Refresh settings
  const refreshSettings = useCallback(() => {
    console.log('🔄 Refreshing settings...');
    loadSettings();
  }, [loadSettings]);

  // Load on mount
  useEffect(() => {
    loadSettings();
    
    const handleSettingsUpdated = () => {
      console.log('🔄 Settings updated event received');
      loadSettings();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, [loadSettings]);

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    refreshSettings,
    applyTheme,
    loadSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;