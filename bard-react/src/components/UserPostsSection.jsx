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
    <section style={{ maxWidth: 1280, margin: '0 auto', padding: '4rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div><p style={{ textTransform: 'uppercase', letterSpacing: '.15em', color: '#6B7280', fontSize: '.75rem' }}>Fresh from the community</p><h2 className="font-display" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Recent Stories</h2></div>
        <Link to="/blogs">View all stories</Link>
      </div>
      {loading && <p role="status">Loading recent stories…</p>}
      {!loading && error && <p role="alert">{error} <button type="button" onClick={() => setRetry(value => value + 1)}>Retry</button></p>}
      {!loading && !error && !posts.length && <p>No published stories yet.</p>}
      <div style={{ display: 'grid', gap: '1rem' }}>{posts.map(post => <BlogCard key={post.id} post={post} />)}</div>
    </section>
  )
}
