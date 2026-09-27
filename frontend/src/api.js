import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (username, password) => api.post('/auth/login', { username, password });
export const getMe = () => api.get('/auth/me');

// Cases
export const getCases = () => api.get('/cases');
export const getCase = (id) => api.get(`/cases/${id}`);
export const createCase = (data) => api.post('/cases', data);
export const uploadData = (caseId, formData) => api.post(`/cases/${caseId}/upload`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const uploadText = (caseId, text, sourceType) => api.post(`/cases/${caseId}/upload`, { text, sourceType });

// Entities
export const getEntities = (caseId, params = {}) => api.get(`/cases/${caseId}/entities`, { params });

// Network
export const getNetwork = (caseId) => api.get(`/cases/${caseId}/network`);

// Influencers
export const getInfluencers = (caseId) => api.get(`/cases/${caseId}/influencers`);

// Patterns
export const getPatterns = (caseId) => api.get(`/cases/${caseId}/patterns`);

// Stats
export const getStats = (caseId) => api.get(`/cases/${caseId}/stats`);

// Analyze
export const analyzeCase = (caseId) => api.post(`/cases/${caseId}/analyze`);

export default api;
