import { after, it } from 'node:test';
import assert from 'node:assert/strict';

const originalFetch = globalThis.fetch;
const calls = [];
let csrfCalls = 0;
let profileUploadCalls = 0;

globalThis.fetch = async (url, options = {}) => {
  const headers = new Headers(options.headers);
  calls.push({ url: String(url), options, headers });

  if (String(url).endsWith('/csrf-token')) {
    csrfCalls += 1;
    const csrfToken = csrfCalls === 1 ? 'token-from-old-session' : 'token-from-current-session';
    return Response.json({ success: true, data: { csrfToken } });
  }

  if (String(url).endsWith('/users/me/password')) {
    return Response.json({ success: true, data: { ok: true } });
  }

  if (String(url).endsWith('/users/me') && options.method === 'PATCH') {
    profileUploadCalls += 1;
    if (profileUploadCalls === 1) {
      return Response.json({ success: false, error: { code: 'CSRF', message: 'Invalid CSRF token' } }, { status: 403 });
    }
    return Response.json({ success: true, data: { user: { id: 'test-user' } } });
  }

  throw new Error(`Unexpected request: ${url}`);
};

after(() => {
  globalThis.fetch = originalFetch;
});

it('refreshes a stale CSRF token once and retries the FormData upload with credentials', async () => {
  const { users } = await import('../src/api.js');
  await users.changePassword({ currentPassword: 'old', newPassword: 'new' });

  const imageForm = new FormData();
  imageForm.append('avatar', new Blob(['image-bytes'], { type: 'image/png' }), 'avatar.png');
  const result = await users.updateMe(imageForm);

  assert.equal(result.data.user.id, 'test-user');
  const refresh = calls.find((call) => call.url.endsWith('/csrf-token') && call.options.credentials === 'include');
  assert.ok(refresh);
  assert.equal(csrfCalls, 2);

  const uploadCalls = calls.filter((call) => call.url.endsWith('/users/me') && call.options.method === 'PATCH');
  assert.equal(uploadCalls.length, 2);
  assert.equal(uploadCalls[0].headers.get('x-csrf-token'), 'token-from-old-session');
  assert.equal(uploadCalls[1].headers.get('x-csrf-token'), 'token-from-current-session');
  for (const call of uploadCalls) {
    assert.equal(call.options.credentials, 'include');
    assert.equal(call.options.body, imageForm);
    assert.equal(call.headers.has('content-type'), false);
  }
});
