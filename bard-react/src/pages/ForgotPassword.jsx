import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth as authApi } from '../api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setLoading(true); setMessage(''); setError('')
    try {
      const result = await authApi.forgotPassword({ email: email.trim().toLowerCase() })
      setMessage(result?.data?.message || 'If an account matches this email, reset instructions will be sent shortly.')
    } catch (err) { setError(err.message || 'Could not submit the request. Please try again.') }
    finally { setLoading(false) }
  }
  return <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '4rem 1.5rem' }}><section style={{ maxWidth: 440, margin: '0 auto', background: '#EAE2D8', padding: '2rem 2.5rem' }}>
    <p style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '.75rem' }}>Account access</p><h1 className="font-display" style={{ fontSize: 'clamp(2rem, 7vw, 2.75rem)', lineHeight: 1, textTransform: 'uppercase' }}>Reset your password</h1><p style={{ margin: '1rem 0', color: '#6B7280', lineHeight: 1.65 }}>Enter your email. If it belongs to an account, we’ll send a reset link.</p>
    <form onSubmit={submit} style={{ display: 'grid', gap: '1.25rem' }}><label style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>Email<input className="input-field" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><button className="btn-primary" type="submit" disabled={loading} style={{ background: '#000', color: '#fff', padding: '.75rem', fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', opacity: loading ? .7 : 1 }}>{loading ? 'Sending…' : 'Send reset link'}</button></form>
    {message && <p role="status" style={{ marginTop: '1rem' }}>{message}</p>}{error && <p role="alert" style={{ marginTop: '1rem', color: '#B91C1C' }}>{error}</p>}
    <p style={{ marginTop: '1.5rem' }}><Link to="/login">Back to log in</Link></p>
  </section></main>
}
