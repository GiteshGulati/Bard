import { useState } from 'react'
import { WRITERS } from '../data'

export default function Following() {
  const [followed, setFollowed] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bard-following') || '[]') } catch { return [] }
  })

  function toggleFollow(id) {
    setFollowed(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('bard-following', JSON.stringify(next))
      return next
    })
  }

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh' }}>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '3rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '0.5rem' }}>Your circle</p>
          <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Following</h1>
        </div>

        {/* Writers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {WRITERS.map(w => (
            <div key={w.id} className="writer-card">
              {/* Writer header */}
              <div style={{ padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderBottom: '1px solid #E0DCD6', flexWrap: 'wrap' }}>
                <img src={w.avatar} alt={w.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <h2 className="font-display" style={{ fontSize: '1.5rem', textTransform: 'uppercase', transform: 'scaleX(1.06)', transformOrigin: 'left', marginBottom: '0.25rem' }}>{w.name}</h2>
                  <p style={{ fontSize: '0.875rem', color: '#757575', lineHeight: 1.5, marginBottom: '0.5rem' }}>{w.bio}</p>
                  <div>{w.topics.map(t => <span key={t} className="topic-tag" style={{ fontSize: '0.6rem' }}>{t}</span>)}</div>
                </div>
                <button
                  className={`follow-btn${followed.includes(w.id) ? ' following' : ''}`}
                  onClick={() => toggleFollow(w.id)}
                >
                  {followed.includes(w.id) ? 'Following' : 'Follow'}
                </button>
              </div>

              {/* Posts */}
              <div style={{ padding: '1.5rem 2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                {w.posts.map((p, i) => (
                  <article key={i} className="feature-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', overflow: 'hidden', cursor: 'pointer' }}>
                    <div style={{ height: 160, overflow: 'hidden', background: w.color, position: 'relative' }}>
                      <img src={p.cover} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.8 }} />
                    </div>
                    <div style={{ padding: '1.25rem' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#757575', marginBottom: '0.5rem' }}>{p.topicLabel} · {p.read}</p>
                      <h3 className="font-display" style={{ fontSize: '1.125rem', textTransform: 'uppercase', lineHeight: 1.2, marginBottom: '0.5rem' }}>{p.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#757575', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.75rem' }}>{p.excerpt}</p>
                      <p style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>{p.date}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
