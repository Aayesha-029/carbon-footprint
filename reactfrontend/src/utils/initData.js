/**
 * Initialize data with default values if not exists
 */
export const initializeData = () => {
  // Check and initialize activities
  if (!localStorage.getItem('carbonActivities')) {
    localStorage.setItem('carbonActivities', JSON.stringify([]));
  }

  // Check and initialize users
  if (!localStorage.getItem('carbonUsers')) {
    const defaultUsers = [
      { id: 1, name: 'Demo User', email: 'demo@example.com', role: 'USER', status: 'Active', joined: new Date().toISOString().split('T')[0], activities: 0, co2e: 0 },
      { id: 2, name: 'Admin User', email: 'admin@example.com', role: 'ADMIN', status: 'Active', joined: new Date().toISOString().split('T')[0], activities: 0, co2e: 0 },
    ];
    localStorage.setItem('carbonUsers', JSON.stringify(defaultUsers));
  }

  // Check and initialize goals
  if (!localStorage.getItem('carbonGoals')) {
    localStorage.setItem('carbonGoals', JSON.stringify([]));
  }

  // Check and initialize badges
  if (!localStorage.getItem('carbonBadges')) {
    localStorage.setItem('carbonBadges', JSON.stringify([]));
  }

  // Check and initialize admin badges
  if (!localStorage.getItem('carbonAdminBadges')) {
    localStorage.setItem('carbonAdminBadges', JSON.stringify([]));
  }

  // Check and initialize preferences
  if (!localStorage.getItem('carbonPreferences')) {
    const defaultPrefs = {
      preferredUnits: 'METRIC',
      dietType: 'OMNIVORE',
      primaryTransportMode: 'CAR',
      energySource: 'GRID',
      notificationsEnabled: true,
    };
    localStorage.setItem('carbonPreferences', JSON.stringify(defaultPrefs));
  }
};