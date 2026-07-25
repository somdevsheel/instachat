import axios from 'axios';
import Storage from '../utils/storage';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 15000,
});

// Each consuming app calls this once at startup with its own env-specific
// backend URL (frontend/instachat and frontend/web each point at different
// places depending on dev/prod), instead of this package hardcoding one.
export const configureApiBaseUrl = (url) => {
  api.defaults.baseURL = url;
};

api.interceptors.request.use(async (config) => {
  const token = await Storage.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
