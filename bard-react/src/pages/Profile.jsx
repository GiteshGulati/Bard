import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { users as usersApi } from '../api'

const DEFAULT_AVATAR = 'https://i.pravatar.cc/160?img=68'

export default function Profile() {
  const { user, refreshUser } = useAuth()

  const [myBlogs, setMyBlogs] = useState([])
  const [blogsLoading, setBlogsLoading] = useState(true)
  const [followers, setFollowers] = useState(0)
  const [following, setFollowing] = useState(0)

  const [modalOpen, setModalOpen]  = useState(false)
  const [mDisplay, setMDisplay] = useState('')
  const [mBio,    setMBio]    = useState('')
  const [mWebsite, setMWebsite] = useState('')
  const [mAvatarFile, setMAvatarFile] = useState(null)
  const [mAvatarPreview, setMAvatarPreview] = useState(DEFAULT_AVATAR)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  const avatarFileRef = useRef(null)

  // Load my blogs and social counts
  useEffect(() => {
    if (!user?.username) return
    setBlogsLoading(true)
    usersApi.myBlogs(user.username, { limit: 20 })
      .then(res => {
        const items = res?.data?.items || []
        setMyBlogs(items)
      })
      .catch(() => setMyBlogs([]))
      .finally(() => setBlogsLoading(false))

    usersApi.followers(user.username)
      .then(res => setFollowers(res?.data?.total ?? res?.data?.items?.length ?? 0))
      .catch(() => {})

    usersApi.following(user.username)
      .then(res => setFollowing(res?.data?.total ?? res?.data?.items?.length ?? 0))
      .catch(() => {})
  }, [user?.username])

  function showToast(msg) {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2200)
  }

  function openModal() {
    setMDisplay(user?.displayName || '')
    setMBio(user?.bio || '')
    setMWebsite(user?.websiteUrl || '')
    setMAvatarFile(null)
    setMAvatarPreview(user?.avatarUrl || DEFAULT_AVATAR)
    setSaveError('')
    setModalOpen(true)
  }

  function closeModal() { setModalOpen(false) }

  function handleAvatarFile(file) {
    if (!file || !file.type.startsWith('image/')) return
    setMAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setMAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaveError('')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('displayName', mDisplay.trim())
      fd.append('bio', mBio.trim())
      fd.append('websiteUrl', mWebsite.trim())
      if (mAvatarFile) fd.append('avatar', mAvatarFile)
      await usersApi.updateMe(fd)
      await refreshUser()
      closeModal()
      showToast('Profile updated')
    } catch (err) {
      setSaveError(err.message || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const displayName  = user?.displayName || user?.username || 'You'
  const displayAvatar = user?.avatarUrl || DEFAULT_AVATAR
  const displayBio    = user?.bio || 'Writing about slow mornings, honest meals, and the small rituals that make a life feel like yours.'

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh' }}>
      <main style={{ maxWidth: 896, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
        {/* Email verification banner */}
        {user && !user.emailVerified && (
          <div style={{ background: '#FEF3C7', border: '1px solid #F59E0B', padding: '1rem 1.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', color: '#92400E', borderRadius: 2 }}>
            ⚠ Your email is not verified. Some features like posting are restricted.
            Check your inbox, or <button onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: '#92400E', fontSize: 'inherit', padding: 0 }}>resend verification email</button>.
          </div>
        )}

        {/* Profile card */}
        <section style={{ background: '#EAE2D8', padding: '2.5rem', borderRadius: 2, marginBottom: '3rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'flex-start' }}>
            <img src={displayAvatar} alt={displayName} style={{ width: 112, height: 112, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { e.target.src = DEFAULT_AVATAR }} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.5rem' }}>Writer</p>
              <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', lineHeight: 1, transform: 'scaleX(1.08)', transformOrigin: 'left', marginBottom: '0.75rem' }}>{displayName}</h1>
              {user?.username && <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginBottom: '0.5rem' }}>@{user.username}</p>}
              <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.7, maxWidth: 512, marginBottom: '1.25rem' }}>{displayBio}</p>
              {user?.websiteUrl && (
                <a href={user.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#6B7280', textDecoration: 'underline', display: 'block', marginBottom: '1rem' }}>
                  {user.websiteUrl}
                </a>
              )}
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
            {[['Posts', myBlogs.length], ['Following', following], ['Followers', followers]].map(([label, val]) => (
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

        {blogsLoading ? (
          <p style={{ fontSize: '0.875rem', color: '#6B7280', textAlign: 'center', padding: '2rem 0' }}>Loading your stories…</p>
        ) : myBlogs.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#6B7280', textAlign: 'center', padding: '3rem 0' }}>
            No stories yet. <Link to="/post" style={{ textDecoration: 'underline', color: '#000' }}>Write your first one.</Link>
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#EAE2D8', padding: '1.5rem 2rem', borderRadius: 2 }}>
            {myBlogs.map((s, i) => (
              <article key={i} className="story-row feature-card" style={{ cursor: 'pointer' }}>
                <div style={{ overflow: 'hidden', minHeight: 140, background: '#5C7A6E' }}>
                  {s.coverImageUrl && <img src={s.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.8 }} />}
                </div>
                <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.72rem', color: '#757575', marginBottom: '0.5rem' }}>
                      {s.publishedAt ? new Date(s.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Draft'} · {s.readingTimeMinutes || 1} min read
                    </p>
                    <h3 className="font-display" style={{ fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', textTransform: 'uppercase', lineHeight: 1.15, marginBottom: '0.5rem' }}>{s.title}</h3>
                    <p style={{ fontSize: '0.8rem', color: '#757575', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.excerpt || ''}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#757575' }}>{(s.tags || [])[0] || ''}</p>
                    <span style={{ fontSize: '0.65rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.status}</span>
                  </div>
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
            </div>

            {/* Display Name */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Display Name</label>
              <input className="input-field" type="text" required value={mDisplay} onChange={e => setMDisplay(e.target.value)} />
            </div>

            {/* Bio */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Bio</label>
              <textarea className="input-field" rows={3} style={{ resize: 'vertical', borderBottom: '1px solid #000', fontFamily: 'Arial, sans-serif', fontSize: '0.875rem', lineHeight: 1.5 }} value={mBio} onChange={e => setMBio(e.target.value)} />
            </div>

            {/* Website */}
            <div>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6B7280', display: 'block', marginBottom: 4 }}>Website URL</label>
              <input className="input-field" type="url" placeholder="https://…" value={mWebsite} onChange={e => setMWebsite(e.target.value)} />
            </div>

            {saveError && <p style={{ fontSize: '0.875rem', color: '#F87171' }}>{saveError}</p>}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
              <button type="submit" disabled={saving} className="btn-primary" style={{ background: '#000', color: '#fff', fontWeight: 700, padding: '0.75rem 2rem', fontSize: '0.875rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={closeModal} style={{ border: '1px solid #000', background: 'none', padding: '0.75rem 1.5rem', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' }}
                onMouseOut={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#000' }}
              >Cancel</button>
            </div>
          </form>
        </div>
      </div>

      {/* Toast */}
      <div className={`toast${toastVisible ? ' show' : ''}`}>{toast}</div>
    </div>
  )
}
