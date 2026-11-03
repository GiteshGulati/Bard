import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TOPIC_CHIPS } from '../data'
import { useAuth } from '../context/authState'
import { blogs as blogsApi, uploads as uploadsApi } from '../api'
import { buildArticleDelta, buildArticleParts, markImageUnavailable, reconcileImageOffsets, safeExternalImageUrl, verifyDirectImageUrl } from '../components/articleImages'

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop'

function wordCount(text) { return (text.trim().match(/\S+/g) || []).length }
function readMins(words) { return Math.max(1, Math.round(words / 200) || 1) }

const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export default function PostWriter() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title,   setTitle]   = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [body,    setBody]    = useState('')
  const [inlineImages, setInlineImages] = useState([])
  const [inlineImageUrl, setInlineImageUrl] = useState('')
  const [imageUploading, setImageUploading] = useState(false)
  const [imageChecking, setImageChecking] = useState(false)
  const [activeTopic, setActiveTopic] = useState('gut')
  const [customTopic, setCustomTopic] = useState('')
  const [coverFile, setCoverFile] = useState(null)
  const [coverSrc, setCoverSrc] = useState(DEFAULT_COVER)
  const [coverImageFailed, setCoverImageFailed] = useState(false)
  const [coverUrl, setCoverUrl] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)

  const coverFileRef = useRef(null)
  const inlineImageFileRef = useRef(null)
  const bodyRef = useRef(null)
  const imageCursorRef = useRef(0)
  const imageIdRef = useRef(0)

  const isCustom = activeTopic === '__custom__'
  const currentChip = isCustom
    ? { id: '__custom__', label: customTopic.trim() || 'Custom', color: '#6B7280' }
    : (TOPIC_CHIPS.find(c => c.id === activeTopic) || TOPIC_CHIPS[0])
  const words = wordCount(body)
  const mins  = readMins(words)

  function showToast(msg) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2200)
  }

  async function handlePublish(e) {
    e.preventDefault()
    if (!title.trim() || (!body.trim() && !inlineImages.length)) { showToast('Add a title and a story first'); return }
    if (isCustom && !customTopic.trim()) { showToast('Enter a custom topic name'); return }
    if (!user?.emailVerified) {
      showToast('Please verify your email before publishing')
      return
    }
    setLoading(true)
    try {
      const externalCoverUrl = coverUrl.trim() ? await verifyDirectImageUrl(coverUrl) : null
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('excerpt', excerpt.trim())
      const delta = buildArticleDelta(body, inlineImages)
      fd.append('content', JSON.stringify(delta))
      const topicTag = isCustom ? customTopic.trim().toLowerCase().replace(/\s+/g, '-') : currentChip.id
      fd.append('tags', JSON.stringify([topicTag]))
      fd.append('status', 'published')
      if (coverFile) {
        fd.append('cover', coverFile)
      } else if (externalCoverUrl) fd.append('coverImageUrl', externalCoverUrl)
      const response = await blogsApi.create(fd)
      const created = response?.data?.blog
      if (created?.slug) {
        navigate(`/article/${encodeURIComponent(created.slug)}`, { state: { from: '/profile' } })
        return
      }
      setPublished(true)
      showToast('Published!')
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
    } catch (err) {
      showToast(err.message || 'Failed to publish. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCoverFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    setCoverFile(file)
    setCoverUrl('')
    setCoverImageFailed(false)
    const reader = new FileReader()
    reader.onload = (ev) => { setCoverSrc(ev.target.result); setCoverImageFailed(false) }
    reader.readAsDataURL(file)
  }, [])

  function insertInlineImage(src) {
    const offset = Math.min(imageCursorRef.current, body.length)
    setInlineImages(current => [...current, { id: ++imageIdRef.current, src, offset }])
    setInlineImageUrl('')
    requestAnimationFrame(() => bodyRef.current?.focus())
  }

  async function addInlineImage(rawUrl) {
    setImageChecking(true)
    try {
      const src = await verifyDirectImageUrl(rawUrl)
      insertInlineImage(src)
    } catch (error) {
      showToast(error.message || 'Use a direct, publicly accessible image URL')
    } finally {
      setImageChecking(false)
    }
  }

  async function uploadInlineImage(file) {
    if (!file) return
    setImageUploading(true)
    try {
      const result = await uploadsApi.inline(file)
      const src = safeExternalImageUrl(result?.data?.url)
      if (src) insertInlineImage(src)
      else showToast('The uploaded image URL could not be inserted')
    } catch (error) {
      showToast(error.message || 'Image upload failed')
    } finally {
      setImageUploading(false)
      if (inlineImageFileRef.current) inlineImageFileRef.current.value = ''
    }
  }

  const previewParts = buildArticleParts(body, inlineImages)

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh' }}>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Email verification warning */}
        {user && !user.emailVerified && (
          <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', padding: '1rem 1.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#92400E' }}>
            ⚠ Please verify your email to publish stories. Check your inbox for a verification link.
          </div>
        )}

        {/* Success banner */}
        {published && (
          <div style={{ background: '#000', color: '#fff', padding: '1.5rem 2rem', textAlign: 'center', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p className="font-display" style={{ fontSize: '1.5rem', textTransform: 'uppercase', transform: 'scaleX(1.06)', transformOrigin: 'center' }}>Story Published!</p>
            <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>Your story is now live on BARD.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.5rem' }}>
              <Link to="/blogs" style={{ border: '1px solid #fff', color: '#fff', padding: '0.5rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>View Blog</Link>
              <button onClick={() => { setPublished(false); setTitle(''); setExcerpt(''); setBody(''); setInlineImages([]); setInlineImageUrl(''); setCoverUrl(''); setCoverSrc(DEFAULT_COVER); setCoverImageFailed(false); setCoverFile(null); setActiveTopic('gut'); setCustomTopic('') }}
                style={{ border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.8)', padding: '0.5rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', cursor: 'pointer' }}>
                Write Another
              </button>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div className="post-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
          <style>{`@media (max-width: 768px) { .post-layout { grid-template-columns: 1fr !important; } }`}</style>

          {/* Left: Form */}
          <div className="post-grid" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.5rem' }}>Create</p>
              <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Write a Story</h1>
            </div>

            <form onSubmit={handlePublish} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Topic chips */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Topic</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {TOPIC_CHIPS.map(chip => (
                    <button key={chip.id} type="button"
                      className={`topic-chip${activeTopic === chip.id ? ' active' : ''}`}
                      onClick={() => setActiveTopic(chip.id)}
                    >{chip.label}</button>
                  ))}
                  <button type="button"
                    className={`topic-chip${activeTopic === '__custom__' ? ' active' : ''}`}
                    onClick={() => setActiveTopic('__custom__')}
                  >+ Custom</button>
                </div>
                {activeTopic === '__custom__' && (
                  <input
                    className="field-input"
                    type="text"
                    placeholder="Enter your topic…"
                    value={customTopic}
                    onChange={e => setCustomTopic(e.target.value)}
                    maxLength={40}
                    style={{ marginTop: '0.75rem' }}
                    autoFocus
                  />
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Title *</label>
                <input id="title" className="field-input" type="text" placeholder="A title worth reading" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              {/* Excerpt */}
              <div>
                <label htmlFor="excerpt" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Excerpt</label>
                <input id="excerpt" className="field-input" type="text" placeholder="A short line that makes someone stop and read." value={excerpt} onChange={e => setExcerpt(e.target.value)} />
              </div>

              {/* Body */}
              <div>
                <label htmlFor="body" style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Story *</label>
                <textarea id="body" ref={bodyRef} className="field-textarea" placeholder="Write your story here…" value={body} onSelect={event => { imageCursorRef.current = event.currentTarget.selectionStart }} onChange={event => {
                  const next = event.target.value
                  setInlineImages(current => reconcileImageOffsets(body, next, current))
                  imageCursorRef.current = event.target.selectionStart
                  setBody(next)
                }} required={!inlineImages.length} />
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '.75rem' }}>
                  <input aria-label="External image URL" className="field-input" type="url" placeholder="Paste an image URL (HTTP or HTTPS)" value={inlineImageUrl} onChange={event => setInlineImageUrl(event.target.value)} style={{ flex: '1 1 260px' }} />
                  <button type="button" className="btn-primary" disabled={imageChecking} onClick={() => addInlineImage(inlineImageUrl)} style={{ background: '#000', color: '#fff', padding: '.55rem .9rem', fontSize: '.72rem', opacity: imageChecking ? .65 : 1 }}>{imageChecking ? 'Checking image…' : 'Insert image URL'}</button>
                  <input ref={inlineImageFileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={event => uploadInlineImage(event.target.files?.[0])} />
                  <button type="button" className="btn-primary" disabled={imageUploading} onClick={() => inlineImageFileRef.current?.click()} style={{ background: '#000', color: '#fff', padding: '.55rem .9rem', fontSize: '.72rem', opacity: imageUploading ? .65 : 1 }}>{imageUploading ? 'Uploading…' : 'Upload image'}</button>
                </div>
                {!!inlineImages.length && <div className="inline-image-preview" aria-label="Article image preview">
                  {previewParts.map((part, index) => part.type === 'text'
                    ? <span key={`text-${index}`} style={{ whiteSpace: 'pre-wrap' }}>{part.value}</span>
                    : <span key={`image-${part.image.id}`} style={{ display: 'block', margin: '.75rem 0' }}><img src={part.image.src} alt="Article image preview" referrerPolicy="no-referrer" onError={event => markImageUnavailable(event.currentTarget)} /><button type="button" onClick={() => setInlineImages(current => current.filter(image => image.id !== part.image.id))} style={{ marginTop: '.25rem' }}>Remove image</button></span>)}
                </div>}
                <p style={{ fontSize: '0.72rem', color: '#757575', marginTop: '0.35rem' }}>
                  <span>{words} word{words !== 1 ? 's' : ''}</span>
                  <span style={{ marginLeft: '0.75rem' }}>· {mins} min read</span>
                </p>
              </div>

              {/* Cover image */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Cover Image</label>
                <div
                  className={`cover-drop${dragOver ? ' drag-over' : ''}${coverSrc !== DEFAULT_COVER ? ' has-image' : ''}`}
                  onClick={() => coverFileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleCoverFile(e.dataTransfer.files[0]) }}
                >
                  {coverSrc !== DEFAULT_COVER
                    ? coverImageFailed ? <span className="article-image-fallback">Cover image could not be loaded.</span> : <img src={coverSrc} alt="cover preview" referrerPolicy="no-referrer" onError={() => setCoverImageFailed(true)} style={{ maxHeight: 160, width: '100%', objectFit: 'cover', display: 'block' }} />
                    : <p style={{ fontSize: '0.875rem', color: '#757575' }}>Drop image here or click to upload</p>}
                </div>
                <input ref={coverFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCoverFile(e.target.files[0])} />
                <input className="field-input" type="url" placeholder="…or paste an image URL" style={{ marginTop: '0.75rem' }}
                  value={coverUrl}
                  onChange={e => { setCoverUrl(e.target.value); setCoverImageFailed(false); if (e.target.value.trim()) { setCoverSrc(safeExternalImageUrl(e.target.value) || DEFAULT_COVER); setCoverFile(null); if (coverFileRef.current) coverFileRef.current.value = '' } }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button type="submit" disabled={loading} className="btn-primary" style={{ background: '#000', color: '#fff', fontWeight: 700, padding: '0.75rem 2rem', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Publishing…' : 'Publish Story'}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Live Preview */}
          <div style={{ position: 'sticky', top: 80 }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#757575', marginBottom: '1rem' }}>Live Preview</p>
            <article style={{ background: '#FDFCFB', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <div style={{ height: 220, background: currentChip.color, position: 'relative', overflow: 'hidden' }}>
                {coverImageFailed ? <span className="article-image-fallback">Cover image could not be loaded.</span> : <img src={coverSrc} alt="preview" referrerPolicy="no-referrer" onError={() => setCoverImageFailed(true)} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.8 }} />}
                <span style={{ position: 'absolute', top: 12, right: 12, background: '#000', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px' }}>{mins} min read</span>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#757575', marginBottom: '0.5rem' }}>{currentChip.label}</p>
                <h2 className="font-display" style={{ fontSize: '1.5rem', textTransform: 'uppercase', lineHeight: 1.15, marginBottom: '0.75rem', transform: 'scaleX(1.04)', transformOrigin: 'left', minHeight: '2rem' }}>
                  {title || 'A title worth reading'}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#757575', lineHeight: 1.6, marginBottom: '1rem', minHeight: '2rem' }}>
                  {excerpt || 'A short line that makes someone stop and read.'}
                </p>
                <div style={{ height: 1, background: '#E0DCD6', marginBottom: '0.75rem' }} />
                <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{today} · {mins} min read · {words} words</p>
              </div>
            </article>
          </div>
        </div>
      </main>

      {/* Toast */}
      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
