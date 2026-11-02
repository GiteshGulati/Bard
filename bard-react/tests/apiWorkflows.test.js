import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { auth, blogs, comments, users, social, moderation, uploads, clearCsrf } from '../src/api.js'

describe('frontend API workflows', () => {
  it('sends auth, publishing, comment, social, profile, upload, notification and moderation requests', async () => {
    const originalFetch = globalThis.fetch
    const calls = []
    clearCsrf()
    globalThis.fetch = async (url, options = {}) => {
      calls.push({ url: String(url), options, headers: new Headers(options.headers) })
      if (String(url).endsWith('/csrf-token')) return Response.json({ data: { csrfToken: 'workflow-token' } })
      return Response.json({ success: true, data: { ok: true } })
    }
    try {
      await auth.register({ username: 'writer' })
      await auth.login({ identifier: 'writer', password: 'Secret123' })
      await blogs.create({ title: 'An API story' })
      await comments.create('story-1', { body: 'A reply', parentId: 'comment-1' })
      await blogs.like('story-1')
      await social.addBookmark('story-1')
      await users.updateMe({ displayName: 'Writer' })
      const image = new File(['image'], 'avatar.png', { type: 'image/png' })
      await uploads.avatar(image)
      await social.notifications({ limit: 10 })
      await moderation.review('report-1', { status: 'resolved' })

      const requests = calls.filter(call => !call.url.endsWith('/csrf-token'))
      assert.deepEqual(requests.map(call => [call.options.method, new URL(call.url, 'http://bard.test').pathname]), [
        ['POST', '/api/v1/auth/register'], ['POST', '/api/v1/auth/login'], ['POST', '/api/v1/blogs'],
        ['POST', '/api/v1/blogs/story-1/comments'], ['PUT', '/api/v1/blogs/story-1/like'],
        ['PUT', '/api/v1/me/bookmarks/story-1'], ['PATCH', '/api/v1/users/me'],
        ['POST', '/api/v1/uploads/avatar'], ['GET', '/api/v1/notifications'], ['PATCH', '/api/v1/admin/reports/report-1'],
      ])
      for (const call of requests) assert.equal(call.options.credentials, 'include')
      const reply = requests[3]
      assert.deepEqual(JSON.parse(reply.options.body), { body: 'A reply', parentId: 'comment-1' })
      const upload = requests[7]
      assert.ok(upload.options.body instanceof FormData)
      assert.equal(upload.options.body.get('avatar').name, 'avatar.png')
      assert.equal(upload.headers.get('content-type'), null)
      for (const call of requests.filter(value => ['POST', 'PUT', 'PATCH'].includes(value.options.method))) {
        assert.equal(call.headers.get('x-csrf-token'), 'workflow-token')
      }
    } finally {
      globalThis.fetch = originalFetch
      clearCsrf()
    }
  })

  it('preserves structured login errors for the login screen to handle', async () => {
    const originalFetch = globalThis.fetch
    clearCsrf()
    globalThis.fetch = async (url) => String(url).endsWith('/csrf-token')
      ? Response.json({ data: { csrfToken: 'login-token' } })
      : Response.json({ success: false, error: { code: 'EMAIL_NOT_VERIFIED', message: 'Verify your email.' } }, { status: 403 })
    try {
      await assert.rejects(auth.login({ identifier: 'writer', password: 'Secret123' }), error => {
        assert.equal(error.status, 403)
        assert.equal(error.data.error.code, 'EMAIL_NOT_VERIFIED')
        return true
      })
    } finally {
      globalThis.fetch = originalFetch
      clearCsrf()
    }
  })
})
