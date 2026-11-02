import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { blogs as blogsApi } from '../api'
import BlogCard from '../components/BlogCard'

export default function Blogs() {
  const [params, setParams] = useSearchParams()
  const topic = params.get('topic') || ''
  const initialQuery = params.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => { setQuery(initialQuery) }, [initialQuery])

  useEffect(() => {
    let active = true
    setLoading(true); setError(''); setPosts([]); setCursor(null)
    const request = initialQuery.trim()
      ? blogsApi.search({ q: initialQuery.trim(), ...(topic ? { tag: topic } : {}), limit: 12 })
      : blogsApi.list({ ...(topic ? { tag: topic } : {}), limit: 12 })
    request.then(result => {
      if (!active) return
      setPosts(result?.data?.items || [])
      setCursor(result?.data?.nextCursor || null)
    }).catch(err => { if (active) setError(err.message || 'Could not load stories.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [initialQuery, topic, retryKey])

  function submitSearch(event) {
    event.preventDefault()
    const next = {}
    if (query.trim()) next.q = query.trim()
    if (topic) next.topic = topic
    setParams(next)
  }

  async function loadMore() {
    if (!cursor || moreLoading) return
    setMoreLoading(true); setError('')
    try {
      const options = { limit: 12, cursor, ...(topic ? { tag: topic } : {}) }
      const result = initialQuery.trim()
        ? await blogsApi.search({ ...options, q: initialQuery.trim() })
        : await blogsApi.list(options)
      setPosts(current => [...current, ...(result?.data?.items || [])])
      setCursor(result?.data?.nextCursor || null)
    } catch (err) { setError(err.message || 'Could not load more stories.') }
    finally { setMoreLoading(false) }
  }

  return (
    <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '2rem 1.5rem 5rem' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div><p style={{ textTransform: 'uppercase', letterSpacing: '.15em', color: '#6B7280', fontSize: '.75rem' }}>The public table</p><h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>Stories</h1></div>
          <form onSubmit={submitSearch} style={{ display: 'flex', gap: '.5rem' }}>
            <input aria-label="Search stories" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search stories" />
            <button type="submit">Search</button>
          </form>
        </header>
        {topic && <p style={{ marginBottom: '1rem' }}>Topic: <strong>{topic}</strong> <button type="button" onClick={() => setParams(initialQuery ? { q: initialQuery } : {})}>Clear</button></p>}
        {loading && <p role="status">Loading stories…</p>}
        {!loading && error && <div role="alert" style={{ padding: '1rem', background: '#FEE2E2', marginBottom: '1rem' }}>{error} <button type="button" onClick={() => setRetryKey(key => key + 1)}>Retry</button></div>}
        {!loading && !error && !posts.length && <p style={{ padding: '3rem', textAlign: 'center' }}>No published stories match this search yet.</p>}
        <div style={{ display: 'grid', gap: '1.5rem' }}>{posts.map(post => <BlogCard key={post.id} post={post} onChange={updated => setPosts(current => current.map(item => item.id === updated.id ? { ...item, ...updated } : item))} />)}</div>
        {!loading && cursor && <div style={{ textAlign: 'center', marginTop: '2rem' }}><button type="button" disabled={moreLoading} onClick={loadMore}>{moreLoading ? 'Loading…' : 'Load more'}</button></div>}
      </div>
    </main>
  )
}
