// by Tudor Cosmin Suciu, 40179863

import { useState } from 'react'
import MessagePopup from './MessagePopup'

export default function LoginModal({ onClose, onAuth }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
      credentials: 'include'
    }).catch(() => null)

    const data = res ? await res.json().catch(() => ({})) : null
    setLoading(false)

    if (!res || !res.ok) {
      setError((data && data.error) || 'Login failed')
      return
    }

    if (!data.success) {
      setError(data.error || 'Login failed')
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
        <h3>Log In</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" required />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" required />
        </div>
        {error ? <div style={{ color: 'red', marginTop: 8 }}>{error}</div> : null}
        <button style={{ marginTop: 12 }} className="btn primary" type="submit" disabled={loading}>
          {loading ? 'Working...' : 'Log In'}
        </button>
      </form>
    </MessagePopup>
  )
}
