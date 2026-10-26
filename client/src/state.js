export const state = {
  user: null,
  unread: 0,
  theme: localStorage.getItem('bard-theme') || 'paper',
};

export function setUser(user) {
  state.user = user;
}

export function setTheme(theme) {
  state.theme = theme;
  localStorage.setItem('bard-theme', theme);
  document.documentElement.dataset.theme = theme;
}

export function isAuthed() {
  return Boolean(state.user);
}

export function isAdmin() {
  return state.user?.role === 'admin';
}
