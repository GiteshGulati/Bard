// ── API Client ──────────────────────────────────────────────────────────────
// Centralised fetch wrapper that:
//  1. Attaches credentials (session cookie) to every request
//  2. Fetches + caches a CSRF token and attaches it to mutating requests
//  3. Normalises error shapes from the server

const BASE = '/api/v1'

let _csrfToken = null

async function getCsrfToken() {
  if (_csrfToken) return _csrfToken
  const res = await fetch(`${BASE}/csrf-token`, { credentials: 'include' })
  const json = await res.json()
  _csrfToken = json?.data?.csrfToken ?? null
  return _csrfToken
}

/** Invalidate the CSRF cache (e.g. after login/logout which regenerates session) */
export function clearCsrf() {
  _csrfToken = null
}

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

async function request(path, { json, headers: extraHeaders, ...opts } = {}) {
  const method = (opts.method ?? 'GET').toUpperCase()
  const headers = new Headers(extraHeaders)

  let body = opts.body
  if (json !== undefined) {
    body = JSON.stringify(json)
    headers.set('Content-Type', 'application/json')
  }

  if (MUTATING.has(method)) {
    const token = await getCsrfToken()
    if (token) headers.set('x-csrf-token', token)
  }

  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    method,
    headers,
    body,
    credentials: 'include',
  })

  if (MUTATING.has(method) && res.ok) {
    if (path.startsWith('/auth/login') || path.startsWith('/auth/logout') || path.startsWith('/auth/register')) {
      clearCsrf()
    }
  }

  let data
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }

  if (!res.ok) {
    const message =
      (typeof data === 'object' && data?.error?.message) ||
      (typeof data === 'string' && data) ||
      `Request failed: ${res.status}`
    const err = new Error(message)
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  me: () => request('/auth/me'),
  register: (body) => request('/auth/register', { method: 'POST', json: body }),
  login: (body) => request('/auth/login', { method: 'POST', json: body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  verifyEmail: (body) => request('/auth/verify-email', { method: 'POST', json: body }),
  resendVerification: (body) => request('/auth/resend-verification', { method: 'POST', json: body }),
  forgotPassword: (body) => request('/auth/forgot-password', { method: 'POST', json: body }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', json: body }),
}

// ── Blogs ───────────────────────────────────────────────────────────────────
export const blogs = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/blogs${qs ? '?' + qs : ''}`)
  },
  get: (slug) => request(`/blogs/${slug}`),
  getById: (id) => request(`/blogs/id/${id}`),
  search: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/search${qs ? '?' + qs : ''}`)
  },
  feed: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/feed${qs ? '?' + qs : ''}`)
  },
  related: (id) => request(`/blogs/${id}/related`),
  tagBlogs: (tag, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/tags/${tag}/blogs${qs ? '?' + qs : ''}`)
  },
  create: (body) => {
    if (body instanceof FormData) return request('/blogs', { method: 'POST', body })
    return request('/blogs', { method: 'POST', json: body })
  },
  update: (id, body) => {
    if (body instanceof FormData) return request(`/blogs/${id}`, { method: 'PATCH', body })
    return request(`/blogs/${id}`, { method: 'PATCH', json: body })
  },
  delete: (id) => request(`/blogs/${id}`, { method: 'DELETE' }),
  like: (id) => request(`/blogs/${id}/like`, { method: 'PUT' }),
  unlike: (id) => request(`/blogs/${id}/like`, { method: 'DELETE' }),
}

// ── Comments ─────────────────────────────────────────────────────────────────
export const comments = {
  list: (blogId) => request(`/blogs/${blogId}/comments`),
  create: (blogId, body) => request(`/blogs/${blogId}/comments`, { method: 'POST', json: body }),
  update: (commentId, body) => request(`/comments/${commentId}`, { method: 'PATCH', json: body }),
  delete: (commentId) => request(`/comments/${commentId}`, { method: 'DELETE' }),
}

// ── Users ────────────────────────────────────────────────────────────────────
export const users = {
  get: (username) => request(`/users/${username}`),
  myBlogs: (username, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/users/${username}/blogs${qs ? '?' + qs : ''}`)
  },
  followers: (username) => request(`/users/${username}/followers`),
  following: (username) => request(`/users/${username}/following`),
  updateMe: (body) => {
    if (body instanceof FormData) return request('/users/me', { method: 'PATCH', body })
    return request('/users/me', { method: 'PATCH', json: body })
  },
  changePassword: (body) => request('/users/me/password', { method: 'PATCH', json: body }),
  follow: (userId) => request(`/users/${userId}/follow`, { method: 'PUT' }),
  unfollow: (userId) => request(`/users/${userId}/follow`, { method: 'DELETE' }),
}

// ── Social ───────────────────────────────────────────────────────────────────
export const social = {
  bookmarks: () => request('/me/bookmarks'),
  addBookmark: (blogId) => request(`/me/bookmarks/${blogId}`, { method: 'PUT' }),
  removeBookmark: (blogId) => request(`/me/bookmarks/${blogId}`, { method: 'DELETE' }),
  notifications: () => request('/notifications'),
  readNotification: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  readAllNotifications: () => request('/notifications/read-all', { method: 'PATCH' }),
}

// ── Uploads ──────────────────────────────────────────────────────────────────
export const uploads = {
  inline: (file) => {
    const fd = new FormData()
    fd.append('image', file)
    return request('/uploads/inline', { method: 'POST', body: fd })
  },
  avatar: (file) => {
    const fd = new FormData()
    fd.append('avatar', file)
    return request('/uploads/avatar', { method: 'POST', body: fd })
  },
}

// ── Health ───────────────────────────────────────────────────────────────────
export const health = {
  check: () => request('/health'),
}
