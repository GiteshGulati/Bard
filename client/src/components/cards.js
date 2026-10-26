import { avatar, escapeHtml, formatDate } from '../utils.js';

export function blogCard(blog) {
  return `
    <a class="card" href="/article/${escapeHtml(blog.slug)}" data-link>
      <div class="card-cover">
        ${blog.coverImageUrl ? `<img src="${escapeHtml(blog.coverImageUrl)}" alt="" width="640" height="360">` : ''}
      </div>
      <div class="card-body">
        <div class="tags">${(blog.tags || []).map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
        <h3>${escapeHtml(blog.title)}</h3>
        <p class="meta">${escapeHtml(blog.excerpt || '')}</p>
        <p class="meta">${escapeHtml(blog.author?.displayName || '')} · ${formatDate(blog.publishedAt || blog.createdAt)} · ${blog.readingTimeMinutes} min</p>
      </div>
    </a>
  `;
}

export function authorChip(user) {
  return `
    <a href="/u/${escapeHtml(user.username)}" data-link class="row" style="text-decoration:none;gap:.7rem">
      ${avatar(user, 40)}
      <span><strong>${escapeHtml(user.displayName)}</strong><br><span class="meta">@${escapeHtml(user.username)}</span></span>
    </a>
  `;
}
