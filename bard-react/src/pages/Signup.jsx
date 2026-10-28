import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup() {
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  function validatePassword(pw) {
    if (pw.length < 8) return 'Password must be at least 8 characters.'
    if (!/[A-Za-z]/.test(pw)) return 'Password must include at least one letter.'
    if (!/\d/.test(pw)) return 'Password must include at least one number.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const pwErr = validatePassword(password)
    if (pwErr) { setError(pwErr); return }
    setLoading(true)
    try {
      await register(displayName.trim(), username.trim().toLowerCase(), email.toLowerCase().trim(), password)
      navigate('/profile')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Link to="/" aria-label="Close" style={{ position: 'absolute', top: '2rem', right: '2rem', color: '#000', opacity: 1, transition: 'opacity 0.2s' }}
        onMouseOver={e => e.currentTarget.style.opacity = '0.6'} onMouseOut={e => e.currentTarget.style.opacity = '1'}
      >
        <svg style={{ width: 40, height: 40 }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: 384, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(3rem, 8vw, 3.75rem)', marginBottom: '2.5rem', textAlign: 'center', transform: 'scaleX(1.4)', transformOrigin: 'center', display: 'inline-block' }}>
            Sign Up
          </h1>

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input className="input-field" type="text"     placeholder="Display Name" required value={displayName} onChange={e => setDisplayName(e.target.value)} />
            <input className="input-field" type="text"
              placeholder="Username (letters, numbers, _)"
              required
              pattern="[a-zA-Z0-9_]{3,20}"
              title="3–20 letters, numbers or underscores"
              value={username} onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))} />
            <input className="input-field" type="email"    placeholder="Email" required value={email} onChange={e => setEmail(e.target.value)} />
            <div>
              <input className="input-field" type="password"
                placeholder="Password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)} />
              <p style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '0.25rem' }}>Min 8 chars, must include a letter and a number</p>
            </div>

            {error && <p style={{ fontSize: '0.875rem', textAlign: 'center', color: '#F87171' }}>{error}</p>}

            <button type="submit" disabled={loading} style={{ width: '100%', background: '#000', color: '#fff', fontWeight: 600, padding: '0.75rem', fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '1rem', transition: 'background 0.2s', opacity: loading ? 0.7 : 1 }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#333' }} onMouseOut={e => e.currentTarget.style.background = '#000'}
            >
              {loading ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: '#6B7280' }}>Already a member? </span>
            <Link to="/login" style={{ fontWeight: 700, color: '#000' }}>Log In</Link>
          </div>
        </div>
      </main>
    </div>
  )
}
