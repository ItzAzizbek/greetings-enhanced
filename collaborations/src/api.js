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

  if (!res.ok) throw new Error((await res.text()) || `${res.status}`);
  return res.json();
}

function submissionFormData({ title, brand, contactEmail, videoFile, startsAt, endsAt }) {
  const fd = new FormData();
  fd.append('title', title);
  if (brand) fd.append('brand', brand);
  if (contactEmail) fd.append('contactEmail', contactEmail);
  if (videoFile) fd.append('video', videoFile);
  fd.append('startsAt', String(startsAt));
  fd.append('endsAt', String(endsAt));
  return fd;
}

export const api = {
  submit: (body) => request('POST', '/api/collaborations', submissionFormData(body)),
  mine: () => request('GET', '/api/collaborations/mine'),
  mockPay: (id) => request('POST', `/api/collaborations/${id}/mock-pay`),
  cancelPlacement: (id) => request('POST', `/api/collaborations/${id}/cancel`),
};
