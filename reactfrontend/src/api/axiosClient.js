import axios from 'axios';

// Create axios instance
const axiosClient = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - adds token to every request
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔑 Token for request:', token ? token.substring(0, 30) + '...' : 'No token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Added Authorization header to:', config.url);
    }
    console.log('📤 Request:', config.method.toUpperCase(), config.url, config.data || '');
    console.log('📤 Request:', config.method.toUpperCase(), config.baseURL + config.url, config.data || '');
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles auth errors
// axiosClient.interceptors.response.use(
//   (response) => {
//     console.log('✅ Response:', response.status, response.config.url);
//     return response;
//   },
//   (error) => {
//     console.error('❌ Response Error:', error.response?.status, error.response?.data || error.message);
    
//     if (error.response?.status === 401) {
//       console.log('🔒 Token expired or invalid, redirecting to login');
//       localStorage.removeItem('token');
//       localStorage.removeItem('userRole');
//       localStorage.removeItem('userName');
//       localStorage.removeItem('userId');
//       if (!window.location.pathname.includes('/login')) {
//         window.location.href = '/login';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

axiosClient.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.response?.status, error.response?.config?.url, error.response?.data);
    if (error.response?.status === 401) {
      console.log('🔒 Token expired or invalid, redirecting to login');
      // ... existing clear and redirect
    }
    return Promise.reject(error);
  }
);

export default axiosClient;