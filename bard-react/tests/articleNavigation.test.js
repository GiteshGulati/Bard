import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let BlogCard
let articlePath
let AuthContext

before(async () => {
  vite = await createServer({ configFile: './vite.config.js', server: { middlewareMode: true }, appType: 'custom' })
  ;({ default: BlogCard, articlePath } = await vite.ssrLoadModule('/src/components/BlogCard.jsx'))
  ;({ AuthContext } = await vite.ssrLoadModule('/src/context/AuthContext.jsx'))
})

after(async () => { await vite?.close() })

const createdStory = {
  id: '66a000000000000000000123',
  slug: 'a-story-created-by-a-reader',
  status: 'published',
  title: 'A story created by a reader',
  author: { id: '66a000000000000000000124', username: 'reader', displayName: 'Reader' },
  excerpt: 'A real API story.',
  tags: ['journaling'],
  likeCount: 0,
  commentCount: 0,
  readingTimeMinutes: 1,
}

function renderCard(path) {
  return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [path] },
    React.createElement(AuthContext.Provider, { value: { user: null } },
      React.createElement(BlogCard, { post: createdStory }))))
}

describe('article navigation', () => {
  it('renders the database slug as a card and title destination from the main feed', () => {
    const html = renderCard('/')
    assert.match(html, /role="link"[^>]*aria-label="Open A story created by a reader"/)
    assert.equal((html.match(/href="\/article\/a-story-created-by-a-reader"/g) || []).length, 3)
  })

  it('renders the same database story destination from the author profile', () => {
    const html = renderCard('/u/reader')
    assert.match(html, /href="\/article\/a-story-created-by-a-reader"/)
    assert.match(html, /href="\/u\/reader"/)
  })

  it('uses the real database id for non-public stories', () => {
    assert.equal(articlePath({ ...createdStory, status: 'draft' }), `/article/id/${createdStory.id}`)
  })
})
