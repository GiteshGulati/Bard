import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { TOPICS } from '../data'
import { blogs as blogsApi } from '../api'
import BlogCard from '../components/BlogCard'

export default function Blogs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const topic = searchParams.get('topic') || ''
  const initialQuery = searchParams.get('q') || ''
  const [queryDraft, setQueryDraft] = useState({ source: initialQuery, value: initialQuery })
  const query = queryDraft.source === initialQuery ? queryDraft.value : initialQuery
  const [posts, setPosts] = useState([])
  const [cursor, setCursor] = useState(null)
  const [loadedRequest, setLoadedRequest] = useState(null)
  const [moreLoading, setMoreLoading] = useState(false)
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [searchState, setSearchState] = useState({ source: initialQuery, value: Boolean(initialQuery) })
  const searchOpen = searchState.source === initialQuery ? searchState.value : Boolean(initialQuery)
  const requestKey = `${initialQuery}\u0000${topic}\u0000${retryKey}`
  const loading = loadedRequest !== requestKey
  const searchRef = useRef(null)
  const topicLabel = TOPICS.find(item => item.id === topic)?.label || topic

  useEffect(() => {
    let active = true
    const request = initialQuery.trim()
      ? blogsApi.search({ q: initialQuery.trim(), ...(topic ? { tag: topic } : {}), limit: 12 })
      : blogsApi.list({ ...(topic ? { tag: topic } : {}), limit: 12 })
    request.then(result => {
      if (!active) return
      setError('')
      setPosts(result?.data?.items || [])
      setCursor(result?.data?.nextCursor || null)
    }).catch(err => { if (active) setError(err.message || 'Could not load stories.') })
      .finally(() => { if (active) setLoadedRequest(requestKey) })
    return () => { active = false }
  }, [initialQuery, topic, retryKey, requestKey])

  const toggleSearch = useCallback(() => {
    if (searchOpen) {
      setSearchState({ source: initialQuery, value: false })
      setQueryDraft({ source: initialQuery, value: '' })
      setSearchParams(topic ? { topic } : {})
      return
    }
    setSearchState({ source: initialQuery, value: true })
    window.setTimeout(() => searchRef.current?.focus(), 50)
  }, [initialQuery, searchOpen, setSearchParams, topic])

  function submitSearch(event) {
    event.preventDefault()
    const next = {}
    if (query.trim()) next.q = query.trim()
    if (topic) next.topic = topic
    setSearchParams(next)
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
    <div style={{ background: '#F2EBE1', minHeight: '100vh' }}>
      <main style={{ maxWidth: 896, margin: '0 auto', padding: '2rem 1.5rem 5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>All Posts</h1>
          <form onSubmit={submitSearch} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <input
              ref={searchRef}
              type="search"
              placeholder="Search posts..."
              aria-label="Search blog posts"
              value={query}
              onChange={event => setQueryDraft({ source: initialQuery, value: event.target.value })}
              onKeyDown={event => event.key === 'Escape' && toggleSearch()}
              className={`search-input${searchOpen ? ' open' : ''}`}
              tabIndex={searchOpen ? 0 : -1}
            />
            {searchOpen && <button type="submit" aria-label="Search stories" style={{ background: 'none', border: 0, borderBottom: '1px solid #000', cursor: 'pointer', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', padding: '.4rem 0' }}>Search</button>}
            <button type="button" onClick={toggleSearch} aria-label={searchOpen ? 'Close search' : 'Open search'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', transition: 'color 0.2s' }}>
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </form>
        </div>

        <div style={{ background: '#EAE2D8', padding: '2rem', borderRadius: 2 }}>
          {topic && (
            <div className="topic-banner active">
              <div>
                <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', opacity: .6, marginBottom: 2 }}>Filtered by topic</p>
                <p className="font-display" style={{ fontSize: '1.125rem', textTransform: 'uppercase', transform: 'scaleX(1.06)', transformOrigin: 'left', display: 'inline-block' }}>{topicLabel}</p>
              </div>
              <button className="topic-clear" type="button" onClick={() => setSearchParams(initialQuery ? { q: initialQuery } : {})}>× Clear filter</button>
            </div>
          )}

          {loading && <p role="status" style={{ textAlign: 'center', padding: '2rem 0', fontSize: '.9rem', color: '#6B7280' }}>Loading posts…</p>}
          {!loading && error && <div role="alert" style={{ textAlign: 'center', padding: '2rem 0', color: '#6B7280' }}>{error} <button type="button" onClick={() => setRetryKey(key => key + 1)}>Retry</button></div>}
          {!loading && !error && posts.length === 0 && <p style={{ textAlign: 'center', padding: '3rem 0', fontSize: '.9rem', color: '#6B7280' }}>No posts match your search.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {!loading && posts.map(post => <BlogCard key={post.id} post={post} onChange={updated => setPosts(current => current.map(item => item.id === updated.id ? { ...item, ...updated } : item))} />)}
          </div>
          {!loading && cursor && <div style={{ textAlign: 'center', marginTop: '2rem' }}><button type="button" className="topic-clear" style={{ background: '#000' }} disabled={moreLoading} onClick={loadMore}>{moreLoading ? 'Loading…' : 'Load more posts'}</button></div>}
        </div>
      </main>
    </div>
  )
}
