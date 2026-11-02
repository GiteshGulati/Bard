import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { moderation as moderationApi } from '../api'
import { useAuth } from '../context/AuthContext'

export default function AdminModeration() {
  const { user } = useAuth()
  const [reports, setReports] = useState([])
  const [selected, setSelected] = useState(null)
  const [hideTarget, setHideTarget] = useState(true)
  const [userAction, setUserAction] = useState('suspend')
  const [status, setStatus] = useState('open')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const result = await moderationApi.reports({ status, limit: 50 })
      setReports(result.data.items || [])
      setSelected(current => current && (result.data.items || []).some(report => report._id === current._id) ? current : null)
    } catch (err) { setError(err.message || 'Could not load moderation reports.') }
    finally { setLoading(false) }
  }, [status])
  useEffect(() => { load() }, [load, retry])

  async function selectReport(report) {
    setSelected(report); setNote(''); setError(''); setMessage('')
    try {
      const result = await moderationApi.report(report._id)
      setSelected(result.data)
    } catch (err) { setError(err.message || 'Could not load report details.') }
  }

  async function review(status) {
    if (!selected?.report) return
    setBusy(true); setError(''); setMessage('')
    try {
      const report = selected.report
      const body = { status, resolutionNote: note }
      if (status === 'resolved' && report.targetType === 'user') body.userAction = userAction
      if (status === 'resolved' && ['article', 'comment'].includes(report.targetType)) body.hideTarget = hideTarget
      await moderationApi.review(report._id, body)
      setMessage(status === 'resolved' ? 'Report resolved and action applied.' : 'Report dismissed.')
      setSelected(null)
      await load()
    } catch (err) { setError(err.message || 'Could not review this report.') }
    finally { setBusy(false) }
  }

  if (user?.role !== 'admin') return <main style={{ maxWidth: 800, margin: '4rem auto', padding: '1.5rem' }}><h1>Administrator access required</h1><Link to="/">Return home</Link></main>

  return <main style={{ background: '#F2EBE1', minHeight: '100vh', padding: '2.5rem 1.5rem' }}><div style={{ maxWidth: 1100, margin: '0 auto' }}>
    <p style={{ textTransform: 'uppercase', letterSpacing: '.15em', color: '#6B7280', fontSize: '.75rem' }}>Administrator</p><h1 className="font-display" style={{ fontSize: '3rem' }}>Moderation queue</h1>
    <label>Report status <select value={status} onChange={event => setStatus(event.target.value)}><option value="open">Open</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label>
    {message && <p role="status">{message}</p>}{error && <p role="alert" style={{ color: '#B91C1C' }}>{error} <button type="button" onClick={() => setRetry(v => v + 1)}>Retry</button></p>}
    {loading && <p role="status">Loading reports…</p>}
    {!loading && !error && !reports.length && <p>No open reports.</p>}
    <div className="admin-moderation-layout" style={{ marginTop: '1.5rem' }}>
      <section aria-label="Open reports" style={{ display: 'grid', alignContent: 'start', gap: '.5rem' }}>{reports.map(report => <button key={report._id} type="button" onClick={() => selectReport(report)} style={{ textAlign: 'left', padding: '1rem', background: selected?.report?._id === report._id ? '#EAE2D8' : '#fff', border: 0 }}><strong>{report.targetType}</strong> · {report.reason}<br /><small>{new Date(report.createdAt).toLocaleString()}</small></button>)}</section>
      {selected?.report && <section style={{ background: '#EAE2D8', padding: '1.25rem' }}><h2>Report details</h2><p>Type: {selected.report.targetType}</p><p>Reason: {selected.report.reason}</p><p>Explanation: {selected.report.explanation || 'No explanation provided.'}</p><p>Reported by: {selected.report.reporter?.displayName || selected.report.reporter?.username || 'Member'}</p>
        <div style={{ margin: '1rem 0', padding: '1rem', background: '#fff' }}><h3>Target</h3>{selected.target ? <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{JSON.stringify(selected.target, null, 2)}</pre> : <p>Target is no longer available.</p>}</div>
        <label>Resolution note<textarea value={note} onChange={event => setNote(event.target.value)} maxLength={1000} rows={3} /></label>
        {selected.report.targetType === 'user' ? <label style={{ display: 'block', marginTop: '1rem' }}>Account action<select value={userAction} onChange={event => setUserAction(event.target.value)}><option value="suspend">Suspend account</option><option value="restore">Restore account</option></select><small>Current status: {selected.target?.moderationStatus || 'active'}</small></label> : <label style={{ display: 'block', marginTop: '1rem' }}><input type="checkbox" checked={hideTarget} onChange={event => setHideTarget(event.target.checked)} /> Hide reported {selected.report.targetType} when resolving</label>}
        <div style={{ display: 'flex', gap: '.75rem', marginTop: '1rem' }}><button type="button" disabled={busy} onClick={() => review('resolved')}>{busy ? 'Saving…' : 'Resolve'}</button><button type="button" disabled={busy} onClick={() => review('dismissed')}>Dismiss</button></div>
      </section>}
    </div>
  </div></main>
}
