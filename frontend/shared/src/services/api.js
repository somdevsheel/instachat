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

// Session revoked / expired / account banned: the server tags these with
// code SESSION_INVALID. Apps register what to do (log out) via
// onSessionInvalid — kept as a callback to avoid importing the store here.
let sessionInvalidHandler = null;
export const onSessionInvalid = (handler) => {
  sessionInvalidHandler = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error?.config?.url || '';
    if (
      error?.response?.data?.code === 'SESSION_INVALID' &&
      !url.endsWith('/auth/logout') &&
      sessionInvalidHandler
    ) {
      sessionInvalidHandler(error.response.data.message);
    }
    return Promise.reject(error);
  }
);

export default api;
