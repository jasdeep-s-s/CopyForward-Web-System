// by Tudor Cosmin Suciu, 40179863

import { useState } from 'react'
import MessagePopup from './MessagePopup'

export default function SignupPopup({ onClose, onAuth }) {
  const [form, setForm] = useState({ name: '', email: '', username: '', password: '', orcid: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim() || !form.username.trim()) {
      setError('Please fill in name, email, and username.')
      return
    }
    if ((form.password || '').length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    const res = await fetch('/signup.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        username: form.username.trim(),
        password: form.password,
        orcid: form.orcid.trim() || undefined
      }),
      credentials: 'include'
    }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : null
    setLoading(false)

    if (!res || !res.ok || !data?.success) {
      setError(data?.error || 'Sign up failed')
      return
    }

    // keep compatibility with existing localStorage listeners
    localStorage.setItem('logged_in_id', String(data.user.id))
    localStorage.setItem('logged_in_role', data.user.role || '')
    localStorage.setItem('logged_in_email', data.user.email || '')
    onAuth?.(data.user)
    onClose()
  }

  return (
    <MessagePopup onClose={onClose}>
      <form onSubmit={submit}>
        <h3>Sign Up</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" required />
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" required />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6 chars)" required />
          <input value={form.orcid} onChange={e => setForm({ ...form, orcid: e.target.value })} placeholder="ORCID (optional)" />
        </div>
        {error ? <div style={{ color: 'red', marginTop: 8 }}>{error}</div> : null}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn primary" type="submit" disabled={loading}>{loading ? 'Signing up...' : 'Sign Up'}</button>
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </MessagePopup>
  )
}
