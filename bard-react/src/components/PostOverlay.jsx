import { useState, useRef, useCallback } from 'react'

export default function PostOverlay({ post, allPosts, onClose, onOpenPost }) {
  const [comments, setComments] = useState(post ? [...post.comments] : [])
  const [commentText, setCommentText] = useState('')
  const [likedComments, setLikedComments] = useState({})

  const scrollRef = useRef(null)

  const handleCommentSubmit = useCallback(() => {
    const text = commentText.trim()
    if (!text) return
    const newComment = { name: 'You', avatar: 'https://i.pravatar.cc/40?img=1', date: 'Just now', text, likes: 0 }
    setComments(prev => [newComment, ...prev])
    setCommentText('')
  }, [commentText])

  const toggleCommentLike = useCallback((index) => {
    setLikedComments(prev => ({ ...prev, [index]: !prev[index] }))
  }, [])

  if (!post) return null

  const others = allPosts.filter(p => p.id !== post.id)

  return (
    <div
      className={`post-overlay${post ? ' open' : ''}`}
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      {/* Blurred side panels */}
      <div className="overlay-side overlay-bg-left" style={{ backgroundImage: `url('${post.img}')` }} />
      <div className="overlay-side overlay-bg-right" style={{ backgroundImage: `url('${post.img}')` }} />

      {/* Scrollable center */}
      <div className="overlay-scroll" ref={scrollRef}>
        {/* Back */}
        <button className="overlay-close" onClick={onClose}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back to posts
        </button>

        {/* Author row */}
        <div className="ov-author-row">
          <img className="ov-avatar" src={post.avatar} alt={post.author} />
          <div>
            <p className="ov-author-name">{post.author}</p>
            <p className="ov-meta">
              {post.date}<span className="ov-dot">·</span>{post.read}
            </p>
          </div>
        </div>

        {/* Title */}
        <h1 className="ov-title">{post.title}</h1>

        {/* Hero */}
        <div className="ov-hero" style={{ backgroundImage: `url('${post.img}')` }} />

        {/* Body */}
        <div className="ov-body" dangerouslySetInnerHTML={{ __html: post.body }} />

        {/* Stats */}
        <div className="ov-stats-row">
          <div className="ov-stats">
            <span>{post.views}</span>
            <span>{post.comments.length} comments</span>
          </div>
          <div className="ov-share">
            <button className="ov-share-btn" aria-label="Share on Twitter">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </button>
            <button className="ov-share-btn" aria-label="Share link" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
            </button>
          </div>
        </div>

        {/* Recent posts */}
        {others.length > 0 && (
          <div className="ov-recent">
            <div className="ov-recent-header">
              <span className="ov-section-title">More Posts</span>
              <a href="/blogs" className="ov-see-all">See all →</a>
            </div>
            <div className="ov-recent-grid">
              {others.map(p => (
                <div key={p.id} className="ov-recent-card" onClick={() => { onOpenPost(p); scrollRef.current?.scrollTo(0, 0) }}>
                  <img className="ov-recent-img" src={p.img} alt={p.title} />
                  <p className="ov-recent-title">{p.title}</p>
                  <p className="ov-recent-meta">{p.date} · {p.read}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div className="ov-comments">
          <p className="ov-section-title" style={{ marginBottom: '0.5rem' }}>{comments.length} Comments</p>

          <div className="ov-comment-input-wrap">
            <textarea
              className="ov-comment-input"
              rows={2}
              placeholder="Add a comment…"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleCommentSubmit())}
            />
            <button className="ov-comment-submit" onClick={handleCommentSubmit}>Post</button>
          </div>

          <div className="ov-sort-row">
            Sort by: <select className="ov-sort-select" defaultValue="top"><option value="top">Top</option><option value="newest">Newest</option></select>
          </div>

          {comments.map((c, i) => (
            <div key={i} className="ov-comment">
              <img className="ov-comment-avatar" src={c.avatar} alt={c.name} />
              <div className="ov-comment-body">
                <div className="ov-comment-header">
                  <span className="ov-comment-name">{c.name}</span>
                  <span className="ov-comment-date">{c.date}</span>
                </div>
                <p className="ov-comment-text">{c.text}</p>
                <div className="ov-comment-actions">
                  <button
                    className={`ov-comment-action-btn${likedComments[i] ? ' liked' : ''}`}
                    onClick={() => toggleCommentLike(i)}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                    </svg>
                    <span>{likedComments[i] ? c.likes + 1 : c.likes}</span>
                  </button>
                  <button className="ov-comment-action-btn">
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
