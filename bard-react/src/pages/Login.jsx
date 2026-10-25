import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { BardAuth } from '../auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Redirect if already logged in
  if (BardAuth.isLoggedIn()) {
    navigate('/profile')
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const result = BardAuth.login(email, password)
    if (result.ok) {
      navigate('/profile')
    } else {
      setError(result.error)
    }
  }

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Close button */}
      <Link to="/blogs" aria-label="Close" style={{ position: 'absolute', top: '2rem', right: '2rem', color: '#000', transition: 'opacity 0.2s', opacity: 1 }}
        onMouseOver={e => e.currentTarget.style.opacity = '0.6'} onMouseOut={e => e.currentTarget.style.opacity = '1'}
      >
        <svg style={{ width: 40, height: 40 }} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ width: '100%', maxWidth: 384, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(3rem, 8vw, 3.75rem)', marginBottom: '2.5rem', textAlign: 'center', transform: 'scaleX(1.4)', transformOrigin: 'center', display: 'inline-block' }}>
            Log In
          </h1>

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input
              className="input-field"
              id="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <input
              className="input-field"
              id="password"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.5rem' }}>
              <a href="#" style={{ fontSize: '0.75rem', color: '#6B7280', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.color = '#000'; e.currentTarget.style.textDecoration = 'underline' }}
                onMouseOut={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.textDecoration = 'none' }}
              >Forgot password?</a>
            </div>

            {error && <p style={{ fontSize: '0.875rem', textAlign: 'center', color: '#F87171' }}>{error}</p>}

            <button type="submit" style={{ width: '100%', background: '#000', color: '#fff', fontWeight: 600, padding: '0.75rem', fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '0.5rem', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#333'} onMouseOut={e => e.currentTarget.style.background = '#000'}
            >
              Log in
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: '#6B7280' }}>Don't have an account? </span>
            <Link to="/signup" style={{ fontWeight: 700, color: '#000' }}>Sign Up</Link>
          </div>

          <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.15)' }} />
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.15)' }} />
          </div>

          <Link to="/" style={{ marginTop: '1rem', width: '100%', border: '1px solid #000', color: '#000', fontSize: '0.875rem', fontWeight: 600, padding: '0.75rem', textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', display: 'block', transition: 'background 0.2s, color 0.2s' }}
            onMouseOver={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' }}
            onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000' }}
          >
            Continue as Guest
          </Link>
        </div>
      </main>
    </div>
  )
}
