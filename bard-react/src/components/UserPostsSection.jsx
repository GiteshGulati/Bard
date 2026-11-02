import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { blogs as blogsApi } from '../api'
import BlogCard from './BlogCard'

export default function UserPostsSection() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    blogsApi.list({ limit: 6 }).then(result => {
      if (active) setPosts(result?.data?.items || [])
    }).catch(err => { if (active) setError(err.message || 'Could not load recent stories.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [retry])

  return (
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '5rem 1.5rem' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <p style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.15em', textTransform: 'uppercase', color: '#6B7280' }}>Fresh from the community</p>
          <h2 className="font-display" style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', transform: 'scaleX(1.08)', transformOrigin: 'left' }}>Recent Posts</h2>
        </div>
        <Link to="/blogs" style={{ fontSize: '.875rem', textDecoration: 'underline', textUnderlineOffset: 4, color: '#000' }}>View all →</Link>
      </div>
      {loading && <p role="status" style={{ color: '#6B7280' }}>Loading recent stories…</p>}
      {!loading && error && <p role="alert" style={{ color: '#6B7280' }}>{error} <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
      {!loading && !error && !posts.length && <p style={{ color: '#6B7280' }}>No published stories yet.</p>}
      {!!posts.length && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {posts.map(post => <BlogCard key={post.id} post={post} layout="feature" onChange={updated => setPosts(current => current.map(item => item.id === updated.id ? { ...item, ...updated } : item))} />)}
      </div>}
    </section>
  )
}
