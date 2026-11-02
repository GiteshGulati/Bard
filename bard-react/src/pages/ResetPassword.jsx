import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { auth as authApi } from '../api'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault(); setMessage(''); setError('')
    if (!token) return setError('This reset link is missing its token. Request a new link.')
    if (password !== confirm) return setError('The passwords do not match.')
    setLoading(true)
    try {
      const result = await authApi.resetPassword({ token, password })
      setMessage(result?.data?.message || 'Your password has been reset. You can now log in.')
      setPassword(''); setConfirm('')
    } catch (err) { setError(err.message || 'This reset link is invalid or expired. Request a new one.') }
    finally { setLoading(false) }
  }
  return <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '4rem 1.5rem' }}><section style={{ maxWidth: 440, margin: '0 auto' }}>
    <h1 className="font-display" style={{ fontSize: '2.5rem' }}>Choose a new password</h1>
    {!token && <p role="alert" style={{ margin: '1rem 0', color: '#B91C1C' }}>This link is missing its reset token. <Link to="/forgot-password">Request a new link</Link>.</p>}
    <form onSubmit={submit} style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}><label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label><label>Confirm password<input type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} /></label><button type="submit" disabled={loading || !token}>{loading ? 'Resetting…' : 'Reset password'}</button></form>
    {message && <p role="status" style={{ marginTop: '1rem' }}>{message} <Link to="/login">Log in</Link></p>}{error && <p role="alert" style={{ marginTop: '1rem', color: '#B91C1C' }}>{error} {error.toLowerCase().includes('expired') && <Link to="/forgot-password">Request a new link</Link>}</p>}
  </section></main>
}
