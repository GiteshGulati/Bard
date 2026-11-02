import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'

let vite
let sendBookmarkChange
let sendLikeChange

before(async () => {
  vite = await createServer({ configFile: './vite.config.js', server: { middlewareMode: true }, appType: 'custom' })
  ;({ sendBookmarkChange, sendLikeChange } = await vite.ssrLoadModule('/src/components/useBlogCardActions.js'))
})

after(async () => { await vite?.close() })

const post = { id: 'story-1', liked: false, bookmarked: false, likeCount: 2 }

describe('BlogCard interactions', () => {
  it('sends like and unlike requests and notifies the parent with the server result', async () => {
    const calls = []
    const updates = []
    const api = {
      like: async id => { calls.push(['like', id]); return { data: { liked: true, likeCount: 3 } } },
      unlike: async id => { calls.push(['unlike', id]); return { data: { liked: false, likeCount: 2 } } },
    }
    assert.deepEqual(await sendLikeChange(post, false, update => updates.push(update), api), { liked: true, likeCount: 3 })
    assert.deepEqual(await sendLikeChange({ ...post, liked: true }, true, update => updates.push(update), api), { liked: false, likeCount: 2 })
    assert.deepEqual(calls, [['like', 'story-1'], ['unlike', 'story-1']])
    assert.deepEqual(updates.map(update => [update.liked, update.likeCount]), [[true, 3], [false, 2]])
  })

  it('adds and removes bookmarks and reports failures to the caller', async () => {
    const calls = []
    const updates = []
    const api = {
      addBookmark: async id => { calls.push(['add', id]) },
      removeBookmark: async id => { calls.push(['remove', id]) },
    }
    assert.equal(await sendBookmarkChange(post, false, update => updates.push(update), api), true)
    assert.equal(await sendBookmarkChange({ ...post, bookmarked: true }, true, update => updates.push(update), api), false)
    await assert.rejects(sendBookmarkChange(post, false, () => {}, { addBookmark: async () => { throw new Error('offline') } }), /offline/)
    assert.deepEqual(calls, [['add', 'story-1'], ['remove', 'story-1']])
    assert.deepEqual(updates.map(update => update.bookmarked), [true, false])
  })
})
