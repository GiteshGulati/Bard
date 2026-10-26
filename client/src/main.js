import './styles/main.css';
import 'quill/dist/quill.snow.css';
import { route, matchLocation, navigate, bindLinks, query } from './router.js';
import { renderShell, wireShell, bootSession } from './components/shell.js';
import { state, isAuthed, isAdmin } from './state.js';
import { homePage } from './pages/home.js';
import { explorePage, searchPage, tagPage } from './pages/explore.js';
import { articlePage } from './pages/article.js';
import { profilePage } from './pages/profile.js';
import { loginPage, registerPage, forgotPasswordPage, resetPasswordPage, verifyEmailPage } from './pages/auth.js';
import { dashboardPage, bookmarksPage, feedPage, notificationsPage } from './pages/dashboard.js';
import { writePage } from './pages/write.js';
import { settingsPage, adminPage } from './pages/account.js';

route('/', homePage);
route('/explore', explorePage);
route('/search', () => searchPage(query()));
route('/tag/:tag', tagPage);
route('/article/:slug', articlePage);
route('/u/:username', profilePage);
route('/login', loginPage);
route('/register', registerPage);
route('/forgot-password', forgotPasswordPage);
route('/reset-password', resetPasswordPage);
route('/verify-email', verifyEmailPage);
route('/dashboard', dashboardPage, { auth: true });
route('/write', writePage, { auth: true });
route('/write/:id', writePage, { auth: true });
route('/saved', bookmarksPage, { auth: true });
route('/feed', feedPage, { auth: true });
route('/notifications', notificationsPage, { auth: true });
route('/settings', settingsPage, { auth: true });
route('/admin', adminPage, { auth: true, admin: true });

const app = document.querySelector('#app');
let renderId = 0;
async function render() {
  const current = ++renderId;
  const match = matchLocation();
  if (!match) { app.innerHTML = renderShell('<div class="wrap"><h1>Page not found</h1><a href="/" data-link>Return home</a></div>'); wireShell(app); bindLinks(app); return; }
  if (match.auth && !isAuthed()) { navigate('/login', { replace: true }); return; }
  if (match.admin && !isAdmin()) { navigate('/', { replace: true }); return; }
  app.innerHTML = renderShell('<div class="wrap"><div class="loading" role="status">Loading…</div></div>');
  wireShell(app); bindLinks(app);
  try {
    const page = await match.loader(match.params || {});
    if (current !== renderId) return;
    app.innerHTML = renderShell(page.outerHTML);
    wireShell(app); bindLinks(app);
  } catch (err) {
    if (current !== renderId) return;
    app.innerHTML = renderShell(`<div class="wrap"><div class="error-banner" role="alert">${err.message || 'Something went wrong'}</div></div>`);
    wireShell(app); bindLinks(app);
  }
  window.scrollTo({ top: 0, behavior: 'instant' });
}

window.addEventListener('popstate', render);
window.addEventListener('bard:navigate', render);
window.addEventListener('bard:go', (e) => navigate(e.detail));
bootSession().finally(render);
