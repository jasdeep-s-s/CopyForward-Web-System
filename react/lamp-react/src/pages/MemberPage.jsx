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
  const [items, setItems] = useState([])

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
    setItems([])
  }

  useEffect(() => {
    if (!member || !member.ORCID) return
    const orcid = member.ORCID
    fetch(`/member_items.php?orcid=${encodeURIComponent(orcid)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setItems(data)
        else setItems([])
      })
      .catch(() => setItems([]))
  }, [member])

  function messageMember() {
    const logged = localStorage.getItem('logged_in_id')
    if (!logged) { alert('Please sign in to message'); return }
    if (!member.PrimaryEmail) { alert('No email available for this member'); return }
    window.location.hash = `#/message/${encodeURIComponent(member.PrimaryEmail)}`
  }

  const headerTitle = member ? (member.Username ? `${member.Username}'s Profile` : (member.Name ? `${member.Name}'s Profile` : 'Member Profile')) : 'Member Profile'

  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">{headerTitle}</h1>
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

      {member && member.ORCID ? (
        <section className="versions" style={{ marginTop: 20 }}>
          <h2>Authored Items</h2>
          <div style={{ marginTop: 8 }}>
            {items.length ? (
              <ul className="versions-list">
                {(() => {
                  const byParent = {}
                  const top = []
                  for (const it of items) {
                    const pid = it.ParentTitleID ? Number(it.ParentTitleID) : 0
                    if (pid === 0) top.push(it)
                    else {
                      if (!byParent[pid]) byParent[pid] = []
                      byParent[pid].push(it)
                    }
                  }
                  top.sort((a,b) => new Date(a.UploadDate) - new Date(b.UploadDate))
                  return top.map(parent => (
                    <li key={parent.ItemID}>
                      <a className="version-link" href={`#/items/${parent.ItemID}`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${parent.ItemID}` }}>
                        <span className="version-label">{parent.Title || `Item ${parent.ItemID}`}</span>
                      </a>
                      {parent.UploadDate ? <span className="version-date"> — {parent.UploadDate}</span> : null}
                      <div style={{ fontSize: '0.9rem', color: '#555', marginTop: 4 }}>
                        Downloads: {parent.DownloadCount || 0} — Raised: ${Number(parent.TotalDonations || 0).toFixed(2)}
                      </div>
                      {(byParent[parent.ItemID] || []).map(child => (
                        <div key={child.ItemID} style={{ marginLeft: 18, marginTop: 8 }}>
                          <a className="version-link" href={`#/items/${child.ItemID}`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${child.ItemID}` }}>
                            <span className="version-label">{child.Title || `Item ${child.ItemID}`}</span>
                          </a>
                          {child.UploadDate ? <span className="version-date"> — {child.UploadDate}</span> : null}
                          <div style={{ fontSize: '0.9rem', color: '#555', marginTop: 4 }}>
                            Downloads: {child.DownloadCount || 0} — Raised: ${Number(child.TotalDonations || 0).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </li>
                  ))
                })()}
              </ul>
            ) : (
              <div className="empty">No authored items found</div>
            )}
          </div>
        </section>
      ) : null}

      {!member && !loading && !error ? <div>Select a member or open a member URL like #/member/123</div> : null}
    </div>
  )
}

export default MemberPage
