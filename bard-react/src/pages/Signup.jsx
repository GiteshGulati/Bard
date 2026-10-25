import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BardAuth } from '../auth'

export default function Signup() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const navigate = useNavigate()

  if (BardAuth.isLoggedIn()) {
    navigate('/profile')
    return null
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    const result = BardAuth.signup(firstName, lastName, email, password)
    if (result.ok) {
      navigate('/profile')
    } else {
      setError(result.error)
    }
  }

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Close button */}
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
            <input className="input-field" type="text"     placeholder="First Name" required value={firstName} onChange={e => setFirstName(e.target.value)} />
            <input className="input-field" type="text"     placeholder="Last Name"  required value={lastName}  onChange={e => setLastName(e.target.value)} />
            <input className="input-field" type="email"    placeholder="Email"      required value={email}     onChange={e => setEmail(e.target.value)} />
            <input className="input-field" type="password" placeholder="Password"   required value={password}  onChange={e => setPassword(e.target.value)} />

            {error && <p style={{ fontSize: '0.875rem', textAlign: 'center', color: '#F87171' }}>{error}</p>}

            <button type="submit" style={{ width: '100%', background: '#000', color: '#fff', fontWeight: 600, padding: '0.75rem', fontSize: '1rem', border: 'none', cursor: 'pointer', marginTop: '1rem', transition: 'background 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = '#333'} onMouseOut={e => e.currentTarget.style.background = '#000'}
            >
              Sign up
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
