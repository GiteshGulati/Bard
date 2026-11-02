import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { blogs as blogsApi, comments as commentsApi, social as socialApi } from '../api'
import BlogCard from '../components/BlogCard'
import { useAuth } from '../context/AuthContext'

export default function ArticleDetail({ byId = false }) {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [blog, setBlog] = useState(null)
  const [comments, setComments] = useState([])
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState('')
  const [body, setBody] = useState('')
  const [parentId, setParentId] = useState(null)
  const [shareMessage, setShareMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const returnTo = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : '/blogs'

  useEffect(() => {
    let active = true
    setLoading(true); setError(''); setBlog(null); setComments([]); setRelated([])
    const load = byId ? blogsApi.getById(params.id) : blogsApi.get(params.slug)
    load.then(async result => {
      if (!active) return
      const article = result?.data?.blog
      setBlog(article)
      const [commentsResult, relatedResult] = await Promise.all([
        commentsApi.list(article.id),
        article.status === 'published' ? blogsApi.related(article.id).catch(() => ({ data: { items: [] } })) : Promise.resolve({ data: { items: [] } }),
      ])
      if (active) { setComments(commentsResult?.data?.items || []); setRelated(relatedResult?.data?.items || []) }
    }).catch(err => {
      if (active) setError(err.status === 404 ? 'This story could not be found or is not available.' : err.message || 'Could not load this story. Please try again.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [byId, params.id, params.slug, retry])

  const canComment = Boolean(user?.emailVerified && blog?.commentsEnabled && blog?.status === 'published')
  const visibleComments = useMemo(() => comments.filter(comment => comment.status !== 'hidden'), [comments])

  async function toggleLike() {
    if (!user) return navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
    setBusy('like'); setActionError('')
    try {
      const result = blog.liked ? await blogsApi.unlike(blog.id) : await blogsApi.like(blog.id)
      setBlog(current => ({ ...current, liked: result.data.liked, likeCount: result.data.likeCount }))
    } catch (err) { setActionError(err.message || 'Could not update your like.') }
    finally { setBusy('') }
  }

  async function toggleBookmark() {
    if (!user) return navigate('/login', { state: { from: `${location.pathname}${location.search}` } })
    setBusy('bookmark'); setActionError('')
    try {
      const next = !blog.bookmarked
      if (next) await socialApi.addBookmark(blog.id)
      else await socialApi.removeBookmark(blog.id)
      setBlog(current => ({ ...current, bookmarked: next }))
    } catch (err) { setActionError(err.message || 'Could not update your bookmark.') }
    finally { setBusy('') }
  }

  async function submitComment(event) {
    event.preventDefault()
    if (!body.trim()) return
    setBusy('comment'); setActionError('')
    try {
      const result = await commentsApi.create(blog.id, { body: body.trim(), ...(parentId ? { parentId } : {}) })
      setComments(current => [...current, result.data.comment])
      setBlog(current => ({ ...current, commentCount: (current.commentCount || 0) + 1 }))
      setBody(''); setParentId(null)
    } catch (err) { setActionError(err.message || 'Could not publish your comment.') }
    finally { setBusy('') }
  }

  async function deleteComment(commentId) {
    setBusy(`delete:${commentId}`); setActionError('')
    try {
      await commentsApi.delete(commentId)
      setComments(current => current.map(comment => comment.id === commentId ? { ...comment, status: 'deleted', body: '' } : comment))
      setBlog(current => ({ ...current, commentCount: Math.max(0, (current.commentCount || 0) - 1) }))
    } catch (err) { setActionError(err.message || 'Could not remove the comment.') }
    finally { setBusy('') }
  }

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: blog.title, url })
      else { await navigator.clipboard.writeText(url); setShareMessage('Story link copied.') }
    } catch (err) {
      if (err.name !== 'AbortError') setShareMessage('Could not share this link from this browser.')
    }
  }

  if (loading) return <main role="status" style={{ maxWidth: 850, margin: '4rem auto', padding: '1.5rem' }}>Loading story…</main>
  if (error) return <main style={{ maxWidth: 850, margin: '4rem auto', padding: '1.5rem' }}><p role="alert">{error}</p><button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button><button type="button" onClick={() => navigate(returnTo)}>Back to stories</button></main>
  if (!blog) return null

  return (
    <main style={{ maxWidth: 850, margin: '0 auto', padding: '2rem 1.5rem 5rem', background: '#F2EBE1', minHeight: '100vh' }}>
      <button type="button" onClick={() => navigate(returnTo)} style={{ marginBottom: '2rem' }}>← Back to stories</button>
      {blog.coverImageUrl && <img src={blog.coverImageUrl} alt="" style={{ width: '100%', maxHeight: 460, objectFit: 'cover', marginBottom: '2rem' }} />}
      <p style={{ textTransform: 'uppercase', letterSpacing: '.12em', color: '#6B7280', fontSize: '.75rem' }}>{blog.status === 'published' ? 'Published' : `${blog.status} · only you and permitted administrators can view this`}</p>
      <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.05, margin: '1rem 0' }}>{blog.title}</h1>
      {blog.excerpt && <p style={{ fontSize: '1.1rem', color: '#5E5A54', lineHeight: 1.7 }}>{blog.excerpt}</p>}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', margin: '1.5rem 0', color: '#6B7280' }}>
        {blog.author?.username && <Link to={`/u/${encodeURIComponent(blog.author.username)}`} style={{ color: 'inherit', fontWeight: 700 }}>{blog.author.displayName || blog.author.username}</Link>}
        {blog.publishedAt && <time dateTime={blog.publishedAt}>{new Date(blog.publishedAt).toLocaleDateString()}</time>}
        <span>{blog.readingTimeMinutes || 1} min read</span>
      </div>
      {!!blog.tags?.length && <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>{blog.tags.map(tag => <Link key={tag} to={`/blogs?topic=${encodeURIComponent(tag)}`} style={{ padding: '.35rem .65rem', background: '#EAE2D8', color: '#51483F' }}>{tag}</Link>)}</div>}
      <article className="ov-body" style={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: blog.html || '<p></p>' }} />
      <section aria-label="Story actions" style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid #D6CEC4', borderBottom: '1px solid #D6CEC4', padding: '1rem 0', margin: '2rem 0' }}>
        <button type="button" onClick={toggleLike} disabled={busy !== ''} aria-pressed={Boolean(blog.liked)}>{blog.liked ? '♥ Liked' : '♡ Like'} · {blog.likeCount || 0}</button>
        <button type="button" onClick={toggleBookmark} disabled={busy !== ''} aria-pressed={Boolean(blog.bookmarked)}>{blog.bookmarked ? 'Saved' : 'Bookmark'}</button>
        <button type="button" onClick={share}>Share</button>
        <span>{blog.commentCount || 0} comments</span>
      </section>
      {shareMessage && <p role="status">{shareMessage}</p>}
      {actionError && <p role="alert" style={{ color: '#B91C1C' }}>{actionError}</p>}
      <section id="comments" style={{ marginTop: '3rem' }}>
        <h2 className="font-display" style={{ fontSize: '1.8rem' }}>Conversation ({visibleComments.length})</h2>
        {canComment ? (
          <form onSubmit={submitComment} style={{ margin: '1.25rem 0', display: 'grid', gap: '.75rem' }}>
            {parentId && <p>Replying to a comment <button type="button" onClick={() => setParentId(null)}>Cancel reply</button></p>}
            <textarea aria-label="Comment" value={body} onChange={event => setBody(event.target.value)} maxLength={2000} required rows={3} placeholder="Add a thoughtful comment…" />
            <button type="submit" disabled={busy !== '' || !body.trim()}>{busy === 'comment' ? 'Posting…' : 'Post comment'}</button>
          </form>
        ) : <p>{user ? (user.emailVerified ? 'Comments are closed for this story.' : 'Verify your email before commenting.') : <Link to="/login" state={{ from: location.pathname }}>Log in to comment</Link>}</p>}
        <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
          {visibleComments.map(comment => {
            const isOwner = user && (String(user.id) === String(comment.author?.id) || user.role === 'admin')
            return <article key={comment.id} style={{ padding: '1rem', background: '#EAE2D8', marginLeft: comment.parentId ? '1.5rem' : 0 }}>
              <p><strong>{comment.author?.displayName || comment.author?.username || 'Member'}</strong> <time>{new Date(comment.createdAt).toLocaleString()}</time></p>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: '.5rem' }}>{comment.status === 'deleted' ? 'Comment removed.' : comment.body}</p>
              {comment.status !== 'deleted' && user?.emailVerified && <button type="button" onClick={() => { setParentId(comment.id); document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' }) }}>Reply</button>}
              {comment.status !== 'deleted' && isOwner && <button type="button" disabled={busy !== ''} onClick={() => deleteComment(comment.id)}>{busy === `delete:${comment.id}` ? 'Removing…' : 'Delete'}</button>}
            </article>
          })}
          {!visibleComments.length && <p>No comments yet.</p>}
        </div>
      </section>
      {!!related.length && <section style={{ marginTop: '3rem' }}><h2 className="font-display" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Related stories</h2><div style={{ display: 'grid', gap: '1rem' }}>{related.map(item => <BlogCard key={item.id} post={item} />)}</div></section>}
    </main>
  )
}
