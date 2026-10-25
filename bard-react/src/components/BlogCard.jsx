import { useState, useRef, useCallback } from 'react'

export default function BlogCard({ post, onOpen }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const articleRef = useRef(null)

  const toggleLike = useCallback((e) => {
    e.stopPropagation()
    setLiked(l => {
      setLikeCount(c => l ? c - 1 : c + 1)
      return !l
    })
  }, [])

  const handleMouseMove = useCallback((e) => {
    const el = articleRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const cx = rect.width / 2
    const cy = rect.height / 2
    const rotX = ((y - cy) / cy) * -3
    const rotY = ((x - cx) / cx) * 3
    el.style.transform = `translateY(-8px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
    el.style.transition = 'transform 0.1s ease'
  }, [])

  const handleMouseLeave = useCallback(() => {
    const el = articleRef.current
    if (!el) return
    el.style.transform = ''
    el.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  }, [])

  return (
    <div
      className="blog-card"
      data-title={post.title.toLowerCase()}
      data-tags={post.tags}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <article
        ref={articleRef}
        onClick={() => onOpen(post)}
        style={{ background: '#FDFCFB', display: 'flex', flexDirection: 'column', height: 400, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        {/* Image half */}
        <div style={{ width: '100%', height: '100%', background: post.color, position: 'relative', overflow: 'hidden', flex: '0 0 45%', display: 'flex' }}>
          <span className="read-badge">{post.read}</span>
          <img
            className="card-img"
            src={post.img}
            alt={post.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.75 }}
          />
          {post.overlay && post.overlay.length > 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '2rem', color: '#fff', fontFamily: 'var(--font-display)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '1rem', paddingLeft: '1rem', paddingRight: '1rem' }}>
              {post.overlay.map((line, i) => <p key={i}>{line}</p>)}
            </div>
          )}
        </div>

        {/* Content half */}
        <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
          <div>
            {/* Author */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <img src={post.avatarSm} alt={post.author} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <div style={{ fontSize: '0.75rem', color: '#757575' }}>
                  <p style={{ fontWeight: 500, color: '#1a1a1a' }}>{post.author}</p>
                  <p>{post.date} · {post.read}</p>
                </div>
              </div>
            </div>
            {/* Title */}
            <h2 className="font-display" style={{ fontSize: 'clamp(1.25rem, 2vw, 1.75rem)', textTransform: 'uppercase', lineHeight: 1.15, marginBottom: '1rem', color: '#2A2A2A', transform: 'scaleX(1.04)', transformOrigin: 'left' }}>
              {post.title}
            </h2>
            <p style={{ color: '#757575', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {post.excerpt}
            </p>
          </div>

          {/* Stats */}
          <div>
            <div style={{ height: 1, background: '#E0DCD6', marginBottom: '1rem' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#757575' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span>{post.stats.views}</span>
                <span>{post.stats.comments} comments</span>
              </div>
              <button className={`like-btn${liked ? ' liked' : ''}`} onClick={toggleLike} aria-label="Like post">
                <span>{likeCount}</span>
                <svg className="h-4 w-4" style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
