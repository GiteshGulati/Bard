export function safeExternalImageUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value.trim())
    const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
    if (!['http:', 'https:'].includes(url.protocol) || !hostname || url.username || url.password) return null
    if (hostname.includes(':') || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) || !hostname.includes('.')
      || ['.localhost', '.local', '.internal', '.lan', '.home', '.home.arpa', '.test', '.invalid'].some(suffix => hostname.endsWith(suffix))) return null
    return url.href
  } catch {
    return null
  }
}

export function verifyDirectImageUrl(value, ImageConstructor = globalThis.Image) {
  const src = safeExternalImageUrl(value)
  if (!src) return Promise.reject(new Error('Image URL must use HTTP or HTTPS without embedded credentials.'))
  if (typeof ImageConstructor !== 'function') return Promise.reject(new Error('This browser cannot validate image URLs.'))
  return new Promise((resolve, reject) => {
    const image = new ImageConstructor()
    let settled = false
    const timeout = setTimeout(() => finish(false), 10000)
    function finish(loaded) {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      if (loaded && image.naturalWidth > 0) resolve(src)
      else reject(new Error('That URL did not load as a direct image. Use a direct, publicly accessible image link.'))
    }
    image.referrerPolicy = 'no-referrer'
    image.onload = () => finish(true)
    image.onerror = () => finish(false)
    image.src = src
  })
}

export function buildArticleParts(text, images = []) {
  const body = String(text || '')
  const ordered = images
    .map(image => ({ ...image, src: safeExternalImageUrl(image.src) }))
    .filter(image => image.src && Number.isInteger(image.offset) && image.offset >= 0 && image.offset <= body.length)
    .sort((left, right) => left.offset - right.offset)
  const parts = []
  let cursor = 0
  for (const image of ordered) {
    if (image.offset > cursor) parts.push({ type: 'text', value: body.slice(cursor, image.offset) })
    parts.push({ type: 'image', image })
    cursor = image.offset
  }
  if (cursor < body.length) parts.push({ type: 'text', value: body.slice(cursor) })
  if (!parts.length) parts.push({ type: 'text', value: '\n' })
  return parts
}

export function buildArticleDelta(text, images = []) {
  return {
    ops: buildArticleParts(text, images).map(part => part.type === 'image'
      ? { insert: { image: part.image.src } }
      : { insert: part.value }),
  }
}

export function reconcileImageOffsets(previousText, nextText, images = []) {
  let prefix = 0
  while (prefix < previousText.length && prefix < nextText.length && previousText[prefix] === nextText[prefix]) prefix += 1
  let suffix = 0
  while (
    suffix < previousText.length - prefix
    && suffix < nextText.length - prefix
    && previousText[previousText.length - 1 - suffix] === nextText[nextText.length - 1 - suffix]
  ) suffix += 1
  const removedEnd = previousText.length - suffix
  const shift = nextText.length - previousText.length
  return images
    .map(image => {
      if (image.offset < prefix) return image
      if (image.offset >= removedEnd) return { ...image, offset: image.offset + shift }
      return null
    })
    .filter(Boolean)
}

export function markImageUnavailable(image, message = 'Image could not be loaded.') {
  if (!image || image.dataset?.fallbackShown) return false
  if (image.dataset) image.dataset.fallbackShown = 'true'
  if (image.style) image.style.display = 'none'
  const fallback = image.ownerDocument?.createElement?.('span')
  if (fallback) {
    fallback.className = 'article-image-fallback'
    fallback.textContent = message
    image.insertAdjacentElement?.('afterend', fallback)
  }
  return true
}
