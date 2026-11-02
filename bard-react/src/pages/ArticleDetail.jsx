import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { blogs as blogsApi, comments as commentsApi, social as socialApi } from '../api'
import { useAuth } from '../context/authState'

export default function ArticleDetail({ byId = false }) {
  const params = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [blog, setBlog] = useState(null)
  const [comments, setComments] = useState([])
  const [commentsCursor, setCommentsCursor] = useState(null)
  const [commentsLoadingMore, setCommentsLoadingMore] = useState(false)
  const [related, setRelated] = useState([])
  const [loadedRequest, setLoadedRequest] = useState(null)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState('')
  const [body, setBody] = useState('')
  const [parentId, setParentId] = useState(null)
  const [shareMessage, setShareMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const requestKey = `${byId ? params.id : params.slug}:${retry}`
  const loading = loadedRequest !== requestKey
  const returnTo = typeof location.state?.from === 'string' && location.state.from.startsWith('/') ? location.state.from : '/blogs'

  useEffect(() => {
    let active = true
    const load = byId ? blogsApi.getById(params.id) : blogsApi.get(params.slug)
    load.then(async result => {
      if (!active) return
      setError('')
      const article = result?.data?.blog
      setBlog(article)
      const [commentsResult, relatedResult] = await Promise.all([
        commentsApi.list(article.id, { limit: 20 }),
        article.status === 'published' ? blogsApi.related(article.id).catch(() => ({ data: { items: [] } })) : Promise.resolve({ data: { items: [] } }),
      ])
      if (active) {
        setComments(commentsResult?.data?.items || [])
        setCommentsCursor(commentsResult?.data?.nextCursor || null)
        setRelated(relatedResult?.data?.items || [])
      }
    }).catch(err => {
      if (active) setError(err.status === 404 ? 'This story could not be found or is not available.' : err.message || 'Could not load this story. Please try again.')
    }).finally(() => { if (active) setLoadedRequest(requestKey) })
    return () => { active = false }
  }, [byId, params.id, params.slug, retry, requestKey])

  const canComment = Boolean(user?.emailVerified && blog?.commentsEnabled && blog?.status === 'published')
  const visibleComments = useMemo(() => comments.filter(comment => comment.status !== 'hidden'), [comments])

  async function loadMoreComments() {
    if (!commentsCursor || commentsLoadingMore) return
    setCommentsLoadingMore(true)
    setActionError('')
    try {
      const result = await commentsApi.list(blog.id, { limit: 20, cursor: commentsCursor })
      setComments(current => [...current, ...(result?.data?.items || [])])
      setCommentsCursor(result?.data?.nextCursor || null)
    } catch (err) {
      setActionError(err.message || 'Could not load more comments.')
    } finally {
      setCommentsLoadingMore(false)
    }
  }

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
      setComments(current => [...current, result.data.comment].sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt)))
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

  if (loading) return <div className="post-overlay open"><div className="overlay-scroll" role="status">Loading story…</div></div>
  if (error) return <div className="post-overlay open"><div className="overlay-scroll"><button className="overlay-close" type="button" onClick={() => navigate(returnTo)}>← Back to posts</button><p role="alert" style={{ margin: '2rem 0', color: '#6B7280' }}>{error}</p><button className="ov-comment-submit" type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></div></div>
  if (!blog) return null

  return (
    <div className="post-overlay open" onKeyDown={event => event.key === 'Escape' && navigate(returnTo)}>
      <div className="overlay-side overlay-bg-left" style={{ backgroundImage: blog.coverImageUrl ? `url('${blog.coverImageUrl}')` : undefined }} />
      <div className="overlay-side overlay-bg-right" style={{ backgroundImage: blog.coverImageUrl ? `url('${blog.coverImageUrl}')` : undefined }} />
      <article className="overlay-scroll">
        <button className="overlay-close" type="button" onClick={() => navigate(returnTo)}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to posts
        </button>

        <div className="ov-author-row">
          {blog.author?.avatarUrl ? <img className="ov-avatar" src={blog.author.avatarUrl} alt="" /> : <span className="ov-avatar" aria-hidden="true" style={{ background: '#EAE2D8', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{(blog.author?.displayName || blog.author?.username || 'B').slice(0, 1).toUpperCase()}</span>}
          <div>
            {blog.author?.username ? <Link className="ov-author-name" to={`/u/${encodeURIComponent(blog.author.username)}`} style={{ color: '#000', textDecoration: 'none' }}>{blog.author.displayName || blog.author.username}</Link> : <p className="ov-author-name">BARD writer</p>}
            <p className="ov-meta">{blog.publishedAt ? new Date(blog.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : blog.status}<span className="ov-dot">·</span>{blog.readingTimeMinutes || 1} min read</p>
          </div>
        </div>

        {blog.status !== 'published' && <p style={{ display: 'inline-block', background: '#EAE2D8', padding: '.35rem .65rem', marginBottom: '1rem', fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.1em' }}>{blog.status} · only you and permitted administrators can view this</p>}
        <h1 className="ov-title">{blog.title}</h1>
        {blog.excerpt && <p style={{ fontSize: '.95rem', color: '#5E5A54', lineHeight: 1.7, marginBottom: '1.5rem' }}>{blog.excerpt}</p>}
        {blog.coverImageUrl && <div className="ov-hero" style={{ backgroundImage: `url('${blog.coverImageUrl}')` }} />}
        {!!blog.tags?.length && <div style={{ marginBottom: '1.75rem' }}>{blog.tags.map(tag => <Link key={tag} to={`/blogs?topic=${encodeURIComponent(tag)}`} className="topic-tag" style={{ color: '#000', textDecoration: 'none' }}>{tag}</Link>)}</div>}
        <article className="ov-body" dangerouslySetInnerHTML={{ __html: blog.html || '<p></p>' }} />

        <section className="ov-stats-row" aria-label="Story actions">
          <div className="ov-stats"><span>{blog.likeCount || 0} likes</span><span>{blog.commentCount || 0} comments</span></div>
          <div className="ov-share">
            <button className="ov-share-btn like-btn" type="button" onClick={toggleLike} disabled={busy !== ''} aria-pressed={Boolean(blog.liked)} aria-label={blog.liked ? 'Unlike story' : 'Like story'}>{blog.liked ? '♥' : '♡'}</button>
            <button className="ov-share-btn" type="button" onClick={toggleBookmark} disabled={busy !== ''} aria-pressed={Boolean(blog.bookmarked)} aria-label={blog.bookmarked ? 'Remove bookmark' : 'Bookmark story'}>{blog.bookmarked ? 'Saved' : 'Save'}</button>
            <button className="ov-share-btn" type="button" onClick={share} aria-label="Share story">Share</button>
          </div>
        </section>
        {shareMessage && <p role="status" style={{ marginTop: '.5rem', color: '#6B7280', fontSize: '.8rem' }}>{shareMessage}</p>}
        {actionError && <p role="alert" style={{ color: '#B91C1C', marginTop: '.5rem' }}>{actionError}</p>}

        <section id="comments" className="ov-comments">
          <h2 className="ov-section-title" style={{ marginBottom: '.5rem' }}>{visibleComments.length} Comments</h2>
        {canComment ? (
          <form onSubmit={submitComment} className="ov-comment-input-wrap">
            {parentId && <p style={{ flexBasis: '100%', fontSize: '.78rem', color: '#6B7280' }}>Replying to a comment <button type="button" className="ov-comment-action-btn" onClick={() => setParentId(null)}>Cancel reply</button></p>}
            <textarea className="ov-comment-input" aria-label="Comment" value={body} onChange={event => setBody(event.target.value)} maxLength={2000} required rows={2} placeholder="Add a thoughtful comment…" />
            <button className="ov-comment-submit" type="submit" disabled={busy !== '' || !body.trim()}>{busy === 'comment' ? 'Posting…' : 'Post'}</button>
          </form>
        ) : <p>{user ? (user.emailVerified ? 'Comments are closed for this story.' : 'Verify your email before commenting.') : <Link to="/login" state={{ from: location.pathname }}>Log in to comment</Link>}</p>}
        <div style={{ marginTop: '1.5rem' }}>
          {visibleComments.map(comment => {
            const isOwner = user && (String(user.id) === String(comment.author?.id) || user.role === 'admin')
            return <article key={comment.id} className="ov-comment" style={{ marginLeft: comment.parentId ? '1.5rem' : 0 }}>
              {comment.author?.avatarUrl ? <img className="ov-comment-avatar" src={comment.author.avatarUrl} alt="" /> : <span className="ov-comment-avatar" aria-hidden="true" style={{ background: '#EAE2D8', display: 'grid', placeItems: 'center', fontSize: '.7rem' }}>{(comment.author?.displayName || comment.author?.username || 'B').slice(0, 1).toUpperCase()}</span>}
              <div className="ov-comment-body">
                <div className="ov-comment-header"><span className="ov-comment-name">{comment.author?.displayName || comment.author?.username || 'Member'}</span><time className="ov-comment-date">{new Date(comment.createdAt).toLocaleDateString()}</time></div>
                <p className="ov-comment-text">{comment.status === 'deleted' ? 'Comment removed.' : comment.body}</p>
                <div className="ov-comment-actions">
                  {comment.status !== 'deleted' && user?.emailVerified && <button type="button" className="ov-comment-action-btn" onClick={() => { setParentId(comment.id); document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' }) }}>Reply</button>}
                  {comment.status !== 'deleted' && isOwner && <button type="button" className="ov-comment-action-btn" disabled={busy !== ''} onClick={() => deleteComment(comment.id)}>{busy === `delete:${comment.id}` ? 'Removing…' : 'Delete'}</button>}
                </div>
              </div>
            </article>
          })}
          {!visibleComments.length && <p>No comments yet.</p>}
          {commentsCursor && <button type="button" className="ov-comment-submit" onClick={loadMoreComments} disabled={commentsLoadingMore}>{commentsLoadingMore ? 'Loading…' : 'Load more comments'}</button>}
        </div>
      </section>
      {!!related.length && <section className="ov-recent"><div className="ov-recent-header"><h2 className="ov-section-title">Related Stories</h2><Link to="/blogs" className="ov-see-all">See all →</Link></div><div className="ov-recent-grid">{related.map(item => <Link key={item.id} to={item.status === 'draft' ? `/article/id/${item.id}` : `/article/${encodeURIComponent(item.slug)}`} className="ov-recent-card" style={{ color: 'inherit', textDecoration: 'none' }}>{item.coverImageUrl ? <img className="ov-recent-img" src={item.coverImageUrl} alt="" /> : <div className="ov-recent-img" style={{ background: '#5C7A6E', display: 'grid', placeItems: 'center', color: '#fff' }}>BARD</div>}<p className="ov-recent-title">{item.title}</p><p className="ov-recent-meta">{item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : ''} · {item.readingTimeMinutes || 1} min read</p></Link>)}</div></section>}
      </article>
    </div>
  )
}
