import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { blogs as blogsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import BlogCard from '../components/BlogCard'

export default function Following() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  const load = useCallback(async (nextCursor = null, append = false) => {
    if (!user) { setLoading(false); setPosts([]); return }
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

  useEffect(() => { load(); }, [load, retry])

  return (
    <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '2.5rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '.15em', color: '#6B7280', fontSize: '.75rem' }}>Your reading circle</p>
        <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', marginBottom: '2rem' }}>Following</h1>
        {!user && <p><Link to="/login">Log in</Link> to see stories from writers you follow.</p>}
        {user && loading && <p role="status">Loading your feed…</p>}
        {user && !loading && error && <p role="alert">{error} <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
        {user && !loading && !error && !posts.length && <section style={{ background: '#EAE2D8', padding: '2rem' }}><h2>No stories in your feed yet</h2><p>Follow authors from their profiles to see their latest public stories here.</p><Link to="/blogs">Explore stories</Link></section>}
        <div style={{ display: 'grid', gap: '1.5rem' }}>{posts.map(post => <BlogCard key={post.id} post={post} onChange={updated => setPosts(current => current.map(item => item.id === updated.id ? { ...item, ...updated } : item))} />)}</div>
        {cursor && !loading && <div style={{ textAlign: 'center', marginTop: '2rem' }}><button type="button" disabled={moreLoading} onClick={() => load(cursor, true)}>{moreLoading ? 'Loading…' : 'Load more'}</button></div>}
      </div>
    </main>
  )
}
