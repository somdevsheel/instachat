import axios from 'axios';

// Base API URL - uses Vite proxy in dev, change for production
const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// ============ DASHBOARD ============
export const dashboardApi = {
  getStats: () => api.get('/admin/dashboard'),
};

// ============ USERS ============
export const usersApi = {
  getAll: (params: Record<string, string | number>) =>
    api.get('/admin/users', { params }),
  getById: (userId: string) => api.get(`/admin/users/${userId}`),
  ban: (userId: string, reason: string) =>
    api.put(`/admin/users/${userId}/ban`, { reason }),
  unban: (userId: string) => api.put(`/admin/users/${userId}/unban`),
  suspend: (userId: string, days: number, reason: string) =>
    api.put(`/admin/users/${userId}/suspend`, { days, reason }),
  delete: (userId: string) => api.delete(`/admin/users/${userId}`),
};

// ============ POSTS ============
export const postsApi = {
  getAll: (params: Record<string, string | number>) =>
    api.get('/admin/posts', { params }),
  delete: (postId: string) => api.delete(`/admin/posts/${postId}`),
};

// ============ REELS ============
export const reelsApi = {
  getAll: (params: Record<string, string | number>) =>
    api.get('/admin/reels', { params }),
  delete: (reelId: string) => api.delete(`/admin/reels/${reelId}`),
};

// ============ STORIES ============
export const storiesApi = {
  getAll: (params: Record<string, string | number | boolean>) =>
    api.get('/admin/stories', { params }),
  delete: (storyId: string) => api.delete(`/admin/stories/${storyId}`),
};

// ============ COMMENTS ============
export const commentsApi = {
  getAll: (params: Record<string, string | number>) =>
    api.get('/admin/comments', { params }),
  delete: (commentId: string) => api.delete(`/admin/comments/${commentId}`),
};

// ============ REPORTS ============
export const reportsApi = {
  getAll: (params: Record<string, string | number>) =>
    api.get('/admin/reports', { params }),
  getById: (reportId: string) => api.get(`/admin/reports/${reportId}`),
  takeAction: (reportId: string, action: string, adminNotes: string) =>
    api.put(`/admin/reports/${reportId}/action`, { action, adminNotes }),
};

export default api;
