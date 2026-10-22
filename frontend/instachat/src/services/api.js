import axios from 'axios';
import Storage from '../utils/storage';



// Set EXPO_PUBLIC_API_URL in frontend/instachat/.env for local dev
// (e.g. http://<your-LAN-IP>:5000/api/v1). Builds default to production.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://api.grownoww.com/api/v1";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

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
