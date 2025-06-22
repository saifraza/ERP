export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    logout: `${API_BASE_URL}/api/auth/logout`,
    me: `${API_BASE_URL}/api/auth/me`,
  },
  dashboard: `${API_BASE_URL}/api/dashboard`,
  farmers: `${API_BASE_URL}/api/farmers`,
  weighbridge: `${API_BASE_URL}/api/weighbridge`,
  divisions: {
    sugar: `${API_BASE_URL}/api/sugar`,
    power: `${API_BASE_URL}/api/power`,
    ethanol: `${API_BASE_URL}/api/ethanol`,
    feed: `${API_BASE_URL}/api/feed`,
  },
};