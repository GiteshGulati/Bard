import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authState'
import { auth as authApi } from '../api'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [resendEmail, setResendEmail] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  const [resendError, setResendError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setRequiresVerification(false)
    setResendMessage('')
    setResendError('')
    setLoading(true)
    try {
      await login(identifier.trim(), password)
      navigate('/profile')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
      if (err.data?.error?.code === 'EMAIL_NOT_VERIFIED') {
        setRequiresVerification(true)
        setResendEmail(identifier.includes('@') ? identifier.trim() : '')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleResendVerification() {
    setResendLoading(true)
    setResendMessage('')
    setResendError('')
    try {
      const response = await authApi.resendVerification({ email: resendEmail.trim().toLowerCase() })
      setResendMessage(response?.data?.message || 'If the address is associated with a Bard account, instructions will be sent shortly.')
    } catch (err) {
      setResendError(err.message || 'Could not request a verification email. Please try again later.')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
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
              id="identifier"
              type="text"
              placeholder="Email or username"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
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

            {error && <p style={{ fontSize: '0.875rem', textAlign: 'center', color: '#F87171' }}>{error}</p>}

            {requiresVerification && (
              <section aria-live="polite" style={{ background: '#EAE2D8', padding: '1rem 1.25rem', borderLeft: '3px solid #000' }}>
                <p style={{ fontSize: '0.875rem', color: '#4B5563', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                  Your password is correct, but this account’s email is not verified yet. Enter the account email to request a new verification link.
                </p>
                <input
                  className="input-field"
                  type="email"
                  placeholder="Account email"
                  value={resendEmail}
                  onChange={e => setResendEmail(e.target.value)}
                />
                <button type="button" onClick={handleResendVerification} disabled={resendLoading || !resendEmail.trim()} style={{ width: '100%', background: '#000', color: '#fff', fontWeight: 600, padding: '0.7rem', border: 'none', cursor: resendLoading || !resendEmail.trim() ? 'not-allowed' : 'pointer', opacity: resendLoading || !resendEmail.trim() ? 0.7 : 1, marginTop: '0.75rem' }}>
                  {resendLoading ? 'Requesting…' : 'Resend verification email'}
                </button>
                {resendMessage && <p role="status" style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#4B5563', lineHeight: 1.5 }}>{resendMessage}</p>}
                {resendError && <p role="alert" style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#B91C1C' }}>{resendError}</p>}
              </section>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', background: '#000', color: '#fff', fontWeight: 600, padding: '0.75rem', fontSize: '1rem', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem', transition: 'background 0.2s', opacity: loading ? 0.7 : 1 }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#333' }} onMouseOut={e => e.currentTarget.style.background = '#000'}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <span style={{ color: '#6B7280' }}>Don&apos;t have an account? </span>
            <Link to="/signup" style={{ fontWeight: 700, color: '#000' }}>Sign Up</Link>
          </div>
          <div style={{ marginTop: '.75rem', textAlign: 'center', fontSize: '.85rem' }}><Link to="/forgot-password">Forgot your password?</Link></div>

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
