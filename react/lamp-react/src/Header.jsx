// by Pascal Ypperciel, 40210921
// and Tudor Cosmin Suciu 40179863

import React, { useEffect, useRef, useState } from 'react'
import MessagePopup from './pages/MessagePopup'
import AddItemForm from './pages/AddItemForm'
import LoginPopup from './pages/LoginPopup'
import SignupPopup from './pages/SignupPopup'

function Header({ onMailClick }) {
  const [open, setOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(Boolean(localStorage.getItem('logged_in_id')))
  const [role, setRole] = useState(localStorage.getItem('logged_in_role') || '')
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [showSignupPopup, setShowSignupPopup] = useState(false)
  const ref = useRef(null)
  const [showRefBox, setShowRefBox] = useState(false)
  const [refEmail, setRefEmail] = useState('')
  const [refLoading, setRefLoading] = useState(false)
  const [refMessage, setRefMessage] = useState('')
  const [showAuthorBox, setShowAuthorBox] = useState(false)

  useEffect(() => {
    function handleStorage() {
      setLoggedIn(Boolean(localStorage.getItem('logged_in_id')))
      setRole(localStorage.getItem('logged_in_role') || '')
    }
    function handleDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('storage', handleStorage)
    document.addEventListener('click', handleDocClick)
    return () => {
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('click', handleDocClick)
    }
  }, [])

  function goHash(h) {
    window.location.hash = h
    setOpen(false)
  }

  function onAuthed(user) {
    setLoggedIn(true)
    setRole(user?.role || '')
    setOpen(false)
    setShowLoginPopup(false)
    setShowSignupPopup(false)
  }

  async function logout() {
    setOpen(false)
    try {
      await fetch('/logout.php', { method: 'POST', credentials: 'include' })
    } catch (e) {
      // ignore network errors here; we still clear client state
    }
    localStorage.removeItem('logged_in_id')
    localStorage.removeItem('logged_in_role')
    localStorage.removeItem('logged_in_email')
    setLoggedIn(false)
    setRole('')
    window.location.hash = '#/'
  }

  function sendReference() {
    const email = (refEmail || '').trim()
    if (!email) { setRefMessage('Enter an email'); return }
    setRefLoading(true); setRefMessage('')
    fetch('/refer_member.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      .then(r => r.json())
      .then(d => {
        setRefLoading(false)
        if (d && d.success) {
          setRefMessage('Reference added')
          setRefEmail('')
          setShowRefBox(false)
        } else {
          setRefMessage(d && d.error ? d.error : 'Failed')
        }
      }).catch(() => { setRefLoading(false); setRefMessage('Network error') })
  }

  return (
    <>
    <header
      style={{
        padding: '1rem',
        backgroundColor: '#282c34',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '1.2rem',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn" type="button" onClick={onMailClick} style={{ display: 'flex', alignItems: 'center', gap: 6 }} aria-label="Mail">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 5.5C3 4.67157 3.67157 4 4.5 4H19.5C20.3284 4 21 4.67157 21 5.5V18.5C21 19.3284 20.3284 20 19.5 20H4.5C3.67157 20 3 19.3284 3 18.5V5.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 7L12 13L3 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Mail</span>
        </button>
        {role === 'Author' ? (
          <button className="btn" type="button" onClick={() => setShowAuthorBox(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }} aria-label="Author">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 2v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 8v12h12V8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 12h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Post an Item</span>
          </button>
        ) : null}
      </div>

      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => goHash('#/')}>
        CFP
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {loggedIn && (
          <button className="btn" type="button" onClick={() => goHash('#/committees')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Committees</span>
          </button>
        )}
        <button className="btn" type="button" onClick={() => goHash('#/statistics')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 13v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 8v10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17 3v15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Statistics</span>
        </button>
        {role === 'Moderator' ? (
          <button className="btn" type="button" onClick={() => goHash('#/mod')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 12c2.7614 0 5-2.2386 5-5s-2.2386-5-5-5-5 2.2386-5 5 2.2386 5 5 5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21c0-4.4183-3.5817-8-8-8H11c-4.4183 0-8 3.5817-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Mod Page</span>
          </button>
        ) : null}

        <div ref={ref} style={{ position: 'relative' }}>
          <button className="btn" type="button" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }} aria-expanded={open} aria-haspopup>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Account</span>
          </button>
          {open ? (
            <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', color: '#222', border: '1px solid #ccc', padding: 8, minWidth: 140, zIndex: 50 }}>
              {loggedIn ? (
                <div>
                  <div style={{ padding: 6, cursor: 'pointer' }} onClick={() => { const id = localStorage.getItem('logged_in_id'); if (id) { goHash(`#/member/${id}`) } else { goHash('#/login') } }}>Profile</div>
                  <div style={{ padding: 6, cursor: 'pointer' }} onClick={() => { setShowRefBox(true); setRefMessage('') }}>Reference</div>
                  <div style={{ padding: 6, cursor: 'pointer' }} onClick={logout}>Logout</div>
                </div>
              ) : (
                <div>
                  <div style={{ padding: 6, cursor: 'pointer' }} onClick={() => { setShowLoginPopup(true); setOpen(false) }}>Log In</div>
                  <div style={{ padding: 6, cursor: 'pointer' }} onClick={() => { setShowSignupPopup(true); setOpen(false) }}>Sign Up</div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
    {showRefBox ? (
      <MessagePopup onClose={() => setShowRefBox(false)}>
        <div>
          <h3>Refer a person</h3>
          <p>Enter the email address of the person you want to refer</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input value={refEmail} onChange={e => setRefEmail(e.target.value)} placeholder="email@example.com" style={{ flex: 1 }} />
            <button className="btn" type="button" onClick={sendReference} disabled={refLoading}>{refLoading ? 'Sending...' : 'Send'}</button>
            <button className="btn" type="button" onClick={() => setShowRefBox(false)}>Cancel</button>
          </div>
          {refMessage ? <div style={{ marginTop: 8, color: refMessage === 'Reference added' ? 'darkgreen' : 'darkred' }}>{refMessage}</div> : null}
        </div>
      </MessagePopup>
    ) : null}
    {showAuthorBox ? (
      <MessagePopup onClose={() => setShowAuthorBox(false)}>
        <AddItemForm onClose={() => setShowAuthorBox(false)} />
      </MessagePopup>
    ) : null}
    {showLoginPopup ? (
      <LoginPopup onClose={() => setShowLoginPopup(false)} onAuth={onAuthed} />
    ) : null}
    {showSignupPopup ? (
      <SignupPopup onClose={() => setShowSignupPopup(false)} onAuth={onAuthed} />
    ) : null}
    </>
  )
}

export default Header
