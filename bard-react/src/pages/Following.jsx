import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { blogs as blogsApi, users as usersApi } from '../api'
import { useAuth } from '../context/AuthContext'
import BlogCard from '../components/BlogCard'

function groupByAuthor(posts) {
  const groups = new Map()
  for (const post of posts) {
    const author = post.author || { id: 'unknown', displayName: 'BARD writer' }
    const key = author.id || author.username || post.id
    if (!groups.has(key)) groups.set(key, { author, posts: [] })
    groups.get(key).posts.push(post)
  }
  return [...groups.values()]
}

export default function Following() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const [unfollowing, setUnfollowing] = useState('')
  const [unfollowError, setUnfollowError] = useState('')

  const load = useCallback(async (nextCursor = null, append = false) => {
    if (!user) { setLoading(false); setPosts([]); setCursor(null); return }
    if (append) setMoreLoading(true); else setLoading(true)
    setError('')
    try {
      const result = await blogsApi.feed({ limit: 12, ...(nextCursor ? { cursor: nextCursor } : {}) })
      const items = result?.data?.items || []
      setPosts(current => append ? [...current, ...items] : items)
      setCursor(result?.data?.nextCursor || null)
    } catch (err) { setError(err.message || 'Could not load your following feed.') }
    finally { setLoading(false); setMoreLoading(false) }
  }, [user])

  useEffect(() => { load() }, [load, retry])

  const groups = useMemo(() => groupByAuthor(posts), [posts])

  async function unfollow(author) {
    if (!author?.id || unfollowing) return
    setUnfollowing(author.id); setUnfollowError('')
    try {
      await usersApi.unfollow(author.id)
      setPosts(current => current.filter(post => String(post.author?.id) !== String(author.id)))
    } catch (err) { setUnfollowError(err.message || 'Could not update your following list.') }
    finally { setUnfollowing('') }
  }

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh' }}>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '.5rem' }}>Your circle</p>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Following</h1>
        </div>

        {!user && <div style={{ background: '#EAE2D8', padding: '1.5rem 2rem', borderRadius: 2, marginBottom: '2rem', fontSize: '.875rem', color: '#6B7280' }}><Link to="/login" style={{ color: '#000', fontWeight: 700 }}>Log in</Link> to follow writers and get a personalised reading feed.</div>}
        {user && loading && <p role="status" style={{ padding: '2rem 0', color: '#6B7280' }}>Loading your feed…</p>}
        {user && !loading && error && <p role="alert" style={{ padding: '2rem 0', color: '#6B7280' }}>{error} <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
        {unfollowError && <p role="alert" style={{ marginBottom: '1rem', color: '#B91C1C' }}>{unfollowError}</p>}
        {user && !loading && !error && groups.length === 0 && <section style={{ background: '#EAE2D8', padding: '2rem', borderRadius: 2 }}><h2 className="font-display" style={{ fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '.5rem' }}>No stories in your circle yet</h2><p style={{ color: '#6B7280', marginBottom: '1rem' }}>Follow writers from their profiles to see new stories here.</p><Link to="/blogs" style={{ color: '#000', fontWeight: 700 }}>Explore stories →</Link></section>}

        {user && !loading && !error && <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {groups.map(({ author, posts: authorPosts }) => (
            <section key={author.id || author.username} className="writer-card">
              <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid #E0DCD6', flexWrap: 'wrap' }}>
                {author.avatarUrl ? <img src={author.avatarUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} /> : <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: '50%', flexShrink: 0, display: 'grid', placeItems: 'center', background: '#EAE2D8', fontFamily: 'var(--font-display)', fontSize: '1.5rem' }}>{(author.displayName || author.username || 'B').slice(0, 1).toUpperCase()}</span>}
                <div style={{ flex: 1, minWidth: 200 }}>
                  {author.username ? <Link to={`/u/${encodeURIComponent(author.username)}`} style={{ color: 'inherit', textDecoration: 'none' }}><h2 className="font-display" style={{ fontSize: '1.5rem', textTransform: 'uppercase', transform: 'scaleX(1.06)', transformOrigin: 'left', marginBottom: '.25rem' }}>{author.displayName || author.username}</h2></Link> : <h2 className="font-display" style={{ fontSize: '1.5rem', textTransform: 'uppercase', marginBottom: '.25rem' }}>{author.displayName || 'BARD writer'}</h2>}
                  <p style={{ fontSize: '.875rem', color: '#757575', lineHeight: 1.5 }}>{author.bio || `Recent stories from ${author.displayName || author.username || 'a writer you follow'}.`}</p>
                  {author.username && <p style={{ fontSize: '.72rem', color: '#9CA3AF', marginTop: '.25rem' }}>@{author.username}</p>}
                </div>
                <button className="follow-btn following" type="button" disabled={unfollowing === author.id} onClick={() => unfollow(author)}>{unfollowing === author.id ? 'Updating…' : 'Following'}</button>
              </div>
              <div style={{ padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {authorPosts.map(post => <BlogCard key={post.id} post={post} layout="feature" onChange={updated => setPosts(current => current.map(item => item.id === updated.id ? { ...item, ...updated } : item))} />)}
              </div>
            </section>
          ))}
        </div>}
        {cursor && !loading && !error && <div style={{ textAlign: 'center', marginTop: '2rem' }}><button type="button" className="topic-clear" style={{ background: '#000' }} disabled={moreLoading} onClick={() => load(cursor, true)}>{moreLoading ? 'Loading…' : 'Load more stories'}</button></div>}
      </main>
    </div>
  )
}
