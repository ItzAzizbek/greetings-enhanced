import { auth } from './firebase.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { authorization: `Bearer ${token}` };
}

async function request(method, path, body) {
  const headers = { ...(await authHeaders()), 'content-type': 'application/json' };

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// Browser → Cloudinary direct upload. We ask the backend to sign the request
// (so the secret stays server-side), then POST the file straight to Cloudinary
// to avoid Vercel's 4.5 MB serverless payload limit.
async function directUpload(file, kind) {
  const sign = await request('POST', '/api/uploads/sign', { kind });
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', sign.apiKey);
  fd.append('timestamp', String(sign.timestamp));
  fd.append('signature', sign.signature);
  fd.append('folder', sign.folder);
  const res = await fetch(sign.uploadUrl, { method: 'POST', body: fd });
  if (!res.ok) {
    throw new Error('Cloudinary upload failed: ' + (await res.text()));
  }
  const json = await res.json();
  return json.secure_url;
}

async function personBody({ name, greeting, linkedUserId, birthday, photoFile, removePhoto }) {
  const body = {};
  if (name != null) body.name = name;
  if (greeting != null) body.greeting = greeting;
  if (linkedUserId != null) body.linkedUserId = linkedUserId;
  if (birthday != null) body.birthday = birthday;
  if (removePhoto) body.removePhoto = true;
  if (photoFile) body.photoUrl = await directUpload(photoFile, 'people');
  return body;
}

async function adBody({ title, status, videoFile }) {
  const body = {};
  if (title != null) body.title = title;
  if (status != null) body.status = status;
  if (videoFile) body.videoUrl = await directUpload(videoFile, 'ads');
  return body;
}

export const api = {
  // Ads
  listAds: () => request('GET', '/api/ads'),
  createAd: async (data) => request('POST', '/api/ads', await adBody(data)),
  updateAd: async (id, data) => request('PATCH', `/api/ads/${id}`, await adBody(data)),
  deleteAd: (id) => request('DELETE', `/api/ads/${id}`),
  reorderAds: (order) => request('POST', '/api/ads/reorder', { order }),
  reviewAd: (id, body) => request('POST', `/api/ads/${id}/review`, body),

  // Persons
  listPersons: () => request('GET', '/api/persons'),
  createPerson: async (data) => request('POST', '/api/persons', await personBody(data)),
  updatePerson: async (id, data) => request('PATCH', `/api/persons/${id}`, await personBody(data)),
  deletePerson: (id) => request('DELETE', `/api/persons/${id}`),

  // Collaborations queue
  collabQueue: () => request('GET', '/api/collaborations/queue'),

  // Detections / activity
  recentEntrances: (limit = 50) => request('GET', `/api/detection/entrances?limit=${limit}`),
  triggerDetection: (personId) =>
    request('POST', '/api/detection/event', { personId }),

  // Sky — admin-managed constellation per person
  listStars: (personId) => request('GET', `/api/stars/${personId}`),
  addStar: (personId, data) => request('POST', `/api/stars/${personId}`, data),
  updateStar: (starId, data) => request('PATCH', `/api/stars/${starId}`, data),
  deleteStar: (starId) => request('DELETE', `/api/stars/${starId}`),
};
