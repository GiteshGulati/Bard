import { useEffect, useState } from 'react'
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
  useEffect(() => {
    let active = true
    socialApi.bookmarks({ limit: 12 })
      .then(result => {
        if (!active) return
        setItems(result.data.items || [])
        setCursor(result.data.nextCursor || null)
        setError('')
      })
      .catch(err => { if (active) setError(err.message || 'Could not load saved stories.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  async function loadMore() {
    if (!cursor || busy) return
    setBusy(true)
    try {
      const result = await socialApi.bookmarks({ limit: 12, cursor })
      setItems(current => [...current, ...(result.data.items || [])])
      setCursor(result.data.nextCursor || null)
    } catch (err) { setError(err.message || 'Could not load more saved stories.') }
    finally { setBusy(false) }
  }

  return <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '2rem 1.5rem 5rem' }}><div style={{ maxWidth: 896, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}><div><p style={{ textTransform: 'uppercase', letterSpacing: '.15em', color: '#6B7280', fontSize: '.75rem' }}>Private shelf</p><h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Saved Stories</h1></div><Link to="/blogs" style={{ color: '#000', textDecoration: 'underline', textUnderlineOffset: 4 }}>Explore stories →</Link></div>
    {loading && <p role="status" style={{ textAlign: 'center', padding: '2rem 0', color: '#6B7280' }}>Loading saved stories…</p>}{error && <p role="alert" style={{ textAlign: 'center', padding: '1rem', color: '#B91C1C' }}>{error} <button type="button" onClick={() => { setLoading(true); setRetry(n => n + 1) }}>Retry</button></p>}
    {!loading && !error && !items.length && <p style={{ background: '#EAE2D8', padding: '2rem', color: '#6B7280' }}>Your saved stories will appear here. <Link to="/blogs" style={{ color: '#000', fontWeight: 700 }}>Explore stories</Link></p>}
    {!!items.length && <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#EAE2D8', padding: '1.5rem 2rem', borderRadius: 2 }}>{items.map(item => <BlogCard key={item.id} post={item} layout="row" onChange={updated => { if (updated.bookmarked === false) setItems(current => current.filter(post => post.id !== updated.id)) }} />)}</div>}
    {cursor && <div style={{ textAlign: 'center', marginTop: '1.5rem' }}><button className="topic-clear" type="button" disabled={busy} onClick={loadMore}>{busy ? 'Loading…' : 'Load more'}</button></div>}
  </div></main>
}
