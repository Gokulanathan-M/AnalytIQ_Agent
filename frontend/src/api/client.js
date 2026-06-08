import axios from 'axios';

const BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 min — analysis can be long
});

// ── Upload ──────────────────────────────────────────────────
export const uploadDataset = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
};

// ── Analyze ─────────────────────────────────────────────────
export const analyzeDataset = (sessionId, prompt = '') => {
  const params = { session_id: sessionId };
  if (prompt) params.prompt = prompt;
  return api.post('/analyze', null, { params });
};

// ── Chat ────────────────────────────────────────────────────
export const chatWithData = (sessionId, query) =>
  api.post('/chat', null, { params: { session_id: sessionId, query } });

// ── Charts ──────────────────────────────────────────────────
export const getChart = (sessionId, chartName) =>
  api.get(`/charts/${sessionId}/${chartName}`);

// ── Report ──────────────────────────────────────────────────
export const getReportUrl = (sessionId) =>
  `${BASE_URL}/report/${sessionId}`;

// ── Sessions ────────────────────────────────────────────────
export const listSessions = () => api.get('/sessions');

export default api;
