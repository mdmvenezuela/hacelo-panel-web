// src/lib/api.js
const BASE = import.meta.env.VITE_API_URL || '';

const req = async (method, path, body) => {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${BASE}/api/v1/admin${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error del servidor');
  return data;
};

export const api = {
  get:    (path)       => req('GET',    path),
  post:   (path, body) => req('POST',   path, body),
  patch:  (path, body) => req('PATCH',  path, body),
  delete: (path)       => req('DELETE', path),
};
