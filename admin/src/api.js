import { auth } from './firebase.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { authorization: `Bearer ${token}` };
}

async function request(method, path, body) {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = { ...(await authHeaders()) };
  if (!isForm) headers['content-type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body == null ? undefined : isForm ? body : JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function personFormData({ name, greeting, linkedUserId, birthday, photoFile, removePhoto }) {
  const fd = new FormData();
  if (name != null) fd.append('name', name);
  if (greeting != null) fd.append('greeting', greeting);
  if (linkedUserId != null) fd.append('linkedUserId', linkedUserId);
  if (birthday != null) fd.append('birthday', birthday);
  if (photoFile) fd.append('photo', photoFile);
  if (removePhoto) fd.append('removePhoto', 'true');
  return fd;
}

function adFormData({ title, status, videoFile }) {
  const fd = new FormData();
  if (title != null) fd.append('title', title);
  if (status != null) fd.append('status', status);
  if (videoFile) fd.append('video', videoFile);
  return fd;
}

export const api = {
  // Ads (multipart for video upload)
  listAds: () => request('GET', '/api/ads'),
  createAd: (data) => request('POST', '/api/ads', adFormData(data)),
  updateAd: (id, data) =>
    request(
      'PATCH',
      `/api/ads/${id}`,
      data.videoFile ? adFormData(data) : data,
    ),
  deleteAd: (id) => request('DELETE', `/api/ads/${id}`),
  reorderAds: (order) => request('POST', '/api/ads/reorder', { order }),
  reviewAd: (id, body) => request('POST', `/api/ads/${id}/review`, body),

  // Persons (multipart for photo upload)
  listPersons: () => request('GET', '/api/persons'),
  createPerson: (data) => request('POST', '/api/persons', personFormData(data)),
  updatePerson: (id, data) => request('PATCH', `/api/persons/${id}`, personFormData(data)),
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
