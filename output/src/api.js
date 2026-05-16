const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const DETECTION_TOKEN = import.meta.env.VITE_DETECTION_TOKEN || '';

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

async function post(path, body) {
  const headers = { 'content-type': 'application/json' };
  if (DETECTION_TOKEN) headers['x-detection-token'] = DETECTION_TOKEN;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

export const api = {
  playlist: () => get('/api/ads/playlist'),
  latestEvent: (since) => get(`/api/detection/latest?since=${since}`),
  profiles: () => get('/api/recognition/profiles'),
  detect: (personId) => post('/api/detection/event', { personId }),
  stars: (personId) => get(`/api/stars/${personId}`),
};
