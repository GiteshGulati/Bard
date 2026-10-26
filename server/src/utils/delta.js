import sanitizeHtml from 'sanitize-html';
import { isCloudinaryImageUrl } from '../config/cloudinary.js';

const ALLOWED_IMAGE_PREFIX = '/uploads/';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeUrl(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('..')) {
      return trimmed;
    }
    const url = new URL(trimmed);
    if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function safeImageUrl(raw) {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith(ALLOWED_IMAGE_PREFIX)) {
    if (trimmed.includes('..') || trimmed.includes('\\')) return null;
    return trimmed;
  }
  return isCloudinaryImageUrl(trimmed) ? trimmed : null;
}

function applyInline(text, attrs = {}) {
  let html = escapeHtml(text);
  if (attrs.code) html = `<code>${html}</code>`;
  if (attrs.bold) html = `<strong>${html}</strong>`;
  if (attrs.italic) html = `<em>${html}</em>`;
  if (attrs.underline) html = `<u>${html}</u>`;
  if (attrs.strike) html = `<s>${html}</s>`;
  if (attrs.link) {
    const href = safeUrl(attrs.link);
    if (href) {
      html = `<a href="${escapeHtml(href)}" rel="noopener noreferrer nofollow" target="_blank">${html}</a>`;
    }
  }
  return html;
}

function listTag(list) {
  if (list === 'ordered') return 'ol';
  if (list === 'bullet') return 'ul';
  return null;
}

export function normalizeDelta(input) {
  if (!input || typeof input !== 'object') {
    return { ops: [{ insert: '\n' }] };
  }
  const ops = Array.isArray(input.ops) ? input.ops : [];
  const cleaned = [];
  for (const op of ops.slice(0, 4000)) {
    if (!op || typeof op !== 'object') continue;
    if (typeof op.insert === 'string') {
      cleaned.push({
        insert: op.insert.slice(0, 20000),
        ...(op.attributes && typeof op.attributes === 'object' ? { attributes: op.attributes } : {}),
      });
    } else if (op.insert && typeof op.insert === 'object' && typeof op.insert.image === 'string') {
      const src = safeImageUrl(op.insert.image);
      if (src) cleaned.push({ insert: { image: src } });
    }
  }
  if (!cleaned.length) cleaned.push({ insert: '\n' });
  const last = cleaned[cleaned.length - 1];
  if (typeof last.insert === 'string' && !last.insert.endsWith('\n')) {
    cleaned.push({ insert: '\n' });
  }
  return { ops: cleaned };
}

export function deltaToPlainText(delta) {
  const ops = normalizeDelta(delta).ops;
  return ops
    .map((op) => (typeof op.insert === 'string' ? op.insert : ' '))
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

export function deltaToRawHtml(delta) {
  const ops = normalizeDelta(delta).ops;
  let body = '';
  let line = '';
  let listKind = null;

  const closeList = () => {
    if (listKind) {
      body += listKind === 'ol' ? '</ol>' : '</ul>';
      listKind = null;
    }
  };

  const flushLine = (blockAttrs = {}) => {
    const next = listTag(blockAttrs.list);
    if (listKind && listKind !== next) closeList();
    if (next && listKind !== next) {
      body += next === 'ol' ? '<ol>' : '<ul>';
      listKind = next;
    }

    const header = Number(blockAttrs.header);
    if (blockAttrs['code-block']) {
      closeList();
      body += `<pre><code>${line}</code></pre>`;
    } else if (header >= 1 && header <= 4) {
      closeList();
      body += `<h${header}>${line || '<br>'}</h${header}>`;
    } else if (blockAttrs.blockquote) {
      closeList();
      body += `<blockquote><p>${line}</p></blockquote>`;
    } else if (next) {
      body += `<li>${line}</li>`;
    } else {
      body += `<p>${line || '<br>'}</p>`;
    }
    line = '';
  };

  for (const op of ops) {
    if (typeof op.insert === 'object' && op.insert.image) {
      const src = safeImageUrl(op.insert.image);
      if (src) line += `<img src="${escapeHtml(src)}" alt="">`;
      continue;
    }

    const text = String(op.insert ?? '');
    const attrs = op.attributes && typeof op.attributes === 'object' ? op.attributes : {};
    const parts = text.split('\n');
    for (let i = 0; i < parts.length; i += 1) {
      const chunk = parts[i];
      if (chunk) {
        const inlineAttrs = i === parts.length - 1 && !text.endsWith('\n') ? attrs : (i < parts.length - 1 ? {} : attrs);
        // Text attributes live on the text insert; block attrs live on the newline insert.
        if (text === '\n' || (text.includes('\n') && i < parts.length - 1)) {
          line += applyInline(chunk, text === '\n' ? {} : (chunk ? (opsHasInline(attrs) ? attrs : {}) : {}));
        } else {
          line += applyInline(chunk, attrs);
        }
      }
      if (i < parts.length - 1) {
        flushLine(attrs);
      }
    }
  }

  if (line) flushLine({});
  closeList();
  return body;
}

function opsHasInline(attrs) {
  return Boolean(attrs.bold || attrs.italic || attrs.underline || attrs.strike || attrs.link || attrs.code);
}

export function sanitizeArticleHtml(html) {
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'h1', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'img'],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
      img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer nofollow', target: '_blank' }),
      img: (tagName, attribs) => {
        const src = safeImageUrl(attribs.src) || (safeUrl(attribs.src)?.startsWith('http') ? null : null);
        if (!src) return { tagName: 'span', text: '' };
        return { tagName: 'img', attribs: { src, alt: attribs.alt || '' } };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !safeImageUrl(frame.attribs.src),
  });
}

export function renderArticle(delta) {
  const normalized = normalizeDelta(delta);
  const html = sanitizeArticleHtml(deltaToRawHtml(normalized));
  const plainText = deltaToPlainText(normalized);
  return { delta: normalized, html, plainText };
}

export function sanitizeComment(text) {
  return sanitizeHtml(String(text || ''), {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
