const API = '/api/v1';

let csrfToken = null;

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function refreshCsrf() {
  const res = await fetch(`${API}/csrf-token`, { credentials: 'include' });
  const body = await parseBody(res);
  csrfToken = body?.data?.csrfToken || null;
  return csrfToken;
}

export async function api(path, { method = 'GET', json, form, headers } = {}) {
  if (!csrfToken && method !== 'GET') await refreshCsrf();
  const nextHeaders = { Accept: 'application/json', ...headers };
  let body;
  if (json !== undefined) {
    nextHeaders['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (form) {
    body = form;
  }
  if (method !== 'GET' && csrfToken) nextHeaders['X-CSRF-Token'] = csrfToken;
  const res = await fetch(`${API}${path}`, {
    method,
    credentials: 'include',
    headers: nextHeaders,
    body,
  });
  const payload = await parseBody(res);
  if (payload?.data?.csrfToken) csrfToken = payload.data.csrfToken;
  if (!res.ok) {
    const error = new Error(payload?.error?.message || 'Request failed');
    error.status = res.status;
    error.code = payload?.error?.code;
    error.details = payload?.error?.details;
    throw error;
  }
  return payload?.data;
}

export const Auth = {
  me: () => api('/auth/me').catch(() => null),
  register: (json) => api('/auth/register', { method: 'POST', json }).then(async (data) => {
    await refreshCsrf();
    return data;
  }),
  login: (json) => api('/auth/login', { method: 'POST', json }).then(async (data) => {
    await refreshCsrf();
    return data;
  }),
  logout: () => api('/auth/logout', { method: 'POST' }).then(async (data) => {
    await refreshCsrf();
    return data;
  }),
  verifyEmail: (token) => api('/auth/verify-email', { method: 'POST', json: { token } }),
  resendVerification: (email) => api('/auth/resend-verification', { method: 'POST', json: { email } }),
  forgotPassword: (email) => api('/auth/forgot-password', { method: 'POST', json: { email } }),
  resetPassword: (token, password) => api('/auth/reset-password', { method: 'POST', json: { token, password } }),
};

export const Users = {
  get: (username) => api(`/users/${encodeURIComponent(username)}`),
  blogs: (username, query = '') => api(`/users/${encodeURIComponent(username)}/blogs${query}`),
  followers: (username, query = '') => api(`/users/${encodeURIComponent(username)}/followers${query}`),
  following: (username, query = '') => api(`/users/${encodeURIComponent(username)}/following${query}`),
  follow: (id) => api(`/users/${id}/follow`, { method: 'PUT' }),
  unfollow: (id) => api(`/users/${id}/follow`, { method: 'DELETE' }),
  updateMe: (form) => api('/users/me', { method: 'PATCH', form }),
  updateMeJson: (json) => api('/users/me', { method: 'PATCH', json }),
  changePassword: (json) => api('/users/me/password', { method: 'PATCH', json }),
};

export const Blogs = {
  list: (query = '') => api(`/blogs${query}`),
  mine: (query = '') => api(`/blogs?mine=1${query ? `&${query.replace('?', '')}` : ''}`),
  create: (json) => api('/blogs', { method: 'POST', json }),
  createForm: (form) => api('/blogs', { method: 'POST', form }),
  bySlug: (slug) => api(`/blogs/${encodeURIComponent(slug)}`),
  byId: (id) => api(`/blogs/id/${id}`),
  update: (id, json) => api(`/blogs/${id}`, { method: 'PATCH', json }),
  updateForm: (id, form) => api(`/blogs/${id}`, { method: 'PATCH', form }),
  remove: (id) => api(`/blogs/${id}`, { method: 'DELETE' }),
  related: (id) => api(`/blogs/${id}/related`),
  like: (id) => api(`/blogs/${id}/like`, { method: 'PUT' }),
  unlike: (id) => api(`/blogs/${id}/like`, { method: 'DELETE' }),
  comments: (id) => api(`/blogs/${id}/comments`),
  addComment: (id, json) => api(`/blogs/${id}/comments`, { method: 'POST', json }),
};

export const Comments = {
  update: (id, json) => api(`/comments/${id}`, { method: 'PATCH', json }),
  remove: (id) => api(`/comments/${id}`, { method: 'DELETE' }),
};

export const Social = {
  feed: (query = '') => api(`/feed${query}`),
  search: (query = '') => api(`/search${query}`),
  tag: (tag, query = '') => api(`/tags/${encodeURIComponent(tag)}/blogs${query}`),
  bookmark: (id) => api(`/me/bookmarks/${id}`, { method: 'PUT' }),
  unbookmark: (id) => api(`/me/bookmarks/${id}`, { method: 'DELETE' }),
  bookmarks: (query = '') => api(`/me/bookmarks${query}`),
  notifications: (query = '') => api(`/notifications${query}`),
  readOne: (id) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAll: () => api('/notifications/read-all', { method: 'PATCH' }),
};

export const Admin = {
  reports: (query = '') => api(`/admin/reports${query}`),
  report: (id) => api(`/admin/reports/${id}`),
  review: (id, json) => api(`/admin/reports/${id}`, { method: 'PATCH', json }),
};

export const Reports = {
  create: (json) => api('/reports', { method: 'POST', json }),
};

export const Uploads = {
  inline: (file) => {
    const form = new FormData();
    form.append('image', file);
    return api('/uploads/inline', { method: 'POST', form });
  },
};
