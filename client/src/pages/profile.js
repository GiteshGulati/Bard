import { Reports, Users } from '../api.js';
import { blogCard } from '../components/cards.js';
import { state } from '../state.js';
import { avatar, emptyState, errorBox, escapeHtml, formatDate, spinner, toast } from '../utils.js';

export async function profilePage({ username }) {
  const root = document.createElement('div');
  root.innerHTML = `<div class="wrap">${spinner()}</div>`;
  try {
    const user = await Users.get(username);
    const blogs = await Users.blogs(username, '?limit=12');
    root.innerHTML = `
      <div class="wrap">
        <div class="profile-head">
          ${avatar(user, 84)}
          <div>
            <p class="kicker">Author</p>
            <h1>${escapeHtml(user.displayName)}</h1>
            <p class="meta">@${escapeHtml(user.username)} · Joined ${formatDate(user.createdAt)}</p>
            <p>${escapeHtml(user.bio || 'This writer has not added a biography yet.')}</p>
            ${user.websiteUrl ? `<p><a href="${escapeHtml(user.websiteUrl)}" rel="noopener noreferrer" target="_blank">${escapeHtml(user.websiteUrl)}</a></p>` : ''}
            <div class="stats">
              <div><b>${user.followerCount}</b><span class="meta">Followers</span></div>
              <div><b>${user.followingCount}</b><span class="meta">Following</span></div>
            </div>
          </div>
          <div>
            ${user.isSelf ? `<a class="btn-ghost" href="/settings" data-link>Edit profile</a>` : ''}
            ${!user.isSelf && state.user ? `<button class="btn" id="follow" type="button">${user.isFollowing ? 'Following' : 'Follow'}</button>` : ''}
            ${!user.isSelf && state.user ? `<button class="icon-btn" id="report-user" type="button">Report profile</button>` : ''}
          </div>
        </div>
        <h2>Published</h2>
        <div id="list">${blogs.items?.length ? `<div class="grid">${blogs.items.map(blogCard).join('')}</div>` : emptyState('No published essays', 'Drafts stay in the studio until they are ready.')}</div>
      </div>
    `;
    root.querySelector('#follow')?.addEventListener('click', async (e) => {
      try {
        if (user.isFollowing) await Users.unfollow(user.id);
        else await Users.follow(user.id);
        user.isFollowing = !user.isFollowing;
        e.currentTarget.textContent = user.isFollowing ? 'Following' : 'Follow';
      } catch (err) { toast(err.message); }
    });
    root.querySelector('#report-user')?.addEventListener('click', async () => {
      const reason = prompt('Reason: spam, harassment, misinformation, copyright, or other', 'other');
      if (!reason) return;
      try { await Reports.create({ targetType: 'user', targetId: user.id, reason, explanation: '' }); toast('Report sent'); }
      catch (err) { toast(err.message); }
    });
  } catch (err) {
    root.innerHTML = `<div class="wrap">${errorBox(err)}</div>`;
  }
  return root;
}
