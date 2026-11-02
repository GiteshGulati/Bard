import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { users as usersApi } from '../api'
import { useAuth } from '../context/authState'
import BlogCard from '../components/BlogCard'

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [retry, setRetry] = useState(0)
  const [loadedKey, setLoadedKey] = useState(null)
  const requestKey = `${username}:${retry}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    let active = true
    Promise.all([usersApi.get(username), usersApi.myBlogs(username, { limit: 20 })])
      .then(([userResponse, postResponse]) => {
        if (!active) return
        setError('')
        setProfile(userResponse.data.user || userResponse.data)
        setPosts(postResponse.data.items || [])
      }).catch(err => { if (active) setError(err.message || 'Could not load this profile.') })
      .finally(() => { if (active) setLoadedKey(requestKey) })
    return () => { active = false }
  }, [username, retry, requestKey])

  async function toggleFollow() {
    if (!user) return navigate('/login', { state: { from: `/u/${encodeURIComponent(username)}` } })
    setBusy(true); setActionError('')
    try {
      if (profile.isFollowing) await usersApi.unfollow(profile.id)
      else await usersApi.follow(profile.id)
      const isFollowing = !profile.isFollowing
      setProfile(current => ({ ...current, isFollowing, followerCount: Math.max(0, (current.followerCount || 0) + (isFollowing ? 1 : -1)) }))
    } catch (err) { setActionError(err.message || 'Could not update follow status.') }
    finally { setBusy(false) }
  }

  if (loading) return <main role="status" style={{ maxWidth: 900, margin: '4rem auto', padding: '1.5rem' }}>Loading profile…</main>
  if (error) return <main style={{ maxWidth: 900, margin: '4rem auto', padding: '1.5rem' }}><p role="alert">{error} <button type="button" onClick={() => setRetry(v => v + 1)}>Retry</button></p><Link to="/blogs">Back to stories</Link></main>
  if (!profile) return null

  return (
    <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '2.5rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: 896, margin: '0 auto' }}>
        <section style={{ background: '#EAE2D8', padding: '2.5rem', borderRadius: 2, marginBottom: '3rem' }}>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.displayName || profile.username} width="112" height="112" style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <span aria-hidden="true" style={{ width: 112, height: 112, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: '#F2EBE1', fontFamily: 'var(--font-display)', fontSize: '2rem' }}>{(profile.displayName || profile.username || 'B').slice(0, 1).toUpperCase()}</span>}
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '.5rem' }}>Writer</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', lineHeight: 1, transform: 'scaleX(1.08)', transformOrigin: 'left', marginBottom: '.75rem' }}>{profile.displayName || profile.username}</h1>
            <p style={{ fontSize: '.75rem', color: '#9CA3AF', marginBottom: '.5rem' }}>@{profile.username}</p>
            <p style={{ maxWidth: 640, lineHeight: 1.7, color: '#6B7280', marginBottom: '1rem' }}>{profile.bio || 'This writer has not added a biography yet.'}</p>
            {profile.websiteUrl && <a style={{ display: 'block', marginBottom: '1rem', color: '#6B7280', fontSize: '.8rem' }} href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">{profile.websiteUrl}</a>}
            {user && user.id !== profile.id && <button className={`follow-btn${profile.isFollowing ? ' following' : ''}`} type="button" disabled={busy || !user.emailVerified} onClick={toggleFollow}>{busy ? 'Saving…' : profile.isFollowing ? 'Following' : 'Follow'}</button>}
          </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid rgba(0,0,0,.1)', textAlign: 'center' }}>
            {[['Posts', posts.length], ['Following', profile.followingCount || 0], ['Followers', profile.followerCount || 0]].map(([label, value]) => <div key={label}><p className="stat-num font-display">{value}</p><p style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6B7280', marginTop: '.25rem' }}>{label}</p></div>)}
          </div>
        </section>
        {actionError && <p role="alert" style={{ color: '#B91C1C', marginTop: '1rem' }}>{actionError}</p>}
        {!user?.emailVerified && user && user.id !== profile.id && <p style={{ marginTop: '1rem' }}>Verify your email to follow writers.</p>}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}><div><p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '.5rem' }}>Library</p><h2 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Published Stories</h2></div></div>
        {!posts.length ? <p>This writer has not published any stories yet.</p> : <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#EAE2D8', padding: '1.5rem 2rem', borderRadius: 2 }}>{posts.map(post => <BlogCard key={post.id} post={post} layout="row" />)}</div>}
      </div>
    </main>
  )
}
