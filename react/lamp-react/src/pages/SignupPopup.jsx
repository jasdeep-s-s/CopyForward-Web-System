// by Tudor Cosmin Suciu, 40179863

import { useState } from 'react'
import MessagePopup from './MessagePopup'

export default function SignupPopup({ onClose, onAuth }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    recoveryEmail: '',
    organization: '',
    username: '',
    password: '',
    orcid: '',
    streetNumber: '',
    streetName: '',
    city: '',
    country: ''
  })
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
    if (!form.streetNumber.trim() || !form.streetName.trim() || !form.city.trim() || !form.country.trim()) {
      setError('Address fields are required.')
      return
    }

    setLoading(true)
    const res = await fetch('/signup.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: form.email.trim(),
        recoveryEmail: form.recoveryEmail.trim() || undefined,
        organization: form.organization.trim() || undefined,
        username: form.username.trim(),
        password: form.password,
        orcid: form.orcid.trim() || undefined,
        address: {
          streetNumber: form.streetNumber.trim(),
          streetName: form.streetName.trim(),
          city: form.city.trim(),
          country: form.country.trim()
        }
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
          <input type="email" value={form.recoveryEmail} onChange={e => setForm({ ...form, recoveryEmail: e.target.value })} placeholder="Recovery email (optional)" />
          <input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} placeholder="Organization" />
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" required />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6 chars)" required />
          <input value={form.orcid} onChange={e => setForm({ ...form, orcid: e.target.value })} placeholder="If you are an author please enter your ORCID" />
          <input value={form.streetNumber} onChange={e => setForm({ ...form, streetNumber: e.target.value })} placeholder="Street number" required />
          <input value={form.streetName} onChange={e => setForm({ ...form, streetName: e.target.value })} placeholder="Street name" required />
          <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" required />
          <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Country" required />
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
