import { Admin, Auth, Users } from '../api.js';
import { state, setUser } from '../state.js';
import { escapeHtml, errorBox, formatDate, spinner, toast } from '../utils.js';
import { navigate } from '../router.js';

export async function settingsPage() {
  const root = document.createElement('div');
  const user = state.user;
  root.innerHTML = `<div class="wrap-narrow"><p class="kicker">Your account</p><h1>Settings</h1>
    ${user.emailVerified ? '' : `<section class="auth-card" aria-labelledby="verify-heading"><h2 id="verify-heading">Verify your email</h2><p>Writing and community actions are locked until your address is verified.</p><button class="btn-ghost" id="resend-verification" type="button">Send a fresh verification link</button><p id="verify-status" role="status" aria-live="polite"></p></section>`}
    <form id="profile-form" class="auth-card"><h2>Public profile</h2><label for="displayName">Display name</label><input class="field" id="displayName" name="displayName" maxlength="60" value="${escapeHtml(user.displayName)}" required>
    <label for="bio">Biography</label><textarea class="field" id="bio" name="bio" maxlength="280" rows="3">${escapeHtml(user.bio || '')}</textarea>
    <label for="websiteUrl">Website</label><input class="field" id="websiteUrl" name="websiteUrl" type="url" placeholder="https://example.com" value="${escapeHtml(user.websiteUrl || '')}">
    <label for="avatar">Profile picture</label><input class="field" id="avatar" name="avatar" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
    <button class="btn" type="submit">Save profile</button><div class="form-error" hidden></div></form>
    <form id="password-form" class="auth-card"><h2>Change password</h2><label for="currentPassword">Current password</label><input class="field" id="currentPassword" name="currentPassword" type="password" autocomplete="current-password" required>
    <label for="newPassword">New password</label><input class="field" id="newPassword" name="newPassword" type="password" autocomplete="new-password" minlength="8" required><button class="btn" type="submit">Update password</button><div class="form-error" hidden></div></form>
    <button class="btn-ghost" id="logout" type="button">Sign out</button></div>`;
  root.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const form = e.currentTarget; const error = form.querySelector('.form-error'); error.hidden = true;
    try { const data = await Users.updateMe(new FormData(form)); setUser(data.user); toast('Profile saved'); }
    catch (err) { error.textContent = err.message; error.hidden = false; }
  });
  root.querySelector('#resend-verification')?.addEventListener('click', async (e) => {
    const button = e.currentTarget; button.disabled = true;
    try { const result = await Auth.resendVerification(user.email); root.querySelector('#verify-status').textContent = result.message; }
    catch (err) { root.querySelector('#verify-status').textContent = err.message; }
    finally { button.disabled = false; }
  });
  root.querySelector('#password-form').addEventListener('submit', async (e) => {
    e.preventDefault(); const form = e.currentTarget; const error = form.querySelector('.form-error'); error.hidden = true;
    try { await Users.changePassword(Object.fromEntries(new FormData(form))); form.reset(); toast('Password updated'); }
    catch (err) { error.textContent = err.message; error.hidden = false; }
  });
  root.querySelector('#logout').addEventListener('click', async () => { await Auth.logout(); setUser(null); navigate('/'); });
  return root;
}

export async function adminPage() {
  const root = document.createElement('div');
  root.innerHTML = `<div class="wrap"><p class="kicker">Administration</p><h1>Report queue</h1><div id="reports">${spinner()}</div></div>`;
  const target = root.querySelector('#reports');
  async function load() {
    try {
      const { items = [] } = await Admin.reports('?limit=40&status=open');
      target.innerHTML = items.length ? items.map((r) => `<article class="report-row" data-id="${escapeHtml(r.id)}">
        <div><p class="meta">${escapeHtml(r.targetType)} · ${escapeHtml(r.reason)} · ${formatDate(r.createdAt)}</p><p>${escapeHtml(r.explanation || 'No additional details.')}</p>
        <p class="meta">Reported by @${escapeHtml(r.reporter?.username || 'unknown')} · target ${escapeHtml(r.targetId)}</p></div>
        <div class="row"><button class="btn-ghost" data-action="dismiss" type="button">Dismiss</button><button class="btn-danger" data-action="hide" type="button">Hide content & resolve</button></div>
      </article>`).join('') : '<div class="empty"><h2>Queue clear</h2><p>New reports will appear here.</p></div>';
    } catch (err) { target.innerHTML = errorBox(err); }
  }
  target.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]'); if (!btn) return;
    const row = btn.closest('[data-id]');
    try { await Admin.review(row.dataset.id, { status: btn.dataset.action === 'hide' ? 'resolved' : 'dismissed', hideTarget: btn.dataset.action === 'hide' }); toast('Report reviewed'); await load(); }
    catch (err) { toast(err.message); }
  });
  await load();
  return root;
}
