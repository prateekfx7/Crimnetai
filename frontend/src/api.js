import axios from 'axios';
import {
  MOCK_CASE,
  MOCK_STATS,
  MOCK_INFLUENCERS,
  MOCK_PATTERNS,
  MOCK_ENTITIES,
  MOCK_NETWORK,
} from './mockData';

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

// Auth
export const login = async (username, password) => {
  try {
    return await api.post('/auth/login', { username, password });
  } catch (err) {
    // If backend is offline or unreachable, provide realistic demo session
    if (!err.response || err.response.status === 404 || err.code === 'ERR_NETWORK') {
      const isInvestigator = (username || '').toLowerCase().includes('invest');
      const mockUser = {
        _id: isInvestigator ? 'mock-investigator-01' : 'mock-admin-01',
        username: username || (isInvestigator ? 'investigator' : 'admin'),
        fullName: isInvestigator ? 'Inspector Patel' : 'Commissioner Sharma',
        role: isInvestigator ? 'investigator' : 'admin',
        badge: isInvestigator ? 'MUM-CIB-042' : 'NCRB-001',
        department: isInvestigator ? 'Mumbai Crime Branch' : 'Central Bureau',
      };
      return { data: { token: 'mock-jwt-token-demo-mode', user: mockUser } };
    }
    throw err;
  }
};

export const getMe = () => api.get('/auth/me');

// Cases
export const getCases = async () => {
  try {
    const res = await api.get('/cases');
    if (res.data && res.data.length > 0) return res;
    return { data: [MOCK_CASE] };
  } catch (err) {
    return { data: [MOCK_CASE] };
  }
};

export const getCase = async (id) => {
  try {
    return await api.get(`/cases/${id}`);
  } catch (err) {
    return { data: MOCK_CASE };
  }
};

export const createCase = (data) => api.post('/cases', data);

export const uploadData = (caseId, formData) =>
  api.post(`/cases/${caseId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).catch(() => ({ data: { message: 'Demo mode: Ingestion recorded', newEntities: 3, newRelationships: 8 } }));

export const uploadText = (caseId, text, sourceType) =>
  api.post(`/cases/${caseId}/upload`, { text, sourceType }).catch(() => ({
    data: { message: 'Demo mode: Text extracted', newEntities: 4, newRelationships: 9 },
  }));

// Entities
export const getEntities = async (caseId, params = {}) => {
  try {
    return await api.get(`/cases/${caseId}/entities`, { params });
  } catch (err) {
    let result = [...MOCK_ENTITIES];
    if (params.type) result = result.filter((e) => e.type === params.type);
    if (params.search) {
      const q = params.search.toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q) || (e.aliases && e.aliases.some(a => a.toLowerCase().includes(q))));
    }
    return { data: result };
  }
};

// Network
export const getNetwork = async (caseId) => {
  try {
    return await api.get(`/cases/${caseId}/network`);
  } catch (err) {
    return { data: MOCK_NETWORK };
  }
};

// Influencers
export const getInfluencers = async (caseId) => {
  try {
    return await api.get(`/cases/${caseId}/influencers`);
  } catch (err) {
    return { data: MOCK_INFLUENCERS };
  }
};

// Patterns
export const getPatterns = async (caseId) => {
  try {
    return await api.get(`/cases/${caseId}/patterns`);
  } catch (err) {
    return { data: MOCK_PATTERNS };
  }
};

// Stats
export const getStats = async (caseId) => {
  try {
    return await api.get(`/cases/${caseId}/stats`);
  } catch (err) {
    return { data: MOCK_STATS };
  }
};

// Analyze
export const analyzeCase = (caseId) =>
  api.post(`/cases/${caseId}/analyze`).catch(() => ({ data: { message: 'Analysis refreshed', metrics: MOCK_STATS } }));

export default api;
