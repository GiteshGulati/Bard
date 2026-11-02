import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { social as socialApi } from '../api'

function notificationText(type) {
  return ({ follow: 'followed you', like: 'liked your story', comment: 'commented on your story', reply: 'replied to your comment' })[type] || 'interacted with your story'
}

export default function Notifications() {
  const [items, setItems] = useState([])
  const [cursor, setCursor] = useState(null)
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const load = useCallback(async (nextCursor = null, append = false) => {
    append ? setBusy(true) : setLoading(true)
    setError('')
    try {
      const result = await socialApi.notifications({ limit: 30, ...(nextCursor ? { cursor: nextCursor } : {}) })
      setItems(current => append ? [...current, ...(result.data.items || [])] : result.data.items || [])
      setCursor(result.data.nextCursor || null); setUnread(result.data.unreadCount || 0)
    } catch (err) { setError(err.message || 'Could not load notifications.') }
    finally { setLoading(false); setBusy(false) }
  }, [])
  useEffect(() => { load() }, [load, retry])

  async function markRead(item) {
    if (item.readAt) return
    setItems(current => current.map(value => value.id === item.id ? { ...value, readAt: new Date().toISOString() } : value))
    setUnread(value => Math.max(0, value - 1))
    try { await socialApi.readNotification(item.id) }
    catch (err) {
      setItems(current => current.map(value => value.id === item.id ? { ...value, readAt: null } : value))
      setUnread(value => value + 1); setError(err.message || 'Could not mark notification read.')
    }
  }

  async function markAllRead() {
    setBusy(true); setError('')
    try { await socialApi.readAllNotifications(); setItems(current => current.map(item => ({ ...item, readAt: item.readAt || new Date().toISOString() }))); setUnread(0) }
    catch (err) { setError(err.message || 'Could not mark notifications read.') }
    finally { setBusy(false) }
  }

  return <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '2.5rem 1.5rem' }}><div style={{ maxWidth: 850, margin: '0 auto' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}><div><p style={{ textTransform: 'uppercase', letterSpacing: '.15em', color: '#6B7280', fontSize: '.75rem' }}>Your inbox</p><h1 className="font-display" style={{ fontSize: '3rem' }}>Notifications</h1></div><button type="button" onClick={markAllRead} disabled={busy || !unread}>Mark all read</button></div>
    {loading && <p role="status">Loading notifications…</p>}{error && <p role="alert">{error} <button type="button" onClick={() => setRetry(n => n + 1)}>Retry</button></p>}
    {!loading && !error && !items.length && <p>You’re all caught up. New follows, comments and likes will show up here.</p>}
    <div style={{ display: 'grid', gap: '.75rem', marginTop: '1.5rem' }}>{items.map(item => {
      const destination = item.blog?.slug ? `/article/${encodeURIComponent(item.blog.slug)}` : item.actor?.username ? `/u/${encodeURIComponent(item.actor.username)}` : null
      return <article key={item.id} style={{ padding: '1rem', background: item.readAt ? '#EAE2D8' : '#fff', borderLeft: item.readAt ? '3px solid transparent' : '3px solid #111' }}>
        <p><Link to={item.actor?.username ? `/u/${encodeURIComponent(item.actor.username)}` : '#'} onClick={() => markRead(item)}>{item.actor?.displayName || 'A Bard member'}</Link> {notificationText(item.type)}</p>
        {item.blog?.title && destination && <p><Link to={destination} onClick={() => markRead(item)}>{item.blog.title}</Link></p>}
        <time style={{ color: '#6B7280', fontSize: '.8rem' }}>{new Date(item.createdAt).toLocaleString()}</time>
        {!item.readAt && <button type="button" onClick={() => markRead(item)} style={{ marginLeft: '1rem' }}>Mark read</button>}
      </article>
    })}</div>
    {cursor && <div style={{ textAlign: 'center', marginTop: '1.5rem' }}><button type="button" disabled={busy} onClick={() => load(cursor, true)}>{busy ? 'Loading…' : 'Load more'}</button></div>}
  </div></main>
}
