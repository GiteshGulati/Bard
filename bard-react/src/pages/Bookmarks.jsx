import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { social as socialApi } from '../api'
import BlogCard from '../components/BlogCard'

export default function Bookmarks() {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const load = useCallback(async (nextCursor = null, append = false) => {
    append ? setBusy(true) : setLoading(true)
    setError('')
    try {
      const result = await socialApi.bookmarks({ limit: 12, ...(nextCursor ? { cursor: nextCursor } : {}) })
      setItems(current => append ? [...current, ...(result.data.items || [])] : result.data.items || [])
      setCursor(result.data.nextCursor || null)
    } catch (err) { setError(err.message || 'Could not load saved stories.') }
    finally { setLoading(false); setBusy(false) }
  }, [])
  useEffect(() => { load() }, [load, retry])

  return <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '2.5rem 1.5rem' }}><div style={{ maxWidth: 1000, margin: '0 auto' }}>
    <p style={{ textTransform: 'uppercase', letterSpacing: '.15em', color: '#6B7280', fontSize: '.75rem' }}>Private shelf</p><h1 className="font-display" style={{ fontSize: '3rem', marginBottom: '2rem' }}>Bookmarks</h1>
    {loading && <p role="status">Loading saved stories…</p>}{error && <p role="alert">{error} <button onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
    {!loading && !error && !items.length && <p>Your saved stories will appear here. <Link to="/blogs">Explore stories</Link></p>}
    <div style={{ display: 'grid', gap: '1rem' }}>{items.map(item => <BlogCard key={item.id} post={item} onChange={updated => { if (updated.bookmarked === false) setItems(current => current.filter(post => post.id !== updated.id)) }} />)}</div>
    {cursor && <button type="button" disabled={busy} onClick={() => load(cursor, true)}>{busy ? 'Loading…' : 'Load more'}</button>}
  </div></main>
}
