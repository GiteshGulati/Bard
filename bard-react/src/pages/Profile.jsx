import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { BardAuth } from '../auth'
import { SAMPLE_STORIES } from '../data'

const DEFAULT_AVATAR = 'https://i.pravatar.cc/160?img=68'

function getProfile() {
  try { return JSON.parse(localStorage.getItem('bard-profile') || '{}') } catch { return {} }
}
function saveProfile(data) { localStorage.setItem('bard-profile', JSON.stringify(data)) }

export default function Profile() {
  const user = BardAuth.getUser()

  const [profile, setProfile] = useState(getProfile)
  const [modalOpen, setModalOpen]  = useState(false)

  // Modal form state
  const [mFirst,  setMFirst]  = useState('')
  const [mLast,   setMLast]   = useState('')
  const [mBio,    setMBio]    = useState('')
  const [mAvatar, setMAvatar] = useState('')
  const [mAvatarPreview, setMAvatarPreview] = useState(DEFAULT_AVATAR)
  const [pendingAvatar, setPendingAvatar]   = useState(null)
  const [tags,    setTags]    = useState([])
  const [tagInput, setTagInput] = useState('')

  const avatarFileRef = useRef(null)

  // Published stories
  let published = []
  try { published = JSON.parse(localStorage.getItem('bard-posts') || '[]') } catch {}
  const stories = [...published, ...SAMPLE_STORIES]

  const displayName  = profile.firstName || user?.firstName || 'You'
  const displayAvatar = profile.avatar || DEFAULT_AVATAR
  const displayBio    = profile.bio || 'Writing about slow mornings, honest meals, and the small rituals that make a life feel like yours. Based in the hills. Always a book in the bag.'
  const displayTags   = profile.tags?.length ? profile.tags : ['Mindfulness', 'Sleep', 'Gut Health']

  function openModal() {
    setMFirst(profile.firstName || user?.firstName || '')
    setMLast(profile.lastName  || user?.lastName  || '')
    setMBio(profile.bio || '')
    setMAvatar('')
    setMAvatarPreview(profile.avatar || DEFAULT_AVATAR)
    setPendingAvatar(null)
    setTags(profile.tags ? [...profile.tags] : [])
    setTagInput('')
    setModalOpen(true)
  }

  function closeModal() { setModalOpen(false) }

  function handleAvatarFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = ev => { setPendingAvatar(ev.target.result); setMAvatarPreview(ev.target.result); setMAvatar('') }
    reader.readAsDataURL(file)
  }

  function handleAvatarUrl(url) {
    setMAvatar(url)
    setPendingAvatar(null)
    setMAvatarPreview(url || profile.avatar || DEFAULT_AVATAR)
  }

  function addTag(val) {
    const v = val.trim()
    if (v && !tags.includes(v)) setTags(prev => [...prev, v])
    setTagInput('')
  }

  function removeTag(i) { setTags(prev => prev.filter((_, idx) => idx !== i)) }

  function handleSave(e) {
    e.preventDefault()
    const updated = {
      firstName: mFirst.trim(),
      lastName:  mLast.trim(),
      bio:       mBio.trim(),
      avatar:    pendingAvatar || mAvatar.trim() || profile.avatar || '',
      tags:      tags.slice(),
    }
    saveProfile(updated)
    setProfile(updated)
    closeModal()
  }

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh' }}>
      <main style={{ maxWidth: 896, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Profile card */}
        <section style={{ background: '#EAE2D8', padding: '2.5rem', borderRadius: 2, marginBottom: '3rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
            <img src={displayAvatar} alt={displayName} style={{ width: 112, height: 112, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = DEFAULT_AVATAR }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.5rem' }}>Writer</p>
              <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', lineHeight: 1, transform: 'scaleX(1.08)', transformOrigin: 'left', marginBottom: '0.75rem' }}>{displayName}</h1>
              <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.7, maxWidth: 512, marginBottom: '1.25rem' }}>{displayBio}</p>
              <div style={{ marginBottom: '1.5rem' }}>
                {displayTags.map(t => <span key={t} className="topic-tag">{t}</span>)}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                <Link to="/post" className="btn-primary" style={{ background: '#000', color: '#fff', fontWeight: 700, padding: '0.75rem 2rem', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none' }}>Write</Link>
                <button onClick={openModal} style={{ border: '1px solid #000', background: 'none', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#000' }}
                >Edit Profile</button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(0,0,0,0.1)', textAlign: 'center' }}>
            {[['Posts', stories.length], ['Following', 48], ['Followers', 312]].map(([label, val]) => (
              <div key={label}>
                <p className="stat-num font-display">{val}</p>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginTop: '0.25rem' }}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stories */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.5rem' }}>Library</p>
            <h2 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Your Stories</h2>
          </div>
          <Link to="/blogs" style={{ fontSize: '0.875rem', textDecoration: 'underline', textUnderlineOffset: 4, color: '#000' }}>All posts →</Link>
        </div>

        {stories.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#6B7280', textAlign: 'center', padding: '3rem 0' }}>
            No stories yet. <Link to="/post" style={{ textDecoration: 'underline', color: '#000' }}>Write your first one.</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#EAE2D8', padding: '1.5rem 2rem', borderRadius: 2 }}>
            {stories.map((s, i) => (
              <article key={i} className="story-row feature-card" style={{ cursor: 'pointer' }}>
                <div style={{ overflow: 'hidden', minHeight: 140, background: s.topicColor || '#5C7A6E' }}>
                  <img src={s.cover || s.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.8 }} />
                </div>
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: '#757575', marginBottom: '0.5rem' }}>{s.date || ''} · {s.read || ''}</p>
                    <h3 className="font-display" style={{ fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', textTransform: 'uppercase', lineHeight: 1.15, marginBottom: '0.5rem' }}>{s.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#757575', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.excerpt || ''}</p>
                  </div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#757575', marginTop: '0.75rem' }}>{s.topicLabel || s.topic || ''}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {/* Edit Profile Modal */}
      <div className={`modal-backdrop${modalOpen ? ' active' : ''}`} onClick={e => e.target === e.currentTarget && closeModal()}>
        <div className="modal-box" style={{ background: '#FDFCFB' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <h2 className="font-display" style={{ fontSize: '1.75rem', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Edit Profile</h2>
            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 1, transition: 'opacity 0.2s' }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.6'} onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
            </button>
          </div>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <img src={mAvatarPreview} alt="avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '2px dashed #000' }} onError={e => { e.target.src = DEFAULT_AVATAR }} />
                <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280' }}>Click to upload photo</span>
                <input type="file" accept="image/*" style={{ display: 'none' }} ref={avatarFileRef} onChange={e => handleAvatarFile(e.target.files[0])} />
              </label>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280' }}>— or paste a URL —</span>
              <div style={{ width: '100%' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Avatar URL</label>
                <input className="input-field" type="url" placeholder="https://…" value={mAvatar} onChange={e => handleAvatarUrl(e.target.value)} />
              </div>
            </div>

            {/* Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>First Name</label>
                <input className="input-field" type="text" required value={mFirst} onChange={e => setMFirst(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Last Name</label>
                <input className="input-field" type="text" value={mLast} onChange={e => setMLast(e.target.value)} />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Bio</label>
              <textarea className="input-field" rows={3} style={{ resize: 'vertical', borderBottom: '1px solid #000', fontFamily: 'Arial, sans-serif', fontSize: '0.875rem', lineHeight: 1.5 }} value={mBio} onChange={e => setMBio(e.target.value)} />
            </div>

            {/* Tags */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Topics <span style={{ textTransform: 'none', fontWeight: 400 }}>(press Enter to add)</span></label>
              <div className="tag-input-wrap" onClick={() => document.getElementById('tag-input-field')?.focus()}>
                {tags.map((t, i) => (
                  <span key={i} className="tag-chip">
                    {t}
                    <button type="button" onClick={() => removeTag(i)}>×</button>
                  </span>
                ))}
                <input
                  id="tag-input-field"
                  className="tag-input"
                  type="text"
                  placeholder="Add topic…"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
                />
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button type="submit" className="btn-primary" style={{ background: '#000', color: '#fff', fontWeight: 700, padding: '0.75rem 2rem', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Save</button>
              <button type="button" onClick={closeModal} style={{ border: '1px solid #000', background: 'none', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' }}
                onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#000' }}
              >Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
