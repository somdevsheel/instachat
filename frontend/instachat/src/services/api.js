import axios from 'axios';
import Storage from '../utils/storage';



const API_URL = "https://api.grownoww.com/api/v1";
// const API_URL = "http://192.168.1.3:5000/api/v1";

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

export default api;
