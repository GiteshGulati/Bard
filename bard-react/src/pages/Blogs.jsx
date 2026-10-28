import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { POSTS } from '../data'
import BlogCard from '../components/BlogCard'
import PostOverlay from '../components/PostOverlay'
import { blogs as blogsApi } from '../api'

// Map a server blog object to the shape expected by BlogCard / PostOverlay
function mapBlog(b) {
  return {
    id: b.id,
    slug: b.slug,
    title: b.title || 'Untitled',
    author: b.author?.displayName || b.author?.username || 'Anonymous',
    avatar: b.author?.avatarUrl || `https://i.pravatar.cc/64?u=${b.author?.id || 0}`,
    avatarSm: b.author?.avatarUrl || `https://i.pravatar.cc/32?u=${b.author?.id || 0}`,
    date: b.publishedAt ? new Date(b.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
    read: `${b.readingTimeMinutes || 1} min read`,
    views: `${b.likeCount || 0} likes`,
    img: b.coverImageUrl || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=900&auto=format&fit=crop',
    color: '#5C7A6E',
    tags: (b.tags || []).join(' '),
    tagLabel: (b.tags || [])[0] || '',
    excerpt: b.excerpt || '',
    overlay: [],
    body: b.html || '',
    stats: { views: `${b.likeCount || 0} likes`, comments: b.commentCount || 0 },
    likes: b.likeCount || 0,
    liked: b.liked || false,
    bookmarked: b.bookmarked || false,
    comments: [],
    isApiPost: true,
  }
}

export default function Blogs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const topicParam = searchParams.get('topic') || ''

  const [apiPosts, setApiPosts] = useState([])
  const [apiLoading, setApiLoading] = useState(true)
  const [activeTopic, setActiveTopic] = useState(topicParam)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [openPost, setOpenPost] = useState(null)
  const searchRef = useRef(null)

  // Fetch blogs from API
  useEffect(() => {
    let cancelled = false
    setApiLoading(true)
    blogsApi.list({ limit: 50 })
      .then(res => {
        if (!cancelled) {
          const items = res?.data?.items || []
          setApiPosts(items.map(mapBlog))
        }
      })
      .catch(() => {
        // Fall back to static data silently
        if (!cancelled) setApiPosts([])
      })
      .finally(() => { if (!cancelled) setApiLoading(false) })
    return () => { cancelled = true }
  }, [])

  // Merge API + static posts (API takes precedence; static are fallback)
  const allPosts = apiPosts.length > 0 ? apiPosts : POSTS

  // Scroll progress bar
  useEffect(() => {
    const bar = document.createElement('div')
    bar.id = 'progress-bar'
    document.body.prepend(bar)
    const onScroll = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%'
    }
    window.addEventListener('scroll', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); bar.remove() }
  }, [])

  useEffect(() => {
    document.body.style.overflow = openPost ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [openPost])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpenPost(null) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { setActiveTopic(topicParam) }, [topicParam])

  const toggleSearch = useCallback(() => {
    setSearchOpen(s => {
      if (s) { setQuery('') }
      else { setTimeout(() => searchRef.current?.focus(), 50) }
      return !s
    })
  }, [])

  const filteredPosts = allPosts.filter(p => {
    const topicMatch = !activeTopic || p.tags.includes(activeTopic) || p.id === activeTopic
    const q = query.toLowerCase().trim()
    const searchMatch = !q || p.title.toLowerCase().includes(q) || p.tags.includes(q) || (p.tagLabel || '').toLowerCase().includes(q)
    return topicMatch && searchMatch
  })

  const topicLabel = activeTopic
    ? (POSTS.find(p => p.id === activeTopic)?.tagLabel || activeTopic.charAt(0).toUpperCase() + activeTopic.slice(1))
    : ''

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh' }}>
      <main style={{ maxWidth: 896, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>All Posts</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search posts..."
              aria-label="Search blog posts"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className={`search-input${searchOpen ? ' open' : ''}`}
              onKeyDown={e => e.key === 'Escape' && toggleSearch()}
            />
            <button onClick={toggleSearch} aria-label="Toggle search" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280', transition: 'color 0.2s' }}
              onMouseOver={e => e.currentTarget.style.color = '#000'} onMouseOut={e => e.currentTarget.style.color = '#6B7280'}
            >
              <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* Posts container */}
        <div style={{ background: '#EAE2D8', padding: '2rem', borderRadius: 2 }}>
          {activeTopic && (
            <div className="topic-banner active">
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 2 }}>Filtered by topic</p>
                <p className="font-display" style={{ fontSize: '1.125rem', textTransform: 'uppercase', transform: 'scaleX(1.06)', transformOrigin: 'left', display: 'inline-block' }}>{topicLabel}</p>
              </div>
              <button className="topic-clear" onClick={() => { setActiveTopic(''); setSearchParams({}) }}>× Clear filter</button>
            </div>
          )}

          {apiLoading && (
            <p style={{ textAlign: 'center', padding: '2rem 0', fontSize: '0.9rem', color: '#6B7280' }}>Loading posts…</p>
          )}

          {!apiLoading && filteredPosts.length === 0 && (
            <p style={{ textAlign: 'center', padding: '3rem 0', fontSize: '0.9rem', color: '#6B7280' }}>No posts match your search.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {filteredPosts.map(post => (
              <BlogCard key={post.id} post={post} onOpen={setOpenPost} />
            ))}
          </div>
        </div>
      </main>

      {/* Post overlay */}
      <PostOverlay
        post={openPost}
        allPosts={allPosts}
        onClose={() => setOpenPost(null)}
        onOpenPost={setOpenPost}
      />
    </div>
  )
}
