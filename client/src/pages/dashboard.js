import { Blogs, Social } from '../api.js';
import { blogCard } from '../components/cards.js';
import { emptyState, errorBox, escapeHtml, formatDate, spinner, toast } from '../utils.js';
import { navigate } from '../router.js';

export async function dashboardPage() {
  const root = document.createElement('div');
  root.innerHTML = `<div class="wrap">${spinner()}</div>`;
  try {
    const data = await Blogs.mine('limit=30');
    root.innerHTML = `
      <div class="wrap">
        <div class="toolbar">
          <div>
            <p class="kicker">Studio</p>
            <h1>Your drafts and published work</h1>
          </div>
          <a class="btn" href="/write" data-link>New essay</a>
        </div>
        ${data.items?.length ? data.items.map((b) => `
          <div class="list-row">
            <div>
              <a href="${b.status === 'published' ? `/article/${escapeHtml(b.slug)}` : `/write/${b.id}`}" data-link><strong>${escapeHtml(b.title)}</strong></a>
              <p class="meta">${escapeHtml(b.status)} · updated ${formatDate(b.updatedAt)}</p>
            </div>
            <div class="row">
              <a class="btn-ghost" href="/write/${b.id}" data-link>Edit</a>
              <button class="btn-danger" data-del="${b.id}" type="button">Delete</button>
            </div>
          </div>
        `).join('') : emptyState('The desk is clear', 'Start an essay. Autosave will keep the draft.')}
      </div>
    `;
    root.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this article? This cannot be undone.')) return;
        try {
          await Blogs.remove(btn.dataset.del);
          toast('Deleted');
          navigate('/dashboard', { replace: true });
        } catch (err) { toast(err.message); }
      });
    });
  } catch (err) {
    root.innerHTML = `<div class="wrap">${errorBox(err)}</div>`;
  }
  return root;
}

export async function bookmarksPage() {
  const root = document.createElement('div');
  root.innerHTML = `<div class="wrap"><p class="kicker">Private</p><h1>Saved essays</h1><div id="list">${spinner()}</div></div>`;
  try {
    const data = await Social.bookmarks('?limit=24');
    root.querySelector('#list').innerHTML = data.items?.length
      ? `<div class="grid">${data.items.map(blogCard).join('')}</div>`
      : emptyState('Your shelf is empty', 'Bookmark an essay while reading to keep it here. This list is only visible to you.');
  } catch (err) {
    root.querySelector('#list').innerHTML = errorBox(err);
  }
  return root;
}

export async function feedPage() {
  const root = document.createElement('div');
  root.innerHTML = `<div class="wrap"><p class="kicker">Following</p><h1>From writers you follow</h1><div id="list">${spinner()}</div><button class="btn-ghost more" hidden type="button">Load more</button></div>`;
  let cursor = null;
  const list = root.querySelector('#list');
  const more = root.querySelector('.more');
  async function load(reset) {
    try {
      const data = await Social.feed(`?limit=12${cursor && !reset ? `&cursor=${cursor}` : ''}`);
      if (!data.items?.length && reset) {
        list.innerHTML = emptyState('The corridor is empty', 'Follow a writer from their profile to fill this feed.');
      } else {
        const html = data.items.map(blogCard).join('');
        if (!reset && list.querySelector('.grid')) list.querySelector('.grid').insertAdjacentHTML('beforeend', html);
        else list.innerHTML = `<div class="grid">${html}</div>`;
      }
      cursor = data.nextCursor;
      more.hidden = !cursor;
    } catch (err) { list.innerHTML = errorBox(err); }
  }
  more.addEventListener('click', () => load(false));
  await load(true);
  return root;
}

export async function notificationsPage() {
  const root = document.createElement('div');
  root.innerHTML = `<div class="wrap"><div class="toolbar"><div><p class="kicker">Inbox</p><h1>Notifications</h1></div><button class="btn-ghost" id="all" type="button">Mark all read</button></div><div id="list">${spinner()}</div></div>`;
  async function load() {
    try {
      const data = await Social.notifications('?limit=40');
      const list = root.querySelector('#list');
      if (!data.items?.length) {
        list.innerHTML = emptyState('All quiet', 'Likes, comments, replies, and new followers will land here.');
        return;
      }
      list.innerHTML = data.items.map((n) => `
        <div class="list-row note ${n.readAt ? '' : 'unread'}" data-id="${n.id}">
          <div>
            <strong>${escapeHtml(n.actor?.displayName || 'Someone')}</strong>
            <span class="meta"> ${label(n)}</span>
            ${n.blog ? `<div><a href="/article/${escapeHtml(n.blog.slug)}" data-link>${escapeHtml(n.blog.title)}</a></div>` : ''}
          </div>
          ${n.readAt ? '' : '<button class="icon-btn" data-read type="button">Mark read</button>'}
        </div>
      `).join('');
    } catch (err) {
      root.querySelector('#list').innerHTML = errorBox(err);
    }
  }
  root.querySelector('#all').addEventListener('click', async () => {
    await Social.readAll();
    await load();
  });
  root.querySelector('#list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-read]');
    if (!btn) return;
    await Social.readOne(btn.closest('[data-id]').dataset.id);
    await load();
  });
  await load();
  return root;
}

function label(n) {
  if (n.type === 'follow') return 'followed you';
  if (n.type === 'like') return 'liked your essay';
  if (n.type === 'comment') return 'commented';
  if (n.type === 'reply') return 'replied';
  return n.type;
}
