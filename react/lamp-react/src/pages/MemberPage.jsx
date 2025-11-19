import React, { useEffect, useState } from 'react'
import './ItemPage.css'

function getMemberIdFromHash() {
  const h = window.location.hash || ''
  const m = h.match(/^#\/member\/(\d+)/)
  if (m) return parseInt(m[1], 10)
  return null
}

function MemberPage ({ memberId: propMemberId }) {
  const [member, setMember] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    function onHash() {
      const idFromHash = getMemberIdFromHash()
      if (idFromHash) loadMember(idFromHash)
    }

    const initialId = propMemberId || getMemberIdFromHash()
    if (initialId) loadMember(initialId)

    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [propMemberId])

  function loadMember(id) {
    setLoading(true)
    setError('')
    setMember(null)
    fetch(`/member.php?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        setLoading(false)
        if (d && d.MemberID) setMember(d)
        else setError(d && d.error ? d.error : 'Member not found')
      })
      .catch(() => { setLoading(false); setError('Network error') })
  }

  function messageMember() {
    const logged = localStorage.getItem('logged_in_id')
    if (!logged) { alert('Please sign in to message'); return }
    if (!member.PrimaryEmail) { alert('No email available for this member'); return }
    window.location.hash = `#/message/${encodeURIComponent(member.PrimaryEmail)}`
  }

  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">Member Profile</h1>
      </header>

      {loading ? <div>Loading...</div> : null}
      {error ? <div style={{ color: 'darkred' }}>{error}</div> : null}

      {member ? (
        <div style={{ marginTop: 12 }}>
          {member.Role ? <div><strong>Role:</strong> {member.Role}</div> : null}
          {member.Name ? <div><strong>Name:</strong> {member.Name}</div> : null}
          {member.Username ? <div><strong>Username:</strong> {member.Username}</div> : null}
          {member.Organization ? <div><strong>Organization:</strong> {member.Organization}</div> : null}
          {member.PrimaryEmail ? <div><strong>Primary Email:</strong> {member.PrimaryEmail}</div> : null}
          {member.ORCID ? <div><strong>ORCID:</strong> {member.ORCID}</div> : null}
          <div style={{ marginTop: 12 }}>
            <button className="btn" onClick={messageMember}>Message</button>
          </div>
        </div>
      ) : null}

      {!member && !loading && !error ? <div>Select a member or open a member URL like #/member/123</div> : null}
    </div>
  )
}

export default MemberPage
