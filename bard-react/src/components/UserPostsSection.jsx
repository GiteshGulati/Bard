// Component shown on Home page: injects user-published posts from localStorage
import { Link } from 'react-router-dom'

function buildPostCard(post) {
  return {
    cover: post.cover || 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop',
    title: post.title || 'Untitled',
    excerpt: post.excerpt || '',
    topicLabel: post.topicLabel || post.topic || '',
    topicColor: post.topicColor || '#5C7A6E',
    date: post.date || '',
    readTime: post.read || '1 min read',
  }
}

export default function UserPostsSection() {
  let posts = []
  try {
    posts = JSON.parse(localStorage.getItem('bard-posts') || '[]').filter(p => p.status === 'published')
  } catch { posts = [] }

  if (!posts.length) return null

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '5rem 1.5rem' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.5rem' }}>Fresh from the community</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Recent Posts</h2>
        </div>
        <Link to="/blogs" style={{ fontSize: '0.875rem', textDecoration: 'underline', textUnderlineOffset: 4, color: '#000' }}>View all →</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {posts.map((post, i) => {
          const c = buildPostCard(post)
          return (
            <article key={i} className="feature-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', height: 192, overflow: 'hidden', background: c.topicColor }}>
                <img src={c.cover} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.8 }} onError={e => { e.target.style.display = 'none' }} />
                <span style={{ position: 'absolute', top: 12, right: 12, background: '#000', color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px' }}>{c.readTime}</span>
              </div>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280' }}>{c.topicLabel}</p>
                <h3 className="font-display" style={{ fontSize: '1.5rem', textTransform: 'uppercase', lineHeight: 1.15, transform: 'scaleX(1.08)', transformOrigin: 'left' }}>{c.title}</h3>
                {c.excerpt && <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.excerpt}</p>}
                <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.1)' }}>{c.date}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
