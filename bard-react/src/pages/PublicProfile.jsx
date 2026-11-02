import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { users as usersApi } from '../api'
import { useAuth } from '../context/AuthContext'
import BlogCard from '../components/BlogCard'

export default function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    Promise.all([usersApi.get(username), usersApi.myBlogs(username, { limit: 20 })])
      .then(([userResponse, postResponse]) => {
        if (!active) return
        setProfile(userResponse.data.user || userResponse.data)
        setPosts(postResponse.data.items || [])
      }).catch(err => { if (active) setError(err.message || 'Could not load this profile.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [username, retry])

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
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <section style={{ background: '#EAE2D8', padding: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <img src={profile.avatarUrl || undefined} alt="" width="100" height="100" style={{ borderRadius: '50%', objectFit: 'cover', background: '#D4C7B9' }} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <p style={{ color: '#6B7280' }}>@{profile.username}</p>
            <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}>{profile.displayName}</h1>
            <p style={{ maxWidth: 640, lineHeight: 1.7 }}>{profile.bio || 'This writer has not added a biography yet.'}</p>
            {profile.websiteUrl && <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer">{profile.websiteUrl}</a>}
            <p style={{ marginTop: '.75rem', color: '#6B7280' }}>{profile.followerCount || 0} followers · {profile.followingCount || 0} following</p>
          </div>
          {user && user.id !== profile.id && <button type="button" disabled={busy || !user.emailVerified} onClick={toggleFollow}>{busy ? 'Saving…' : profile.isFollowing ? 'Unfollow' : 'Follow'}</button>}
        </section>
        {actionError && <p role="alert" style={{ color: '#B91C1C', marginTop: '1rem' }}>{actionError}</p>}
        {!user?.emailVerified && user && user.id !== profile.id && <p style={{ marginTop: '1rem' }}>Verify your email to follow writers.</p>}
        <h2 className="font-display" style={{ fontSize: '2rem', margin: '2.5rem 0 1rem' }}>Published stories</h2>
        {!posts.length ? <p>This writer has not published any stories yet.</p> : <div style={{ display: 'grid', gap: '1.25rem' }}>{posts.map(post => <BlogCard key={post.id} post={post} />)}</div>}
      </div>
    </main>
  )
}
