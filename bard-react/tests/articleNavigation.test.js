import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { createServer } from 'vite'

let vite
let BlogCard
let ArticleCoverImage
let articlePath
let AuthContext

before(async () => {
  vite = await createServer({ configFile: './vite.config.js', server: { middlewareMode: true }, appType: 'custom' })
  ;({ default: BlogCard } = await vite.ssrLoadModule('/src/components/BlogCard.jsx'))
  ;({ default: ArticleCoverImage } = await vite.ssrLoadModule('/src/components/ArticleCoverImage.jsx'))
  ;({ articlePath } = await vite.ssrLoadModule('/src/components/articlePath.js'))
  ;({ AuthContext } = await vite.ssrLoadModule('/src/context/authState.js'))
})

after(async () => { await vite?.close() })

const createdStory = {
  id: '66a000000000000000000123',
  slug: 'a-story-created-by-a-reader',
  status: 'published',
  title: 'A story created by a reader',
  author: { id: '66a000000000000000000124', username: 'reader', displayName: 'Reader' },
  excerpt: 'A real API story.',
  coverImageUrl: 'https://cdn.example.com/story-cover?width=900&quality=80',
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

  it('renders an external cover URL in feed and profile cards with a safe fallback handler', () => {
    const html = renderCard('/')
    assert.match(html, /<img src="https:\/\/cdn\.example\.com\/story-cover\?width=900&amp;quality=80" alt="" class="card-img"/)
    assert.match(html, /referrerPolicy="no-referrer"/)
    assert.equal(renderToStaticMarkup(React.createElement(ArticleCoverImage, { src: '' })), '')
  })
})
