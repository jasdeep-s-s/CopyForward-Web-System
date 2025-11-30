// by Tudor Cosmin Suciu, 40179863

import { useState, useEffect } from 'react'
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
  const [matrix, setMatrix] = useState('')
  const [step, setStep] = useState('details') // details -> matrix
  const [pendingMemberId, setPendingMemberId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Restore persisted state so closing the modal doesn't lose the form
  useEffect(() => {
    const stored = localStorage.getItem('signup_state')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.form) setForm(parsed.form)
        if (parsed.matrix) setMatrix(parsed.matrix)
        if (parsed.step) setStep(parsed.step)
        if (parsed.pendingMemberId) setPendingMemberId(parsed.pendingMemberId)
      } catch (e) {
        // ignore parse errors
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('signup_state', JSON.stringify({
      form,
      matrix,
      step,
      pendingMemberId
    }))
  }, [form, matrix, step, pendingMemberId])

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (step === 'details') {
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
    } else if (!matrix.trim()) {
      setError('Enter the security matrix sent to your messages.')
      return
    }

    setLoading(true)
    const payload = step === 'details'
      ? {
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
        }
      : {
          matrix: matrix.trim().toUpperCase(),
          memberId: pendingMemberId
        }

    const res = await fetch('/signup.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include'
    }).catch(() => null)
    const data = res ? await res.json().catch(() => ({})) : null
    setLoading(false)

    if (!res || !res.ok || !data?.success) {
      setError(data?.error || 'Sign up failed')
      return
    }

    if (data.mfaRequired && data.memberId) {
      setPendingMemberId(data.memberId)
      setStep('matrix')
      setError('Security matrix sent. Check your mail/messages and enter it below.')
      return
    }

    // keep compatibility with existing localStorage listeners
    localStorage.setItem('logged_in_id', String(data.user.id))
    localStorage.setItem('logged_in_role', data.user.role || '')
    localStorage.setItem('logged_in_email', data.user.email || '')
    localStorage.removeItem('signup_state')
    onAuth?.(data.user)
    onClose()
  }

  return (
    <MessagePopup onClose={onClose}>
      <form onSubmit={submit}>
        <h3>Sign Up</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" required disabled={step === 'matrix'} />
          <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" required disabled={step === 'matrix'} />
          <input type="email" value={form.recoveryEmail} onChange={e => setForm({ ...form, recoveryEmail: e.target.value })} placeholder="Recovery email (optional)" disabled={step === 'matrix'} />
          <input value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} placeholder="Organization" disabled={step === 'matrix'} />
          <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} placeholder="Username" required disabled={step === 'matrix'} />
          <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6 chars)" required disabled={step === 'matrix'} />
          <input value={form.orcid} onChange={e => setForm({ ...form, orcid: e.target.value })} placeholder="If you are an author please enter your ORCID" disabled={step === 'matrix'} />
          <input value={form.streetNumber} onChange={e => setForm({ ...form, streetNumber: e.target.value })} placeholder="Street number" required disabled={step === 'matrix'} />
          <input value={form.streetName} onChange={e => setForm({ ...form, streetName: e.target.value })} placeholder="Street name" required disabled={step === 'matrix'} />
          <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="City" required disabled={step === 'matrix'} />
          <input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="Country" required disabled={step === 'matrix'} />
          {step === 'matrix' ? (
            <input value={matrix} onChange={e => setMatrix(e.target.value.toUpperCase())} placeholder="Enter the security matrix from your messages" required />
          ) : null}
        </div>
        {error ? <div style={{ color: 'red', marginTop: 8 }}>{error}</div> : null}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? 'Working...' : (step === 'details' ? 'Sign Up' : 'Verify')}
          </button>
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </MessagePopup>
  )
}
