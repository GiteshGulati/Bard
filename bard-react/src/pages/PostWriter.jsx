import { useState, useRef, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TOPIC_CHIPS } from '../data'
import { useAuth } from '../context/AuthContext'
import { blogs as blogsApi } from '../api'

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
  const [activeTopic, setActiveTopic] = useState('gut')
  const [coverFile, setCoverFile] = useState(null)
  const [coverSrc, setCoverSrc] = useState(DEFAULT_COVER)
  const [coverUrl, setCoverUrl] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(false)

  const coverFileRef = useRef(null)

  const currentChip = TOPIC_CHIPS.find(c => c.id === activeTopic) || TOPIC_CHIPS[0]
  const words = wordCount(body)
  const mins  = readMins(words)

  function showToast(msg) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2200)
  }

  async function handlePublish(e) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) { showToast('Add a title and a story first'); return }
    if (!user?.emailVerified) {
      showToast('Please verify your email before publishing')
      return
    }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title', title.trim())
      fd.append('excerpt', excerpt.trim())
      // Convert plain text body to minimal delta format the server expects
      const delta = { ops: body.split('\n').map(line => ({ insert: line + '\n' })) }
      fd.append('content', JSON.stringify(delta))
      fd.append('tags', JSON.stringify([currentChip.id]))
      fd.append('status', 'published')
      if (coverFile) {
        fd.append('cover', coverFile)
      }
      await blogsApi.create(fd)
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
    const reader = new FileReader()
    reader.onload = (ev) => setCoverSrc(ev.target.result)
    reader.readAsDataURL(file)
  }, [])

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
              <button onClick={() => { setPublished(false); setTitle(''); setExcerpt(''); setBody(''); setCoverSrc(DEFAULT_COVER); setCoverFile(null) }}
                style={{ border: '1px solid rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.8)', padding: '0.5rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'none', cursor: 'pointer' }}>
                Write Another
              </button>
            </div>
          </div>
        )}

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
          <style>{`@media (max-width: 768px) { .post-grid { grid-template-columns: 1fr !important; } }`}</style>

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
                </div>
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
                <textarea id="body" className="field-textarea" placeholder="Write your story here…" value={body} onChange={e => setBody(e.target.value)} required />
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
                    ? <img src={coverSrc} alt="cover preview" style={{ maxHeight: 160, width: '100%', objectFit: 'cover', display: 'block' }} />
                    : <p style={{ fontSize: '0.875rem', color: '#757575' }}>Drop image here or click to upload</p>}
                </div>
                <input ref={coverFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCoverFile(e.target.files[0])} />
                <input className="field-input" type="url" placeholder="…or paste an image URL" style={{ marginTop: '0.75rem' }}
                  value={coverUrl}
                  onChange={e => { setCoverUrl(e.target.value); if (e.target.value.trim()) { setCoverSrc(e.target.value.trim()); setCoverFile(null) } }}
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
                <img src={coverSrc} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.8 }} />
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
