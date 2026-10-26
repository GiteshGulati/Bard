import { Auth, Social } from '../api.js';
import { isAdmin, isAuthed, setTheme, setUser, state } from '../state.js';
import { escapeHtml } from '../utils.js';

export function renderShell(inner) {
  const user = state.user;
  return `
    <header class="masthead">
      <a class="brand" href="/" data-link>Bard<span>A place for words, not clout</span></a>
      <nav class="nav" aria-label="Primary">
        <a href="/explore" data-link>Explore</a>
        ${user ? `<a href="/feed" data-link>Following</a>` : ''}
        <form class="search-form" action="/search" method="get">
          <label class="sr-only" for="q">Search</label>
          <input id="q" name="q" type="search" placeholder="Search essays" />
        </form>
        ${user ? `
          <a href="/notifications" data-link aria-label="Notifications">Alerts${state.unread ? ` (${state.unread})` : ''}</a>
          <a href="/write" data-link>Write</a>
          <a href="/dashboard" data-link>Studio</a>
          <a href="/saved" data-link>Saved</a>
          <a href="/settings" data-link>Settings</a>
          ${isAdmin() ? `<a href="/admin" data-link>Moderation</a>` : ''}
          <a href="/u/${escapeHtml(user.username)}" data-link>@${escapeHtml(user.username)}</a>
        ` : `
          <a href="/login" data-link>Sign in</a>
          <a href="/register" data-link>Join</a>
        `}
        <button type="button" class="linkish" data-theme>${state.theme === 'ink' ? 'Paper' : 'Lamp off'}</button>
      </nav>
    </header>
    <main id="main">${inner}</main>
    <footer class="site-foot">Bard keeps the metrics in the back room.</footer>
  `;
}

export function wireShell(root) {
  root.querySelector('[data-theme]')?.addEventListener('click', () => {
    setTheme(state.theme === 'ink' ? 'paper' : 'ink');
    window.dispatchEvent(new Event('bard:navigate'));
  });
  root.querySelector('.search-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q');
    window.dispatchEvent(new CustomEvent('bard:go', { detail: `/search?q=${encodeURIComponent(q)}` }));
  });
}

export async function bootSession() {
  const me = await Auth.me();
  setUser(me?.user || null);
  if (isAuthed()) {
    try {
      const notes = await Social.notifications('?limit=1');
      state.unread = notes.unreadCount || 0;
    } catch {
      state.unread = 0;
    }
  }
}
