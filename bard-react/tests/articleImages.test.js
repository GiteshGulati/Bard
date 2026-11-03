import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { buildArticleDelta, buildArticleParts, markImageUnavailable, reconcileImageOffsets, safeExternalImageUrl, verifyDirectImageUrl } from '../src/components/articleImages.js'
import { createServer } from 'vite'

let vite
let ArticleBody

before(async () => {
  vite = await createServer({ configFile: './vite.config.js', server: { middlewareMode: true }, appType: 'custom' })
  ;({ default: ArticleBody } = await vite.ssrLoadModule('/src/components/ArticleBody.jsx'))
})

after(async () => { await vite?.close() })

describe('article image URL handling', () => {
  it('accepts HTTP and HTTPS URLs with query parameters and rejects unsafe schemes or credentials', () => {
    assert.equal(safeExternalImageUrl('https://images.example.com/picture?token=a%2Fb&width=900'), 'https://images.example.com/picture?token=a%2Fb&width=900')
    assert.equal(safeExternalImageUrl('http://images.example.com/picture?id=2'), 'http://images.example.com/picture?id=2')
    assert.equal(safeExternalImageUrl('javascript:alert(1)'), null)
    assert.equal(safeExternalImageUrl('data:image/svg+xml,<svg/>'), null)
    assert.equal(safeExternalImageUrl('https://reader:password@images.example.com/picture'), null)
    assert.equal(safeExternalImageUrl('http://127.0.0.1/private.png'), null)
    assert.equal(safeExternalImageUrl('http://printer.local/image'), null)
  })

  it('checks that a supplied URL loads as a direct image without requiring CORS or a URL extension', async () => {
    class ControlledImage {
      naturalWidth = 640
      set src(value) {
        this.value = value
        if (value.includes('/webpage')) this.onerror()
        else this.onload()
      }
    }
    assert.equal(await verifyDirectImageUrl('https://images.example.com/render?id=7', ControlledImage), 'https://images.example.com/render?id=7')
    await assert.rejects(verifyDirectImageUrl('https://example.com/webpage/123', ControlledImage), /direct, publicly accessible image/)
  })

  it('serializes several images at their selected text positions for create and edit payloads', () => {
    const images = [
      { id: 1, src: 'https://one.example.com/image?x=1', offset: 6 },
      { id: 2, src: 'http://two.example.com/image?y=2', offset: 12 },
    ]
    const delta = buildArticleDelta('First Second', images)
    assert.deepEqual(delta, { ops: [
      { insert: 'First ' }, { insert: { image: 'https://one.example.com/image?x=1' } },
      { insert: 'Second' }, { insert: { image: 'http://two.example.com/image?y=2' } },
    ] })
    assert.deepEqual(buildArticleParts('First Second', images).filter(part => part.type === 'image').map(part => part.image.id), [1, 2])
  })

  it('keeps image offsets aligned when text is inserted and removes an image if its text position is deleted', () => {
    const images = [{ id: 1, src: 'https://images.example.com/a', offset: 3 }, { id: 2, src: 'https://images.example.com/b', offset: 6 }]
    assert.deepEqual(reconcileImageOffsets('abcdef', 'abXYcdef', images), [
      { id: 1, src: 'https://images.example.com/a', offset: 5 },
      { id: 2, src: 'https://images.example.com/b', offset: 8 },
    ])
    assert.deepEqual(reconcileImageOffsets('abcdef', 'abef', images), [
      { id: 2, src: 'https://images.example.com/b', offset: 4 },
    ])
  })

  it('replaces a failed image with a safe text fallback only once', () => {
    const inserted = []
    const image = {
      dataset: {},
      style: {},
      ownerDocument: { createElement: () => ({}) },
      insertAdjacentElement: (_position, fallback) => inserted.push(fallback),
    }
    assert.equal(markImageUnavailable(image), true)
    assert.equal(image.style.display, 'none')
    assert.equal(inserted[0].className, 'article-image-fallback')
    assert.equal(inserted[0].textContent, 'Image could not be loaded.')
    assert.equal(markImageUnavailable(image), false)
    assert.equal(inserted.length, 1)
  })

  it('renders sanitized article image HTML as actual image elements in the article detail body', () => {
    const html = renderToStaticMarkup(React.createElement(ArticleBody, {
      html: '<p>Before <img src="https://images.example.com/picture?width=800&amp;token=abc" alt=""></p>',
    }))
    assert.match(html, /class="ov-body"/)
    assert.match(html, /<img src="https:\/\/images\.example\.com\/picture\?width=800&amp;token=abc"/)
  })
})
