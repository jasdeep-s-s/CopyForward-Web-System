import React, { useEffect, useState } from 'react'
import './ItemPage.css'

function DiscussionMessageList({ discussionId }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState([])
  const [details, setDetails] = useState(null)
  const [counts, setCounts] = useState(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [voteChoice, setVoteChoice] = useState(null)
  const [submittingVote, setSubmittingVote] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [postingMessage, setPostingMessage] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const r = await fetch(`/discussion_messages.php?discussion=${encodeURIComponent(discussionId)}`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        if (!cancelled) setMessages(Array.isArray(d) ? d : [])

        try {
          const rd = await fetch(`/discussion_details.php?discussion=${encodeURIComponent(discussionId)}`)
          if (rd.ok) {
            const dd = await rd.json()
            if (!cancelled) setDetails(dd)
          }
        } catch {}

        try {
          const logged = localStorage.getItem('logged_in_id')
          const url = `/discussion_vote.php?discussion=${encodeURIComponent(discussionId)}` + (logged ? `&voter=${encodeURIComponent(logged)}` : '')
          const rv = await fetch(url)
          if (rv.ok) {
            const dv = await rv.json()
            if (!cancelled && dv && dv.success) {
              setCounts(dv.counts || { TrueCount: 0, FalseCount: 0 })
              setHasVoted(!!dv.hasVoted)
            }
          }
        } catch {}
      } catch (e) {
        console.error('discussion messages fetch error', e)
        if (!cancelled) setError('Messages not available')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    if (discussionId) load()
    return () => { cancelled = true }
  }, [discussionId])

  async function postMessage() {
    const logged = localStorage.getItem('logged_in_id')
    if (!logged) { alert('You must be signed in to post a message.'); return }
    const trimmed = (newMessage || '').trim()
    if (!trimmed) { alert('Message is empty'); return }
    setPostingMessage(true)
    try {
      const res = await fetch('/post_discussion_message.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discussionId: discussionId, senderId: parseInt(logged, 10), message: trimmed })
      })
      const j = await res.json()
      if (j && j.success) {
        setNewMessage('')
        try {
          const r = await fetch(`/discussion_messages.php?discussion=${encodeURIComponent(discussionId)}`)
          if (r.ok) {
            const d = await r.json()
            setMessages(Array.isArray(d) ? d : [])
          }
        } catch {}

        try {
          const url = `/discussion_vote.php?discussion=${encodeURIComponent(discussionId)}&voter=${encodeURIComponent(logged)}`
          const rv = await fetch(url)
          if (rv.ok) {
            const dv = await rv.json()
            if (dv && dv.success) setCounts(dv.counts || { TrueCount: 0, FalseCount: 0 })
          }
        } catch {}
      } else {
        alert((j && j.error) ? j.error : 'Failed to post message')
      }
    } catch (err) {
      console.error('post message error', err)
      alert('Network error while posting message')
    } finally {
      setPostingMessage(false)
    }
  }

  return (
    <div style={{ padding: 8, background: '#fafafa', border: '1px solid #eee' }}>
      {loading ? (
        <div>Loading messages…</div>
      ) : error ? (
        <div className="empty">{error}</div>
      ) : (
        <div>
          {details && details.VotingDeadline ? (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {details.CommitteeID === 1 ? 'Was this item plagiarized?' : (details.CommitteeID === 2 ? 'Is the appeal approved?' : 'Vote')}
              </div>

              {(() => {
                const deadline = new Date(details.VotingDeadline)
                const now = new Date()
                const passed = !isNaN(deadline.getTime()) && now > deadline
                return passed ? (
                  <div>
                    <div><strong>Results</strong></div>
                    <div>Yes: {counts ? counts.TrueCount : 0}</div>
                    <div>No: {counts ? counts.FalseCount : 0}</div>
                  </div>
                ) : (
                  <div>
                    {hasVoted ? (
                      <div>You have submitted your vote already.</div>
                    ) : (
                      <div>
                        <label style={{ marginRight: 12 }}>
                          <input type="radio" name={`vote-${discussionId}`} value="1" checked={voteChoice === true} onChange={() => setVoteChoice(true)} /> Yes
                        </label>
                        <label style={{ marginRight: 12 }}>
                          <input type="radio" name={`vote-${discussionId}`} value="0" checked={voteChoice === false} onChange={() => setVoteChoice(false)} /> No
                        </label>
                        <button className="btn" disabled={voteChoice === null || submittingVote} onClick={async () => {
                          const logged = localStorage.getItem('logged_in_id')
                          if (!logged) { alert('You must be signed in to vote.'); return }
                          setSubmittingVote(true)
                          try {
                            const res = await fetch('/discussion_vote.php', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ voterId: parseInt(logged, 10), discussionId: discussionId, vote: !!voteChoice })
                            })
                            const j = await res.json()
                            if (j && j.success) {
                              setHasVoted(true)
                              const rv = await fetch(`/discussion_vote.php?discussion=${encodeURIComponent(discussionId)}&voter=${encodeURIComponent(logged)}`)
                              if (rv.ok) {
                                const dv = await rv.json()
                                if (dv && dv.success) setCounts(dv.counts)
                              }
                            } else {
                              alert((j && j.error) ? j.error : 'Failed to submit vote')
                            }
                          } catch (err) {
                            console.error('vote submit error', err)
                            alert('Network error while submitting vote')
                          } finally {
                            setSubmittingVote(false)
                          }
                        }}>Submit vote</button>
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          ) : null}

          {(messages && messages.length) ? (
            messages.map((m, i) => (
              <div key={i} style={{ padding: 8, borderBottom: '1px solid #eee' }}>
                <div style={{ fontWeight: 600 }}>{m.Username || 'Unknown'}</div>
                <div style={{ color: '#333', whiteSpace: 'pre-wrap', marginTop: 6 }}>{m.Message || ''}</div>
                <div style={{ fontSize: '0.85rem', color: '#666', marginTop: 6 }}>{m.Date || ''}</div>
              </div>
            ))
          ) : (
            <div className="empty">No messages</div>
          )}

          <div style={{ marginTop: 12, paddingTop: 8 }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Post a message</div>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: 8, fontSize: '0.95rem', boxSizing: 'border-box' }}
              placeholder="Write a message to the discussion..."
            />
            <div style={{ marginTop: 8 }}>
              <button className="btn" disabled={postingMessage || !(newMessage || '').trim()} onClick={postMessage}>
                {postingMessage ? 'Posting…' : 'Post message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiscussionMessageList
