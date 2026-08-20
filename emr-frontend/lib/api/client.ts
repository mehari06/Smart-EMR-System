import axios from 'axios';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/useAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach token
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Response interceptor: Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it's a 401, handle logout
    if (error.response?.status === 401) {
      const { logout } = useAuthStore.getState();
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    
    // Improve error object with DRF details so the UI can show exactly what failed
    if (error.response?.data) {
      const data = error.response.data;
      if (typeof data === 'object') {
        // Try to extract the most descriptive error message
        const messages = Object.entries(data).map(([key, val]) => {
          if (Array.isArray(val)) return `${key}: ${val[0]}`;
          if (typeof val === 'string') return val;
          return `${key}: Invalid input`;
        });
        
        if (messages.length > 0) {
           error.message = messages.join(' | ');
           // We also attach it to detail if consumers are looking for error.response.data.detail
           if (!data.detail) {
               data.detail = error.message;
           }
        }
      }
    }
    
    return Promise.reject(error);
  }
);