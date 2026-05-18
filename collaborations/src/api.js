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

  if (!res.ok) throw new Error((await res.text()) || `${res.status}`);
  return res.json();
}

// Browser → Cloudinary direct upload. Backend signs the request so the secret
// stays server-side; the file itself never goes through our serverless function
// (Vercel caps payloads at 4.5 MB).
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

export const api = {
  submit: async ({ title, brand, contactEmail, videoFile, startsAt, endsAt }) => {
    const videoUrl = videoFile ? await directUpload(videoFile, 'ads') : undefined;
    return request('POST', '/api/collaborations', {
      title,
      brand,
      contactEmail,
      videoUrl,
      startsAt,
      endsAt,
    });
  },
  mine: () => request('GET', '/api/collaborations/mine'),
  mockPay: (id) => request('POST', `/api/collaborations/${id}/mock-pay`),
  cancelPlacement: (id) => request('POST', `/api/collaborations/${id}/cancel`),
};
