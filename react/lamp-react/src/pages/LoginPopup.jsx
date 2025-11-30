// by Tudor Cosmin Suciu, 40179863

import { useState } from 'react'
import MessagePopup from './MessagePopup'

export default function LoginModal({ onClose, onAuth }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')

  async function submit(e) {
    e.preventDefault()
    setError('')
    const res = await fetch('/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
      credentials: 'include'
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.success) {
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
        <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" required />
        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password" required />
        {error ? <div style={{ color: 'red' }}>{error}</div> : null}
        <button className="btn primary" type="submit">Log In</button>
      </form>
    </MessagePopup>
  )
}
