import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { auth as authApi } from '../api'
import { useAuth } from '../context/AuthContext'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { refreshUser } = useAuth()

  // 'verifying' | 'success' | 'error'
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token was found in this link. Please check your inbox and try again.')
      return
    }

    let cancelled = false
    authApi.verifyEmail({ token })
      .then(async (res) => {
        if (cancelled) return
        await refreshUser()
        setStatus('success')
        setMessage(res?.data?.message || 'Your email has been verified.')
      })
      .catch((err) => {
        if (cancelled) return
        setStatus('error')
        setMessage(err.message || 'Verification failed. The link may have expired or already been used.')
      })

    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ background: '#F2EBE1', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 480, width: '100%' }}>

          {/* ── Verifying ── */}
          {status === 'verifying' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'center' }}>
                <svg
                  style={{ width: 48, height: 48, animation: 'bard-spin 0.9s linear infinite' }}
                  fill="none" stroke="#9CA3AF" strokeWidth="1.5" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <style>{`@keyframes bard-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
              </div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '1rem' }}>
                Please wait
              </p>
              <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 6vw, 3.5rem)', textTransform: 'uppercase', lineHeight: 1, transform: 'scaleX(1.08)', transformOrigin: 'center', display: 'inline-block', marginBottom: '1rem' }}>
                Verifying
              </h1>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', lineHeight: 1.7 }}>
                Confirming your email address with BARD.
              </p>
            </div>
          )}

          {/* ── Success ── */}
          {status === 'success' && (
            <>
              <div style={{ marginBottom: '3rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '1rem' }}>
                  Email confirmed
                </p>
                <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', textTransform: 'uppercase', lineHeight: 1, transform: 'scaleX(1.08)', transformOrigin: 'left', display: 'inline-block', marginBottom: '1.5rem' }}>
                  You&apos;re In.
                </h1>
                <div style={{ height: 2, width: 64, background: '#000', marginBottom: '1.5rem' }} />
                <p style={{ color: '#6B7280', fontSize: '0.9375rem', lineHeight: 1.75, maxWidth: 400 }}>
                  {message} You now have full access — write, comment, follow writers, and build your own corner of BARD.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link
                  to="/post"
                  className="btn-primary"
                  style={{ background: '#000', color: '#fff', fontWeight: 700, padding: '1rem 2.5rem', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', display: 'block', textAlign: 'center', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#333'}
                  onMouseOut={e => e.currentTarget.style.background = '#000'}
                >
                  Write Your First Story
                </Link>
                <Link
                  to="/blogs"
                  style={{ border: '1px solid #000', color: '#000', fontWeight: 600, padding: '1rem 2.5rem', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', display: 'block', textAlign: 'center', transition: 'background 0.2s, color 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.background = '#000'; e.currentTarget.style.color = '#fff' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#000' }}
                >
                  Browse Posts
                </Link>
                <Link
                  to="/profile"
                  style={{ color: '#9CA3AF', fontWeight: 500, padding: '0.75rem', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', display: 'block', textAlign: 'center', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#000'}
                  onMouseOut={e => e.currentTarget.style.color = '#9CA3AF'}
                >
                  Go to Profile →
                </Link>
              </div>
            </>
          )}

          {/* ── Error ── */}
          {status === 'error' && (
            <>
              <div style={{ marginBottom: '3rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '1rem' }}>
                  Verification failed
                </p>
                <h1 className="font-display" style={{ fontSize: 'clamp(2.5rem, 7vw, 4rem)', textTransform: 'uppercase', lineHeight: 1, transform: 'scaleX(1.08)', transformOrigin: 'left', display: 'inline-block', marginBottom: '1.5rem' }}>
                  Link Expired
                </h1>
                <div style={{ height: 2, width: 64, background: 'rgba(0,0,0,0.15)', marginBottom: '1.5rem' }} />
                <p style={{ color: '#6B7280', fontSize: '0.9375rem', lineHeight: 1.75, maxWidth: 400 }}>
                  {message}
                </p>
              </div>

              <div style={{ background: '#EAE2D8', padding: '1.25rem 1.5rem', marginBottom: '2rem', borderLeft: '3px solid #000' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Need a new link?</p>
                <p style={{ fontSize: '0.85rem', color: '#6B7280', lineHeight: 1.6 }}>
                  Log in and visit your profile — there&apos;s a button to resend the verification email.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Link
                  to="/profile"
                  className="btn-primary"
                  style={{ background: '#000', color: '#fff', fontWeight: 700, padding: '1rem 2.5rem', fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase', textDecoration: 'none', display: 'block', textAlign: 'center' }}
                  onMouseOver={e => e.currentTarget.style.background = '#333'}
                  onMouseOut={e => e.currentTarget.style.background = '#000'}
                >
                  Go to Profile
                </Link>
                <Link
                  to="/"
                  style={{ color: '#9CA3AF', fontWeight: 500, padding: '0.75rem', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', display: 'block', textAlign: 'center', transition: 'color 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.color = '#000'}
                  onMouseOut={e => e.currentTarget.style.color = '#9CA3AF'}
                >
                  Back to Home →
                </Link>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  )
}
