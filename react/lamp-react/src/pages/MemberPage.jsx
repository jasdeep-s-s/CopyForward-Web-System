// by Pascal Ypperciel, 40210921
import React, { useEffect, useState } from 'react'
import './ItemPage.css'
import MessagePopup from './MessagePopup'

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
  const [pending, setPending] = useState([])
  const [downloads, setDownloads] = useState([])
  const [contributions, setContributions] = useState([])
  const [committees, setCommittees] = useState([])
  const [showJoinPopup, setShowJoinPopup] = useState(false)
  const [allCommittees, setAllCommittees] = useState([])
  const [requestedIds, setRequestedIds] = useState([])

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

  useEffect(() => {
    if (!member || !member.ORCID) return
    if (localStorage.getItem('logged_in_role') !== 'author') return
    const orcid = member.ORCID
    fetch(`/member_pending_items.php?orcid=${encodeURIComponent(orcid)}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setPending(data)
        else setPending([])
      }).catch(() => setPending([]))
  }, [member])

  useEffect(() => {
    if (!member || !member.MemberID) return
    const id = Number(member.MemberID)
    fetch(`/member_downloads.php?member=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDownloads(d); else setDownloads([]) })
      .catch(() => setDownloads([]))

    fetch(`/member_contributions.php?member=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setContributions(d); else setContributions([]) })
      .catch(() => setContributions([]))
    fetch(`/member_committees.php?member=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCommittees(d); else setCommittees([]) })
      .catch(() => setCommittees([]))
  }, [member])

  function messageMember() {
    const logged = localStorage.getItem('logged_in_id')
    if (!logged) { alert('Please sign in to message'); return }
    if (!member.PrimaryEmail) { alert('No email available for this member'); return }
    window.location.hash = `#/message/${encodeURIComponent(member.PrimaryEmail)}`
  }

  function addOrcid() {
    const logged = localStorage.getItem('logged_in_id')
    if (!logged) { alert('Please sign in to add ORCID'); return }
    const orcid = window.prompt('Enter your ORCID:')
    if (!orcid) return
    const regex = /^\d{4}-\d{4}-\d{4}-\d{4}$/
    if (!regex.test(orcid.trim())) {
      alert('Invalid ORCID format. Expected like 0000-0000-0000-0000');
      return
    }

    fetch('/update_orcid.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: Number(logged), orcid: orcid.trim() })
    }).then(r => r.json())
      .then(d => {
        if (d && d.success) {
          localStorage.setItem('logged_in_role', 'author')
          if (member && Number(member.MemberID) === Number(logged)) loadMember(Number(logged))
          alert('ORCID updated')
        } else {
          if (d && d.error) {
            if (d.error === 'orcid_in_use') alert('That ORCID is already in use by another account.')
            else if (d.error === 'invalid_orcid_format') alert('ORCID format is invalid.')
            else if (d.error === 'missing_params') alert('Missing parameters sent to server.')
            else alert('Failed to update ORCID: ' + d.error)
          } else {
            alert('Failed to update ORCID')
          }
        }
      }).catch(() => alert('Network error'))
  }

  const headerTitle = member ? (member.Username ? `${member.Username}'s Profile` : (member.Name ? `${member.Name}'s Profile` : 'Member Profile')) : 'Member Profile'
  const loggedId = Number(localStorage.getItem('logged_in_id'))
  const isOwn = member && Number(member.MemberID) === loggedId
  const role = localStorage.getItem('logged_in_role') || ''

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
            {isOwn ? (
              role === 'regular' ? (
                <button className="btn" onClick={addOrcid}>Add ORCID</button>
              ) : null
            ) : (
              <button className="btn" onClick={messageMember}>Message</button>
            )}
          </div>
        </div>
      ) : null}

      {member ? (
        <section className="versions" style={{ marginTop: 20 }}>
          <h2>Committees</h2>
          <div style={{ marginTop: 8 }}>
              {committees.length ? (
              <ul className="versions-list">
                {committees.map((c, idx) => (
                  <li key={idx}>
                    <span className="version-label">{c.CommitteeName || 'Unnamed committee'}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">No committees</div>
            )}
              {isOwn ? (
                <div style={{ marginTop: 8 }}>
                  <button className="btn" onClick={async () => {
                    setShowJoinPopup(true)
                    try {
                      const res = await fetch('/committees.php')
                      if (res.ok) {
                        const json = await res.json()
                        setAllCommittees(Array.isArray(json) ? json : [])
                      }
                    } catch (e) {
                      console.error('failed to load committees', e)
                      setAllCommittees([])
                    }
                  }}>Request to Join a Committee</button>
                </div>
              ) : null}
          </div>
        </section>

      ) : null}

      {member ? (
        <section className="versions" style={{ marginTop: 20 }}>
          <h2>Downloads</h2>
          <div style={{ marginTop: 8 }}>
            {downloads.length ? (
              <ul className="versions-list">
                {downloads.map((d, idx) => (
                  <li key={idx}>
                    <span className="version-label">{d.ItemTitle || 'Unknown item'}</span>
                    {d.DownloadDate ? <span className="version-date"> - {d.DownloadDate}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">No downloads</div>
            )}
          </div>
        </section>
      ) : null}

      {member ? (
        <section className="versions" style={{ marginTop: 20 }}>
          <h2>Contributions</h2>
          <div style={{ marginTop: 8 }}>
            {contributions.length ? (
              <ul className="versions-list">
                {contributions.map((c, idx) => (
                  <li key={idx}>
                    <span className="version-label">{c.ItemTitle || 'Unknown item'}</span>
                    {typeof c.Amount !== 'undefined' ? <span style={{ marginLeft: 8 }}>${Number(c.Amount).toFixed(2)}</span> : null}
                    {c.DonationDate ? <span className="version-date"> - {c.DonationDate}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">No contributions</div>
            )}
          </div>
        </section>
      ) : null}

      {member && member.ORCID ? (
        <section className="versions" style={{ marginTop: 20 }}>
          <h2>Authored Items</h2>
          <div style={{ marginTop: 8 }}>
            {items.length ? (
              <ul className="versions-list">
                {(() => {
                  const nodes = {}
                  for (const it of items) {
                    nodes[Number(it.ItemID)] = it
                  }

                  const roots = []
                  const childrenByRoot = {}

                  for (const it of items) {
                    const id = Number(it.ItemID)
                    const pid = it.ParentTitleID ? Number(it.ParentTitleID) : 0
                    if (pid === 0 || !nodes[pid]) {
                      roots.push(it)
                      childrenByRoot[id] = childrenByRoot[id] || []
                    }
                  }

                  for (const it of items) {
                    const id = Number(it.ItemID)
                    const pid = it.ParentTitleID ? Number(it.ParentTitleID) : 0
                    if (pid === 0) continue
                    let curPid = pid
                    let steps = 0
                    while (curPid && nodes[curPid] && steps < 50) {
                      const parent = nodes[curPid]
                      const parentPid = parent.ParentTitleID ? Number(parent.ParentTitleID) : 0
                      if (parentPid === 0 || !nodes[parentPid]) {
                        childrenByRoot[curPid] = childrenByRoot[curPid] || []
                        childrenByRoot[curPid].push(it)
                        break
                      }
                      curPid = parentPid
                      steps += 1
                    }
                    if (steps >= 50) {
                      roots.push(it)
                      childrenByRoot[id] = childrenByRoot[id] || []
                    }
                  }

                  roots.sort((a, b) => new Date(a.UploadDate) - new Date(b.UploadDate))

                  return roots.map(parent => (
                    <li key={parent.ItemID}>
                      <a className="version-link" href={`#/items/${parent.ItemID}`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${parent.ItemID}` }}>
                        <span className="version-label">{parent.Title || `Item ${parent.ItemID}`}</span>
                      </a>
                      {parent.UploadDate ? <span className="version-date"> - {parent.UploadDate}</span> : null}
                      <div style={{ fontSize: '0.9rem', color: '#555', marginTop: 4 }}>
                        Downloads: {parent.DownloadCount || 0} - Raised: ${Number(parent.TotalDonations || 0).toFixed(2)}
                      </div>
                      {(childrenByRoot[parent.ItemID] || []).map(child => (
                        <div key={child.ItemID} style={{ marginLeft: 18, marginTop: 8 }}>
                          <a className="version-link" href={`#/items/${child.ItemID}`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${child.ItemID}` }}>
                            <span className="version-label">{child.Title || `Item ${child.ItemID}`}</span>
                          </a>
                          {child.UploadDate ? <span className="version-date"> - {child.UploadDate}</span> : null}
                          <div style={{ fontSize: '0.9rem', color: '#555', marginTop: 4 }}>
                            Downloads: {child.DownloadCount || 0} - Raised: ${Number(child.TotalDonations || 0).toFixed(2)}
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

      {member && member.ORCID && isOwn && role === 'author' ? (
        <section className="versions" style={{ marginTop: 20 }}>
          <h2>Pending Approval</h2>
          <div style={{ marginTop: 8 }}>
            {pending.length ? (
              <ul className="versions-list">
                {pending.map(p => (
                  <li key={p.ItemID}>
                    <a className="version-link" href={`#/items/${p.ItemID}`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${p.ItemID}` }}>
                      <span className="version-label">{p.Title || `Item ${p.ItemID}`}</span>
                    </a>
                    {p.UploadDate ? <span className="version-date"> - {p.UploadDate}</span> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">No pending items</div>
            )}
          </div>
        </section>
      ) : null}

      {!member && !loading && !error ? <div>Select a member or open a member URL like #/member/123</div> : null}

      {showJoinPopup ? (
        <MessagePopup onClose={() => setShowJoinPopup(false)}>
          <div>
            <h2>Request to Join a Committee</h2>
            <div style={{ marginTop: 8 }}>
              {allCommittees.length ? (
                <ul className="versions-list">
                  {allCommittees.map((c) => {
                    const already = committees.some(mc => (mc.CommitteeName || '').toLowerCase() === (c.Name || '').toLowerCase())
                    const requested = requestedIds.includes(Number(c.CommitteeID))
                    return (
                      <li key={c.CommitteeID} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ maxWidth: '75%' }}>
                          <div style={{ fontWeight: 700 }}>{c.Name}</div>
                          {c.Description ? <div style={{ fontSize: '0.9rem', color: '#555' }}>{c.Description}</div> : null}
                        </div>
                        <div>
                          {already ? (
                            <button className="btn" disabled>Member</button>
                          ) : requested ? (
                            <button className="btn" disabled>Requested</button>
                          ) : (
                            <button className="btn" onClick={async () => {
                              const logged = localStorage.getItem('logged_in_id')
                              if (!logged) { alert('Please sign in to request committee membership'); return }
                              try {
                                const res = await fetch('/request_join_committee.php', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ memberId: Number(logged), committeeId: Number(c.CommitteeID) })
                                })
                                const j = await res.json()
                                if (j && j.success) {
                                  setRequestedIds(prev => Array.from(new Set([...prev, Number(c.CommitteeID)])))
                                  alert('Request submitted')
                                } else {
                                  if (j && j.error) alert('Failed to request: ' + j.error)
                                  else alert('Failed to request')
                                }
                              } catch (err) {
                                console.error('request join error', err)
                                alert('Network error while requesting membership')
                              }
                            }}>Request</button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <div className="empty">No committees available</div>
              )}
            </div>
          </div>
        </MessagePopup>
      ) : null}
    </div>
  )
}

export default MemberPage
