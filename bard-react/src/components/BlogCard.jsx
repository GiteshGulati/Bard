import { Link, useLocation, useNavigate } from 'react-router-dom'
import { articlePath } from './articlePath'
import { useBlogCardActions } from './useBlogCardActions'
import ArticleCoverImage from './ArticleCoverImage'

function initials(author) {
  const name = author?.displayName || author?.username || 'B'
  return name.trim().slice(0, 1).toUpperCase()
}

function BlogCardContent({ post, onChange, layout = 'card' }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, liked, bookmarked, likeCount, busy, message, toggleLike, toggleBookmark } = useBlogCardActions({ post, onChange, location, navigate })
  const href = articlePath(post)
  const state = { from: `${location.pathname}${location.search}` }
  const authorName = post.author?.displayName || post.author?.username || 'BARD writer'
  const dateValue = post.publishedAt || post.updatedAt || post.createdAt
  const date = dateValue
    ? new Date(dateValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Draft'
  const readTime = `${post.readingTimeMinutes || 1} min read`

  function openFromCard(event) {
    if (event.target.closest('a, button')) return
    navigate(href, { state })
  }

  function handleKeyDown(event) {
    if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault()
      navigate(href, { state })
    }
  }

  function handleMouseMove(event) {
    const card = event.currentTarget.querySelector('article')
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -3
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 3
    card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    card.style.transition = 'transform 0.1s ease'
  }

  function resetCardTransform(event) {
    const card = event.currentTarget.querySelector('article')
    if (!card) return
    card.style.transform = ''
    card.style.transition = ''
  }

  const storyImage = post.coverImageUrl ? (
    <ArticleCoverImage src={post.coverImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: .8 }} />
  ) : <div aria-hidden="true" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.8)', fontFamily: 'var(--font-display)', letterSpacing: '.12em' }}>BARD</div>

  const actions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
      <button className={`like-btn${liked ? ' liked' : ''}`} type="button" onClick={toggleLike} disabled={busy !== ''} aria-pressed={liked} aria-label={liked ? 'Unlike story' : 'Like story'}>
        <span>{likeCount}</span>
        <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </button>
      {user && <button type="button" onClick={toggleBookmark} disabled={busy !== ''} aria-pressed={bookmarked} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark story'} style={{ border: 0, background: 'transparent', color: '#757575', cursor: 'pointer', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{bookmarked ? 'Saved' : 'Save'}</button>}
    </div>
  )

  if (layout === 'row') {
    return (
      <article className="story-row feature-card" role="link" tabIndex={0} aria-label={`Open ${post.title}`} onClick={openFromCard} onKeyDown={handleKeyDown} style={{ overflow: 'hidden' }}>
        <Link to={href} state={state} aria-label={`Read ${post.title}`} style={{ overflow: 'hidden', minHeight: 140, background: '#5C7A6E' }}>{storyImage}</Link>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div>
            <p style={{ fontSize: '.72rem', color: '#757575', marginBottom: '.5rem' }}>{date} · {readTime}</p>
            <Link to={href} state={state} style={{ color: 'inherit', textDecoration: 'none' }}><h3 className="font-display" style={{ fontSize: 'clamp(1.125rem, 2vw, 1.5rem)', textTransform: 'uppercase', lineHeight: 1.15, marginBottom: '.5rem' }}>{post.title || 'Untitled'}</h3></Link>
            <p style={{ fontSize: '.8rem', color: '#757575', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt || ''}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '.75rem', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#757575', marginRight: 'auto' }}>{(post.tags || [])[0] || ''} <span style={{ color: '#9CA3AF' }}>· {post.status}</span></p>
            {actions}
          </div>
          {message && <p role="alert" style={{ color: '#B91C1C', fontSize: '.75rem', marginTop: '.5rem' }}>{message}</p>}
        </div>
      </article>
    )
  }

  if (layout === 'feature') {
    return (
      <article className="feature-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Link to={href} state={state} aria-label={`Read ${post.title}`} style={{ position: 'relative', height: 160, overflow: 'hidden', background: '#5C7A6E' }}>
          {storyImage}
          <span style={{ position: 'absolute', top: 12, right: 12, background: '#000', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', padding: '4px 10px' }}>{readTime}</span>
        </Link>
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <p style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#757575', marginBottom: '.5rem' }}>{(post.tags || [])[0] || ''} · {readTime}</p>
          <Link to={href} state={state} style={{ color: 'inherit', textDecoration: 'none' }}><h3 className="font-display" style={{ fontSize: '1.125rem', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '.5rem' }}>{post.title || 'Untitled'}</h3></Link>
          <p style={{ fontSize: '.8rem', color: '#757575', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '.75rem' }}>{post.excerpt || ''}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.75rem', marginTop: 'auto', paddingTop: '.5rem', color: '#9CA3AF', fontSize: '.72rem' }}>
            <time>{date}</time>{actions}
          </div>
          {message && <p role="alert" style={{ color: '#B91C1C', fontSize: '.75rem', marginTop: '.5rem' }}>{message}</p>}
        </div>
      </article>
    )
  }

  return (
    <div className="blog-card" onMouseMove={handleMouseMove} onMouseLeave={resetCardTransform}>
      <article
        role="link"
        tabIndex={0}
        aria-label={`Open ${post.title}`}
        onClick={openFromCard}
        onKeyDown={handleKeyDown}
        style={{ background: '#FDFCFB', display: 'flex', flexDirection: 'column', height: 400, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <Link to={href} state={state} aria-label={`Read ${post.title}`} style={{ width: '100%', height: '100%', background: '#5C7A6E', position: 'relative', overflow: 'hidden', flex: '0 0 45%', display: 'block' }}>
          <span className="read-badge">{readTime}</span>
          {post.coverImageUrl ? (
            <ArticleCoverImage className="card-img" src={post.coverImageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.75 }} />
          ) : (
            <div className="card-img" aria-hidden="true" style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,.8)', fontFamily: 'var(--font-display)', fontSize: '2rem', letterSpacing: '.12em' }}>BARD</div>
          )}
        </Link>

        <div style={{ padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, minHeight: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                {post.author?.avatarUrl ? (
                  <img src={post.author.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#EAE2D8', fontSize: '.75rem', fontWeight: 700 }}>{initials(post.author)}</span>
                )}
                <div style={{ fontSize: '.75rem', color: '#757575' }}>
                  <p style={{ fontWeight: 500, color: '#1a1a1a' }}>{authorName}</p>
                  <p>{date} · {readTime}</p>
                </div>
              </div>
              {post.author?.username && <Link to={`/u/${encodeURIComponent(post.author.username)}`} state={state} aria-label={`View ${authorName}'s profile`} style={{ color: '#757575', fontSize: '.7rem', textDecoration: 'underline', textUnderlineOffset: 3 }}>Profile</Link>}
            </div>

            <Link to={href} state={state} style={{ color: 'inherit', textDecoration: 'none' }}>
              <h2 className="font-display" style={{ fontSize: 'clamp(1.25rem, 2vw, 1.75rem)', textTransform: 'uppercase', lineHeight: 1.15, marginBottom: '.75rem', color: '#2A2A2A', transform: 'scaleX(1.04)', transformOrigin: 'left' }}>{post.title || 'Untitled'}</h2>
            </Link>
            <p style={{ color: '#757575', fontSize: '.875rem', lineHeight: 1.6, marginBottom: '.5rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt || ''}</p>
            <div>{(post.tags || []).map(tag => <Link key={tag} to={`/blogs?topic=${encodeURIComponent(tag)}`} className="topic-tag" style={{ color: '#000', textDecoration: 'none' }}>{tag}</Link>)}</div>
          </div>

          <div>
            <div style={{ height: 1, background: '#E0DCD6', margin: '.75rem 0' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '.75rem', color: '#757575', gap: '.75rem' }}>
              <Link to={href} state={state} style={{ color: 'inherit', textDecoration: 'none' }}>
                {post.commentCount || 0} comments
              </Link>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.9rem' }}>
                <button className={`like-btn${liked ? ' liked' : ''}`} type="button" onClick={toggleLike} disabled={busy !== ''} aria-pressed={liked} aria-label={liked ? 'Unlike story' : 'Like story'}>
                  <span>{likeCount}</span>
                  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </button>
                {user && <button type="button" onClick={toggleBookmark} disabled={busy !== ''} aria-pressed={bookmarked} aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark story'} style={{ border: 0, background: 'transparent', color: '#757575', cursor: 'pointer', fontSize: '.7rem', textTransform: 'uppercase', letterSpacing: '.06em' }}>{bookmarked ? 'Saved' : 'Save'}</button>}
              </div>
            </div>
            {message && <p role="alert" style={{ color: '#B91C1C', marginTop: '.5rem', fontSize: '.75rem' }}>{message}</p>}
          </div>
        </div>
      </article>
    </div>
  )
}

export default function BlogCard(props) {
  const { post } = props
  const stateKey = `${post.id}:${Boolean(post.liked)}:${Boolean(post.bookmarked)}:${post.likeCount || 0}`
  return <BlogCardContent key={stateKey} {...props} />
}
