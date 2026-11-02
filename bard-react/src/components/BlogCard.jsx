import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { blogs as blogsApi, social as socialApi } from '../api'
import { useAuth } from '../context/AuthContext'

export function articlePath(blog) {
  return blog.status === 'draft' || blog.status === 'hidden'
    ? `/article/id/${blog.id}`
    : `/article/${encodeURIComponent(blog.slug)}`
}

export default function BlogCard({ post, onChange }) {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(Boolean(post.liked))
  const [bookmarked, setBookmarked] = useState(Boolean(post.bookmarked))
  const [likeCount, setLikeCount] = useState(post.likeCount || 0)
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const href = articlePath(post)
  const state = { from: `${location.pathname}${location.search}` }
  function openFromCard(event) {
    if (event.target.closest('a, button')) return
    navigate(href, { state })
  }

  useEffect(() => {
    setLiked(Boolean(post.liked))
    setBookmarked(Boolean(post.bookmarked))
    setLikeCount(post.likeCount || 0)
  }, [post.id, post.liked, post.bookmarked, post.likeCount])

  async function toggleLike(event) {
    event.stopPropagation()
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    setBusy('like'); setMessage('')
    try {
      const response = liked ? await blogsApi.unlike(post.id) : await blogsApi.like(post.id)
      setLiked(response.data.liked)
      setLikeCount(response.data.likeCount)
      onChange?.({ ...post, liked: response.data.liked, likeCount: response.data.likeCount })
    } catch (error) { setMessage(error.message || 'Could not update like.') }
    finally { setBusy('') }
  }

  async function toggleBookmark(event) {
    event.stopPropagation()
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    setBusy('bookmark'); setMessage('')
    try {
      const next = !bookmarked
      if (next) await socialApi.addBookmark(post.id)
      else await socialApi.removeBookmark(post.id)
      setBookmarked(next)
      onChange?.({ ...post, bookmarked: next })
    } catch (error) { setMessage(error.message || 'Could not update bookmark.') }
    finally { setBusy('') }
  }

  const publishedDate = post.publishedAt || post.updatedAt || post.createdAt
  return (
    <article className="blog-card" role="link" tabIndex={0} aria-label={`Open ${post.title}`} onClick={openFromCard} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); navigate(href, { state }) } }} style={{ background: '#FDFCFB', display: 'grid', gridTemplateColumns: 'minmax(180px, 34%) 1fr', minHeight: 260, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
      <Link to={href} state={state} aria-label={`Open ${post.title}`} style={{ display: 'block', background: '#EAE2D8', minHeight: 200 }}>
        {post.coverImageUrl ? <img src={post.coverImageUrl} alt="" style={{ width: '100%', height: '100%', minHeight: 200, objectFit: 'cover' }} /> : <div style={{ minHeight: 200, height: '100%', display: 'grid', placeItems: 'center', color: '#766D64' }}>BARD</div>}
      </Link>
      <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem' }}>
            {(post.tags || []).map(tag => <Link key={tag} to={`/blogs?topic=${encodeURIComponent(tag)}`} style={{ color: '#6B7280', fontSize: '.72rem', textTransform: 'uppercase' }}>{tag}</Link>)}
          </div>
          <Link to={href} state={state} style={{ color: 'inherit', textDecoration: 'none' }}><h2 className="font-display" style={{ fontSize: 'clamp(1.3rem, 2.4vw, 2rem)', lineHeight: 1.15 }}>{post.title}</h2></Link>
          <p style={{ color: '#6B7280', lineHeight: 1.6, marginTop: '.75rem' }}>{post.excerpt}</p>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontSize: '.8rem', color: '#6B7280', flexWrap: 'wrap' }}>
            {post.author?.username && <Link to={`/u/${encodeURIComponent(post.author.username)}`} state={state} style={{ color: 'inherit', fontWeight: 600 }}>{post.author.displayName || post.author.username}</Link>}
            <span>{publishedDate ? new Date(publishedDate).toLocaleDateString() : 'Draft'}</span>
            <span>{post.readingTimeMinutes || 1} min read</span>
          </div>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', marginTop: '.75rem' }}>
            <button type="button" onClick={toggleLike} disabled={busy !== ''} aria-pressed={liked} aria-label={liked ? 'Unlike story' : 'Like story'}>{liked ? '♥' : '♡'} {likeCount}</button>
            <Link to={href} state={state}>{post.commentCount || 0} comments</Link>
            {user && <button type="button" onClick={toggleBookmark} disabled={busy !== ''} aria-pressed={bookmarked}>{bookmarked ? 'Saved' : 'Save'}</button>}
          </div>
          {message && <p role="alert" style={{ color: '#B91C1C', marginTop: '.5rem', fontSize: '.8rem' }}>{message}</p>}
        </div>
      </div>
    </article>
  )
}
