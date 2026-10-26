const routes = [];

export function route(path, loader, { auth = false, admin = false } = {}) {
  routes.push({ path, loader, auth, admin });
}

function compile(path) {
  const keys = [];
  const pattern = path.replace(/:([^/]+)/g, (_, key) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { keys, re: new RegExp(`^${pattern}$`) };
}

const compiled = () => routes.map((r) => ({ ...r, ...compile(r.path) }));

export function navigate(href, { replace = false } = {}) {
  const url = href.startsWith('http') ? new URL(href) : new URL(href, window.location.origin);
  const before = new CustomEvent('bard:before-navigate', { cancelable: true, detail: url.pathname + url.search });
  window.dispatchEvent(before);
  if (before.defaultPrevented) return;
  if (replace) history.replaceState({}, '', url.pathname + url.search);
  else history.pushState({}, '', url.pathname + url.search);
  window.dispatchEvent(new Event('bard:navigate'));
}

export function query() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

export function matchLocation() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  for (const r of compiled()) {
    const m = path.match(r.re);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
      return { ...r, params };
    }
  }
  return null;
}

export function bindLinks(root) {
  root.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-link]');
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    e.preventDefault();
    navigate(a.getAttribute('href'));
  });
}
