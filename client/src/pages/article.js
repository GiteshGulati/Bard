import { Blogs, Comments, Reports, Social } from '../api.js';
import { blogCard } from '../components/cards.js';
import { state } from '../state.js';
import { avatar, emptyState, errorBox, escapeHtml, formatDate, spinner, toast } from '../utils.js';

export async function articlePage({ slug }) {
  const root = document.createElement('div');
  root.innerHTML = `<div class="reading">${spinner()}</div>`;
  try {
    const { blog } = await Blogs.bySlug(slug);
    const related = await Blogs.related(blog.id).catch(() => ({ items: [] }));
    const comments = await Blogs.comments(blog.id);
    root.innerHTML = `
      <article class="reading">
        <p class="kicker">${formatDate(blog.publishedAt)} · ${blog.readingTimeMinutes} min read</p>
        <h1 class="display" style="font-size:clamp(2rem,5vw,3.4rem)">${escapeHtml(blog.title)}</h1>
        <p class="lede">${escapeHtml(blog.excerpt || '')}</p>
        <div class="row" style="margin:1rem 0 0">
          ${avatar(blog.author, 40)}
          <a href="/u/${escapeHtml(blog.author.username)}" data-link><strong>${escapeHtml(blog.author.displayName)}</strong></a>
        </div>
        <div class="tags" style="margin-top:1rem">${(blog.tags || []).map((t) => `<a class="tag" href="/tag/${escapeHtml(t)}" data-link>${escapeHtml(t)}</a>`).join('')}</div>
        ${blog.coverImageUrl ? `<img class="article-cover" src="${escapeHtml(blog.coverImageUrl)}" alt="" width="960" height="480">` : ''}
        <div class="article-body">${blog.html || ''}</div>
        <div class="row" style="margin-top:2rem;border-top:1px solid var(--line);padding-top:1rem">
          <button class="icon-btn ${blog.liked ? 'on' : ''}" data-like type="button" ${state.user ? '' : 'disabled'}>♥ ${blog.likeCount}</button>
          <button class="icon-btn ${blog.bookmarked ? 'on' : ''}" data-save type="button" ${state.user ? '' : 'disabled'}>Bookmark</button>
          ${state.user ? `<button class="icon-btn" data-report type="button">Report</button>` : ''}
          ${state.user && (state.user.id === blog.author.id || state.user.role === 'admin') ? `<a class="btn-ghost" href="/write/${blog.id}" data-link>Edit</a>` : ''}
        </div>
        <section style="margin-top:3rem">
          <h2>Comments</h2>
          ${state.user && blog.commentsEnabled ? `
            <form id="cform">
              <label for="cbody">Add a comment</label>
              <textarea class="field" id="cbody" name="body" maxlength="2000" required></textarea>
              <input type="hidden" name="parentId" id="parentId">
              <button class="btn" type="submit">Publish comment</button>
            </form>` : `<p class="meta">${blog.commentsEnabled ? 'Sign in to join the conversation.' : 'Comments are closed.'}</p>`}
          <div id="comments">${renderComments(comments.items || [], blog)}</div>
        </section>
        <section class="ov-recent" style="margin-top:3rem">
          <h2>Related</h2>
          ${(related.items || []).length ? `<div class="grid">${related.items.map(blogCard).join('')}</div>` : emptyState('No nearby essays yet', 'Related pieces appear when they share a tag.')}
        </section>
      </article>
    `;

    const likeBtn = root.querySelector('[data-like]');
    likeBtn?.addEventListener('click', async () => {
      try {
        const res = blog.liked ? await Blogs.unlike(blog.id) : await Blogs.like(blog.id);
        blog.liked = res.liked;
        blog.likeCount = res.likeCount;
        likeBtn.classList.toggle('on', blog.liked);
        likeBtn.textContent = `♥ ${blog.likeCount}`;
      } catch (err) { toast(err.message); }
    });
    root.querySelector('[data-save]')?.addEventListener('click', async (e) => {
      try {
        if (blog.bookmarked) await Social.unbookmark(blog.id);
        else await Social.bookmark(blog.id);
        blog.bookmarked = !blog.bookmarked;
        e.currentTarget.classList.toggle('on', blog.bookmarked);
        e.currentTarget.textContent = blog.bookmarked ? 'Saved' : 'Bookmark';
        toast(blog.bookmarked ? 'Saved to your shelf' : 'Removed from saved');
      } catch (err) { toast(err.message); }
    });
    root.querySelector('[data-report]')?.addEventListener('click', async () => {
      const reason = prompt('Reason: spam, harassment, misinformation, copyright, or other', 'other');
      if (!reason) return;
      try {
        await Reports.create({ targetType: 'article', targetId: blog.id, reason, explanation: '' });
        toast('Report sent');
      } catch (err) { toast(err.message); }
    });
    root.querySelector('#cform')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = Object.fromEntries(new FormData(e.currentTarget));
      try {
        await Blogs.addComment(blog.id, { body: fd.body, parentId: fd.parentId || undefined });
        toast('Comment published');
        const fresh = await Blogs.comments(blog.id);
        root.querySelector('#comments').innerHTML = renderComments(fresh.items || [], blog);
        e.currentTarget.reset();
      } catch (err) { toast(err.message); }
    });
    root.querySelector('#comments')?.addEventListener('click', async (e) => {
      const reply = e.target.closest('[data-reply]');
      const del = e.target.closest('[data-del]');
      const edit = e.target.closest('[data-edit]');
      const report = e.target.closest('[data-report-comment]');
      if (reply) {
        root.querySelector('#parentId').value = reply.dataset.reply;
        root.querySelector('#cbody')?.focus();
      }
      if (del) {
        try { await Comments.remove(del.dataset.del); del.closest('.comment').querySelector('.c-body').textContent = 'Removed.'; toast('Comment removed'); }
        catch (err) { toast(err.message); }
      }
      if (edit) {
        const next = prompt('Edit comment', edit.closest('.comment').querySelector('.c-body').textContent);
        if (!next) return;
        try {
          const res = await Comments.update(edit.dataset.edit, { body: next });
          edit.closest('.comment').querySelector('.c-body').textContent = res.comment.body;
        } catch (err) { toast(err.message); }
      }
      if (report) {
        const reason = prompt('Reason: spam, harassment, misinformation, copyright, or other', 'other');
        if (!reason) return;
        try { await Reports.create({ targetType: 'comment', targetId: report.dataset.reportComment, reason, explanation: '' }); toast('Report sent'); }
        catch (err) { toast(err.message); }
      }
    });
  } catch (err) {
    root.innerHTML = `<div class="wrap">${errorBox(err)}</div>`;
  }
  return root;
}

function renderComments(items, blog) {
  if (!items.length) return emptyState('No comments yet', 'The first note sets the tone.');
  const byParent = new Map();
  items.forEach((c) => {
    const key = c.parentId || 'root';
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(c);
  });
  const paint = (id, depth) => (byParent.get(id) || []).map((c) => {
    const mine = state.user && (state.user.id === c.author.id || state.user.role === 'admin');
    return `
      <div class="comment ${depth ? 'reply' : ''}">
        ${avatar(c.author, 34)}
        <div>
          <div class="row"><strong>${escapeHtml(c.author.displayName)}</strong><span class="meta">${formatDate(c.createdAt)}</span></div>
          <p class="c-body">${c.status === 'deleted' ? '<em>Removed.</em>' : escapeHtml(c.body)}</p>
          ${c.status !== 'deleted' && state.user ? `
            <div class="row">
              ${blog.commentsEnabled ? `<button class="icon-btn" data-reply="${c.id}" type="button">Reply</button>` : ''}
              ${mine ? `<button class="icon-btn" data-edit="${c.id}" type="button">Edit</button>` : ''}
              ${mine ? `<button class="icon-btn" data-del="${c.id}" type="button">Delete</button>` : ''}
              ${state.user && state.user.id !== c.author.id ? `<button class="icon-btn" data-report-comment="${c.id}" type="button">Report</button>` : ''}
            </div>` : ''}
          ${paint(c.id, depth + 1)}
        </div>
      </div>`;
  }).join('');
  return paint('root', 0);
}
