// Committees Page - View committees, discussions, and vote
// by Jasdeep S. Sandhu, 40266557

import React, { useState, useEffect } from 'react'
import './ItemPage.css'

function CommitteesPage() {
  const [committees, setCommittees] = useState([])
  const [selectedCommittee, setSelectedCommittee] = useState(null)
  const [discussions, setDiscussions] = useState([])
  const [selectedDiscussion, setSelectedDiscussion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [posting, setPosting] = useState(false)
  const [showAppealBox, setShowAppealBox] = useState(false)
  const [appealMessage, setAppealMessage] = useState('')
  const [submittingAppeal, setSubmittingAppeal] = useState(false)

  useEffect(() => {
    loadCommittees()
  }, [])

  useEffect(() => {
    if (selectedCommittee) {
      loadDiscussions(selectedCommittee.CommitteeID)
    }
  }, [selectedCommittee])

  async function loadCommittees() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/committees_public.php')
      if (!res.ok) throw new Error('Failed to load committees')
      const data = await res.json()
      setCommittees(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function loadDiscussions(committeeId) {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/committee_discussions.php?committee=' + committeeId)
      if (!res.ok) throw new Error('Failed to load discussions')
      const data = await res.json()
      setDiscussions(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
      setDiscussions([])
    }
    setLoading(false)
  }

  async function loadDiscussionDetails(discussionId) {
    setError('')
    try {
      const res = await fetch('/committees_public.php?discussionId=' + discussionId)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load discussion')
      }
      const data = await res.json()
      if (data.success === false) {
        throw new Error(data.error || 'Access denied')
      }
      setSelectedDiscussion(data)
    } catch (e) {
      setError(e.message)
      setSelectedDiscussion(null)
    }
  }

  async function postMessage() {
    if (!newMessage.trim()) return
    
    setPosting(true)
    setError('')
    try {
      const res = await fetch('/committees_public.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discussionId: selectedDiscussion.DiscussionID,
          message: newMessage
        })
      })
      
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to post message')
      }
      
      setSuccess('Message posted')
      setNewMessage('')
      loadDiscussionDetails(selectedDiscussion.DiscussionID)
    } catch (e) {
      setError(e.message)
    }
    setPosting(false)
  }

  async function submitVote(vote) {
    setError('')
    const memberId = localStorage.getItem('logged_in_id')
    
    try {
      const res = await fetch('/discussion_vote.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voterId: parseInt(memberId),
          discussionId: selectedDiscussion.DiscussionID,
          vote: vote
        })
      })
      
      const data = await res.json()
      
      if (!data.success) {
        if (data.error === 'must_download_item') {
          setError('You must download the item before voting')
        } else if (data.error === 'already_voted') {
          setError('You have already voted on this discussion')
        } else {
          setError(data.error || 'Failed to submit vote')
        }
        return
      }
      
      setSuccess('Vote submitted successfully')
      loadDiscussionDetails(selectedDiscussion.DiscussionID)
    } catch (e) {
      setError(e.message)
    }
  }

  async function submitAppeal() {
    if (!appealMessage.trim()) {
      setError('Please enter an appeal message')
      return
    }

    setSubmittingAppeal(true)
    setError('')
    
    try {
      const res = await fetch('/appeal.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discussionId: selectedDiscussion.DiscussionID,
          message: appealMessage
        })
      })
      
      const data = await res.json()
      
      if (!data.success) {
        setError(data.error || 'Failed to submit appeal')
        setSubmittingAppeal(false)
        return
      }
      
      setSuccess('Appeal submitted successfully. The Appeal Committee will review your case.')
      setAppealMessage('')
      setShowAppealBox(false)
      loadDiscussionDetails(selectedDiscussion.DiscussionID)
    } catch (e) {
      setError(e.message)
    }
    
    setSubmittingAppeal(false)
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString()
  }

  function isVotingActive(discussion) {
    if (!discussion.VoteActive) return false
    if (!discussion.VotingDeadline) return true
    return new Date(discussion.VotingDeadline) > new Date()
  }

  if (selectedDiscussion) {
    const votingActive = isVotingActive(selectedDiscussion)
    const canVote = votingActive && selectedDiscussion.HasDownloaded && !selectedDiscussion.HasVoted
    const votePercentage = selectedDiscussion.TotalVotes > 0 
      ? Math.round((selectedDiscussion.YesVotes / selectedDiscussion.TotalVotes) * 100) 
      : 0

    return (
      <div className="item-page">
        <header className="item-header">
          <button className="btn" onClick={() => { setSelectedDiscussion(null); setSuccess(''); setError('') }} style={{ marginBottom: 12 }}>← Back to Discussions</button>
          <h1 className="item-title">{selectedDiscussion.Subject}</h1>
          <div style={{ marginTop: 8 }}>
            <strong>Committee:</strong> {selectedDiscussion.CommitteeName}<br />
            <strong>Item:</strong> {selectedDiscussion.ItemTitle}<br />
            <strong>Author:</strong> {selectedDiscussion.AuthorName || 'Unknown'}<br />
            <strong>Status:</strong> <span style={{ 
              color: selectedDiscussion.Status === 'Blacklisted' ? 'darkred' : 
                     selectedDiscussion.Status === 'Dismissed' ? 'gray' : 
                     selectedDiscussion.Status === 'Closed' ? 'blue' : 'green' 
            }}>{selectedDiscussion.Status}</span>
          </div>
        </header>

        {error && <div style={{ color: 'darkred', marginTop: 12 }}>{error}</div>}
        {success && <div style={{ color: 'darkgreen', marginTop: 12 }}>{success}</div>}

        {/* Appeal Section - only for blacklisted items and item author */}
        {selectedDiscussion.Status === 'Blacklisted' && selectedDiscussion.IsAuthor && (
          <section style={{ marginTop: 20, padding: 16, border: '2px solid #ff3860', backgroundColor: '#fff5f5' }}>
            <h2>Submit Appeal</h2>
            <p>Your item has been blacklisted. You may appeal this decision to the Appeal Committee.</p>
            {!showAppealBox ? (
              <button className="btn" onClick={() => setShowAppealBox(true)} style={{ backgroundColor: '#ff3860', color: 'white' }}>
                Submit Appeal
              </button>
            ) : (
              <div style={{ marginTop: 12 }}>
                <textarea 
                  value={appealMessage}
                  onChange={e => setAppealMessage(e.target.value)}
                  placeholder="Explain why you believe the plagiarism decision was incorrect..."
                  rows={6}
                  style={{ width: '100%', padding: 8 }}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <button 
                    className="btn" 
                    onClick={submitAppeal} 
                    disabled={submittingAppeal || !appealMessage.trim()}
                    style={{ backgroundColor: '#ff3860', color: 'white' }}
                  >
                    {submittingAppeal ? 'Submitting...' : 'Submit Appeal'}
                  </button>
                  <button 
                    className="btn" 
                    onClick={() => { setShowAppealBox(false); setAppealMessage('') }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {selectedDiscussion.Status === 'Appeal' && (
          <section style={{ marginTop: 20, padding: 16, border: '2px solid #ffdd57', backgroundColor: '#fffbeb' }}>
            <h2>Appeal In Progress</h2>
            <p>This item is currently under appeal review by the Appeal Committee.</p>
          </section>
        )}

        {/* Voting Section */}
        {selectedDiscussion.VoteActive && (
          <section style={{ marginTop: 20, padding: 16, border: '2px solid #3273dc', backgroundColor: '#f0f8ff' }}>
            <h2>Voting Status</h2>
            <div style={{ marginTop: 8 }}>
              <strong>Deadline:</strong> {formatDate(selectedDiscussion.VotingDeadline)}<br />
              <strong>Total Votes:</strong> {selectedDiscussion.TotalVotes}<br />
              <strong>Yes Votes:</strong> {selectedDiscussion.YesVotes} ({votePercentage}%)<br />
              <strong>No Votes:</strong> {selectedDiscussion.NoVotes}<br />
              <strong>Required for Blacklist:</strong> 2/3 majority ({Math.ceil(selectedDiscussion.TotalVotes * 2 / 3)} votes)
            </div>
            
            {!selectedDiscussion.HasDownloaded && (
              <div style={{ marginTop: 12, color: 'darkred', fontWeight: 'bold' }}>
                ⚠ You must download the item to be eligible to vote
              </div>
            )}
            
            {selectedDiscussion.HasVoted && (
              <div style={{ marginTop: 12, color: 'darkgreen', fontWeight: 'bold' }}>
                ✓ You have voted: {selectedDiscussion.UserVote ? 'Yes (Blacklist)' : 'No (Keep)'}
              </div>
            )}
            
            {canVote && (
              <div style={{ marginTop: 12 }}>
                <button className="btn" onClick={() => submitVote(true)} style={{ marginRight: 8, backgroundColor: '#ff3860', color: 'white' }}>
                  Vote to Blacklist
                </button>
                <button className="btn" onClick={() => submitVote(false)} style={{ backgroundColor: '#23d160', color: 'white' }}>
                  Vote to Keep
                </button>
              </div>
            )}
            
            {!votingActive && (
              <div style={{ marginTop: 12, fontStyle: 'italic', color: 'gray' }}>
                Voting has ended
              </div>
            )}
          </section>
        )}

        {/* Discussion Messages */}
        <section style={{ marginTop: 20 }}>
          <h2>Discussion</h2>
          <div style={{ marginTop: 12 }}>
            {selectedDiscussion.Messages && selectedDiscussion.Messages.length > 0 ? (
              selectedDiscussion.Messages.map(msg => (
                <div key={msg.DiscussionMessageID} style={{ padding: 12, border: '1px solid #ddd', marginBottom: 8, backgroundColor: '#fafafa' }}>
                  <div style={{ fontWeight: 'bold', color: '#3273dc' }}>
                    {msg.SenderName} (@{msg.SenderUsername})
                    <span style={{ marginLeft: 12, fontWeight: 'normal', fontSize: '0.9rem', color: '#666' }}>
                      {formatDate(msg.Date)}
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>{msg.Message}</div>
                </div>
              ))
            ) : (
              <div style={{ color: 'gray', fontStyle: 'italic' }}>No messages yet</div>
            )}
          </div>
          
          {selectedDiscussion.IsCommitteeMember && (
            <div style={{ marginTop: 16 }}>
              <h3>Post Message (Committee Members Only)</h3>
              <textarea 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
                style={{ width: '100%', padding: 8 }}
              />
              <button 
                className="btn" 
                onClick={postMessage} 
                disabled={posting || !newMessage.trim()}
                style={{ marginTop: 8 }}
              >
                {posting ? 'Posting...' : 'Post Message'}
              </button>
            </div>
          )}
          
          {!selectedDiscussion.IsCommitteeMember && (
            <div style={{ marginTop: 16, color: 'gray', fontStyle: 'italic' }}>
              Only committee members can post messages
            </div>
          )}
        </section>
      </div>
    )
  }

  if (selectedCommittee) {
    return (
      <div className="item-page">
        <header className="item-header">
          <button className="btn" onClick={() => { setSelectedCommittee(null); setDiscussions([]) }} style={{ marginBottom: 12 }}>← Back to Committees</button>
          <h1 className="item-title">{selectedCommittee.Name}</h1>
          <p>{selectedCommittee.Description}</p>
          <div style={{ marginTop: 8 }}>
            <strong>Members:</strong> {selectedCommittee.MemberCount}<br />
            {selectedCommittee.IsApproved && <span style={{ color: 'green' }}>✓ You are a member of this committee</span>}
            {selectedCommittee.IsMember && !selectedCommittee.IsApproved && <span style={{ color: 'orange' }}>⏳ Your membership is pending approval</span>}
          </div>
        </header>

        {error && <div style={{ color: 'darkred', marginTop: 12 }}>{error}</div>}
        
        <section style={{ marginTop: 20 }}>
          <h2>Discussions</h2>
          {loading ? (
            <div>Loading discussions...</div>
          ) : discussions.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              {discussions.map(disc => (
                <div 
                  key={disc.DiscussionID} 
                  style={{ padding: 12, border: '1px solid #ddd', marginBottom: 8, cursor: 'pointer', backgroundColor: '#fff' }}
                  onClick={() => loadDiscussionDetails(disc.DiscussionID)}
                >
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{disc.Subject}</div>
                  <div style={{ marginTop: 4, fontSize: '0.9rem', color: '#666' }}>
                    <strong>Item:</strong> {disc.ItemTitle}<br />
                    <strong>Status:</strong> <span style={{ 
                      color: disc.Status === 'Blacklisted' ? 'darkred' : 
                             disc.Status === 'Dismissed' ? 'gray' : 
                             disc.Status === 'Closed' ? 'blue' : 'green' 
                    }}>{disc.Status}</span>
                    {disc.VoteActive && <span style={{ marginLeft: 12, color: 'green', fontWeight: 'bold' }}>🗳 Voting Active</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 12, padding: 16, border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <div style={{ fontWeight: 'bold', marginBottom: 8 }}>No discussions available</div>
              <p style={{ margin: 0, color: '#666' }}>
                {selectedCommittee.IsApproved 
                  ? 'You can only view discussions for items you have downloaded. Download items from the main page to participate in discussions about them.'
                  : 'You must be an approved member of this committee to view discussions.'}
              </p>
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">Committees</h1>
        <p>View committees, participate in discussions, and vote on plagiarism cases</p>
      </header>

      {error && <div style={{ color: 'darkred', marginTop: 12 }}>{error}</div>}
      
      {loading ? (
        <div style={{ marginTop: 20 }}>Loading committees...</div>
      ) : (
        <section style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {committees.map(committee => (
              <div 
                key={committee.CommitteeID} 
                style={{ 
                  padding: 16, 
                  border: '2px solid #ddd', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  transition: 'border-color 0.2s'
                }}
                onClick={() => setSelectedCommittee(committee)}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3273dc'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#ddd'}
              >
                <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{committee.Name}</h2>
                <p style={{ marginTop: 8, color: '#666' }}>{committee.Description}</p>
                <div style={{ marginTop: 12, fontSize: '0.9rem' }}>
                  <strong>Discussions:</strong> {committee.DiscussionCount}<br />
                  <strong>Members:</strong> {committee.MemberCount}
                </div>
                {committee.IsApproved && (
                  <div style={{ marginTop: 8, color: 'green', fontWeight: 'bold' }}>✓ You are a member</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default CommitteesPage
