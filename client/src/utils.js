export function $(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

export function initials(name) {
  return String(name || '?').slice(0, 1).toUpperCase();
}

export function avatar(user, size = 36) {
  if (user?.avatarUrl) {
    return `<img class="avatar" src="${escapeHtml(user.avatarUrl)}" alt="" width="${size}" height="${size}">`;
  }
  return `<span class="avatar avatar-fallback" style="width:${size}px;height:${size}px">${escapeHtml(initials(user?.displayName || user?.username))}</span>`;
}

export function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function debounce(fn, wait) {
  let t;
  let gen = 0;
  const wrapped = (...args) => {
    const my = ++gen;
    clearTimeout(t);
    t = setTimeout(() => {
      if (my === gen) fn(...args);
    }, wait);
  };
  wrapped.flush = () => {
    clearTimeout(t);
    gen += 1;
  };
  wrapped.generation = () => gen;
  return wrapped;
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

export function emptyState(title, body) {
  return `<div class="empty"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(body)}</p></div>`;
}

export function spinner() {
  return `<div class="loading" role="status">Loading…</div>`;
}

export function errorBox(err) {
  return `<div class="error-banner" role="alert">${escapeHtml(err.message || 'Something went wrong')}</div>`;
}
