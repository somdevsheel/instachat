import axios from 'axios';
import Storage from '../utils/storage';

// const API_URL = 'http://192.168.1.3:5000/api/v1';
const API_URL = "http://43.205.253.88:5000/api/v1"

const api = axios.create({
  baseURL: API_URL,
});

/* ============================
   Attach Auth Token
============================ */
api.interceptors.request.use(
  async (config) => {
    const token = await Storage.getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
