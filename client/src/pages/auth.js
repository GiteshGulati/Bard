import { Auth } from '../api.js';
import { setUser } from '../state.js';
import { escapeHtml, toast } from '../utils.js';
import { navigate } from '../router.js';

function formPage(title, lede, fields, submitLabel, extra) {
  const root = document.createElement('div');
  root.innerHTML = `
    <div class="wrap-narrow">
      <p class="kicker">Account</p>
      <h1>${title}</h1>
      <p class="lede">${lede}</p>
      <form class="auth-card" novalidate>
        <div class="form-error" hidden></div>
        ${fields}
        <div class="row" style="margin-top:1.4rem">
          <button class="btn" type="submit">${submitLabel}</button>
        </div>
      </form>
      <p class="meta" style="margin-top:1rem">${extra}</p>
    </div>
  `;
  return root;
}

export async function loginPage() {
  const root = formPage(
    'Welcome back',
    'Sign in with your username or email.',
    `<label for="identifier">Username or email</label><input class="field" id="identifier" name="identifier" required>
     <label for="password">Password</label><input class="field" id="password" name="password" type="password" required>`,
    'Sign in',
    `<a href="/forgot-password" data-link>Forgot your password?</a> · New here? <a href="/register" data-link>Create an account</a>`,
  );
  const form = root.querySelector('form');
  const err = root.querySelector('.form-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const fd = Object.fromEntries(new FormData(form));
    try {
      const data = await Auth.login(fd);
      setUser(data.user);
      toast('Signed in');
      navigate('/');
    } catch (ex) {
      err.hidden = false;
      err.textContent = ex.message;
    }
  });
  return root;
}

export async function registerPage() {
  const root = formPage(
    'Take a desk',
    'Usernames are public. You can publish under a different display name. Verify your email to unlock writing and community features.',
    `<label for="username">Username</label><input class="field" id="username" name="username" required minlength="3" maxlength="20">
     <label for="email">Email</label><input class="field" id="email" name="email" type="email" required>
     <label for="displayName">Display name</label><input class="field" id="displayName" name="displayName" maxlength="60">
     <label for="password">Password</label><input class="field" id="password" name="password" type="password" required minlength="8">
     <p class="meta">At least 8 characters, with a letter and a number.</p>`,
    'Create account',
    `Already writing here? <a href="/login" data-link>Sign in</a>`,
  );
  const form = root.querySelector('form');
  const err = root.querySelector('.form-error');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const fd = Object.fromEntries(new FormData(form));
    try {
      const data = await Auth.register(fd);
      setUser(data.user);
      toast(data.verificationEmailSent ? 'Account created. Check your email to verify your address.' : 'Account created. Email delivery is unavailable; try sending a verification link again from Settings.');
      navigate('/settings');
    } catch (ex) {
      err.hidden = false;
      err.textContent = ex.message;
    }
  });
  return root;
}

export async function forgotPasswordPage() {
  const root = formPage('Reset your password', 'Enter your email and, if it belongs to an account, we will send a secure reset link.',
    '<label for="email">Email</label><input class="field" id="email" name="email" type="email" required>', 'Send reset link',
    'Remembered it? <a href="/login" data-link>Sign in</a>');
  const form = root.querySelector('form'); const error = root.querySelector('.form-error');
  form.addEventListener('submit', async (e) => { e.preventDefault(); error.hidden = true;
    try { const data = await Auth.forgotPassword(new FormData(form).get('email')); error.hidden = false; error.setAttribute('role', 'status'); error.textContent = data.message; }
    catch (err) { error.hidden = false; error.textContent = err.message; }
  });
  return root;
}

export async function resetPasswordPage() {
  const token = new URLSearchParams(location.search).get('token') || '';
  const root = formPage('Choose a new password', 'Reset links expire after one hour and can be used once.',
    '<label for="password">New password</label><input class="field" id="password" name="password" type="password" autocomplete="new-password" minlength="8" required>', 'Reset password',
    '<a href="/login" data-link>Return to sign in</a>');
  const form = root.querySelector('form'); const error = root.querySelector('.form-error');
  form.addEventListener('submit', async (e) => { e.preventDefault(); error.hidden = true;
    try { const password = new FormData(form).get('password'); const data = await Auth.resetPassword(token, password); error.hidden = false; error.setAttribute('role', 'status'); error.textContent = data.message; form.querySelector('button').disabled = true; }
    catch (err) { error.hidden = false; error.textContent = err.message; }
  });
  return root;
}

export async function verifyEmailPage() {
  const root = document.createElement('div'); root.innerHTML = '<div class="wrap-narrow"><p class="kicker">Account</p><h1>Email verification</h1><p class="lede" role="status">Checking your verification link…</p></div>';
  const status = root.querySelector('[role="status"]'); const token = new URLSearchParams(location.search).get('token');
  try { if (!token) throw new Error('This verification link is invalid or has expired.'); await Auth.verifyEmail(token); const me = await Auth.me(); if (me?.user) setUser(me.user); status.textContent = 'Your email is verified. You can now write and join the community.'; }
  catch (err) { status.textContent = err.message; }
  return root;
}
