import { auth } from './firebase.js';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { authorization: `Bearer ${token}` };
}

async function request(method, path, body) {
  const headers = { 'content-type': 'application/json', ...(await authHeaders()) };
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body == null ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.text()) || `${res.status}`);
  return res.json();
}

export const api = {
  me: () => request('GET', '/api/users/me'),
  leaderboard: () => request('GET', '/api/users/leaderboard'),
};
