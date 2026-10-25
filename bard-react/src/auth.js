// ── Auth helpers (localStorage-based) ─────────────────────────────────────
const USERS_KEY = 'bard-users';
const SESSION_KEY = 'bard-session';

function getUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    email: user.email,
    name: user.firstName + ' ' + user.lastName,
    firstName: user.firstName,
    lastName: user.lastName,
  }));
}
function clearSession() { localStorage.removeItem(SESSION_KEY); }

export const BardAuth = {
  signup(firstName, lastName, email, password) {
    const users = getUsers();
    email = email.toLowerCase().trim();
    if (users.some(u => u.email === email)) return { ok: false, error: 'An account with this email already exists.' };
    const user = { firstName: firstName.trim(), lastName: lastName.trim(), email, password };
    users.push(user);
    saveUsers(users);
    setSession(user);
    return { ok: true };
  },
  login(email, password) {
    const users = getUsers();
    email = email.toLowerCase().trim();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, error: 'Invalid email or password.' };
    setSession(user);
    return { ok: true };
  },
  logout() { clearSession(); },
  getUser() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; }
  },
  isLoggedIn() { return Boolean(BardAuth.getUser()); },
};
