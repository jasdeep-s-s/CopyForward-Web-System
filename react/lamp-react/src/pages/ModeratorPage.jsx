// Moderator Page - CRUD Management for Comments, Items, Members, Committees, Charities
// by Jasdeep S. Sandhu, 40266557

import React, { useState, useEffect } from 'react'
import './ItemPage.css'

function ModeratorPage() {
  const [activeTab, setActiveTab] = useState('comments')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Comments state
  const [comments, setComments] = useState([])
  
  // Items state
  const [items, setItems] = useState([])
  const [itemStatusFilter, setItemStatusFilter] = useState('')
  const [viewingItem, setViewingItem] = useState(null)
  const [itemDetails, setItemDetails] = useState(null)
  
  // Members state
  const [members, setMembers] = useState([])
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [memberFormData, setMemberFormData] = useState({})
  
  // Committees state
  const [committees, setCommittees] = useState([])
  const [showCommitteeForm, setShowCommitteeForm] = useState(false)
  const [editingCommittee, setEditingCommittee] = useState(null)
  const [committeeFormData, setCommitteeFormData] = useState({})
  
  // Charities state
  const [charities, setCharities] = useState([])
  const [showCharityForm, setShowCharityForm] = useState(false)
  const [editingCharity, setEditingCharity] = useState(null)
  const [charityFormData, setCharityFormData] = useState({})
  
  // Committee members state
  const [committeeMembers, setCommitteeMembers] = useState([])
  const [viewingCommitteeId, setViewingCommitteeId] = useState(null)
  
  // MFA state
  const [mfaMatrices, setMfaMatrices] = useState([])
  
  // Year filter for donations
  const [donationYear, setDonationYear] = useState('2023')

  useEffect(() => {
    if (activeTab === 'comments') loadComments()
    else if (activeTab === 'items') loadItems()
    else if (activeTab === 'members') loadMembers()
    else if (activeTab === 'committees') loadCommittees()
    else if (activeTab === 'charities') loadCharities()
    else if (activeTab === 'mfa') loadMfaMatrices()
  }, [activeTab, itemStatusFilter, donationYear])

  function requestWithOverride(url, method, payload = {}) {
    const body = method === 'POST' ? payload : { ...payload, _method: method }
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  }

  // Comments functions
  async function loadComments() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/mod_comments.php')
      if (!res.ok) throw new Error('Failed to load comments')
      const data = await res.json()
      setComments(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function toggleCommentPrivacy(commentId, currentPrivate) {
    try {
      const res = await requestWithOverride('/mod_comments.php', 'PUT', { commentId, private: currentPrivate ? 0 : 1 })
      if (!res.ok) throw new Error('Failed to update comment')
      setSuccess('Comment updated')
      await loadComments()
    } catch (e) {
      setError(e.message)
    }
  }

  async function deleteComment(commentId) {
    if (!confirm('Delete this comment?')) return
    try {
      const res = await requestWithOverride('/mod_comments.php', 'DELETE', { commentId })
      if (!res.ok) throw new Error('Failed to delete comment')
      setSuccess('Comment deleted')
      loadComments()
    } catch (e) {
      setError(e.message)
    }
  }

  // Items functions
  async function loadItems() {
    setLoading(true)
    setError('')
    try {
      const url = itemStatusFilter ? `/mod_items.php?status=${encodeURIComponent(itemStatusFilter)}` : '/mod_items.php'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to load items')
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function updateItemStatus(itemId, newStatus) {
    try {
      const res = await requestWithOverride('/mod_items.php', 'PUT', { itemId, status: newStatus })
      if (!res.ok) throw new Error('Failed to update item')
      setSuccess(`Item ${newStatus}`)
      loadItems()
    } catch (e) {
      setError(e.message)
    }
  }

  async function deleteItem(itemId) {
    if (!confirm('Delete this item? This will also delete related comments, downloads, and donations.')) return
    try {
      const res = await requestWithOverride('/mod_items.php', 'DELETE', { itemId })
      if (!res.ok) throw new Error('Failed to delete item')
      setSuccess('Item deleted')
      loadItems()
    } catch (e) {
      setError(e.message)
    }
  }

  async function viewItemDetails(itemId) {
    setError('')
    try {
      const res = await fetch(`/item_details.php?id=${itemId}`)
      if (!res.ok) throw new Error('Failed to load item details')
      const data = await res.json()
      setItemDetails(data)
      setViewingItem(itemId)
    } catch (e) {
      setError(e.message)
    }
  }

  function closeItemDetails() {
    setViewingItem(null)
    setItemDetails(null)
  }

  // Members functions
  async function loadMembers() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/mod_members.php?withDonations=true&year=${donationYear}`)
      if (!res.ok) throw new Error('Failed to load members')
      const data = await res.json()
      setMembers(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function saveMember() {
    setError('')
    try {
      const body = editingMember 
        ? { ...memberFormData, memberId: editingMember.MemberID }
        : memberFormData

      const res = editingMember
        ? await requestWithOverride('/mod_members.php', 'PUT', body)
        : await requestWithOverride('/mod_members.php', 'POST', body)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to save member')
      }
      setSuccess(editingMember ? 'Member updated' : 'Member created')
      setShowMemberForm(false)
      setEditingMember(null)
      setMemberFormData({})
      loadMembers()
    } catch (e) {
      setError(e.message)
    }
  }

  async function deleteMember(memberId) {
    if (!confirm('Delete this member? This will also delete all related data.')) return
    try {
      const res = await requestWithOverride('/mod_members.php', 'DELETE', { memberId })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete member')
      }
      setSuccess('Member deleted')
      loadMembers()
    } catch (e) {
      setError(e.message)
    }
  }

  function openMemberForm(member = null) {
    setEditingMember(member)
    setMemberFormData(member ? {
      name: member.Name,
      role: member.Role,
      organization: member.Organization || '',
      email: member.PrimaryEmail,
      recoveryEmail: member.RecoveryEmail || '',
      orcid: member.ORCID || ''
    } : {})
    setShowMemberForm(true)
    setError('')
  }

  // Committees functions
  async function loadCommittees() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/mod_committees.php')
      if (!res.ok) throw new Error('Failed to load committees')
      const data = await res.json()
      setCommittees(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function saveCommittee() {
    setError('')
    try {
      const body = editingCommittee
        ? { ...committeeFormData, committeeId: editingCommittee.CommitteeID }
        : committeeFormData

      const res = editingCommittee
        ? await requestWithOverride('/mod_committees.php', 'PUT', body)
        : await requestWithOverride('/mod_committees.php', 'POST', body)
      if (!res.ok) throw new Error('Failed to save committee')
      setSuccess(editingCommittee ? 'Committee updated' : 'Committee created')
      setShowCommitteeForm(false)
      setEditingCommittee(null)
      setCommitteeFormData({})
      loadCommittees()
    } catch (e) {
      setError(e.message)
    }
  }

  async function deleteCommittee(committeeId) {
    if (!confirm('Delete this committee?')) return
    try {
      const res = await requestWithOverride('/mod_committees.php', 'DELETE', { committeeId })
      if (!res.ok) throw new Error('Failed to delete committee')
      setSuccess('Committee deleted')
      loadCommittees()
    } catch (e) {
      setError(e.message)
    }
  }

  function openCommitteeForm(committee = null) {
    setEditingCommittee(committee)
    setCommitteeFormData(committee ? {
      name: committee.Name,
      description: committee.Description || ''
    } : {})
    setShowCommitteeForm(true)
    setError('')
  }

  // Charities functions
  async function loadCharities() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/mod_charities.php')
      if (!res.ok) throw new Error('Failed to load charities')
      const data = await res.json()
      setCharities(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function toggleCharityApproval(charityId, currentApproved) {
    try {
      const res = await requestWithOverride('/mod_charities.php', 'PUT', { charityId, approved: currentApproved ? 0 : 1 })
      if (!res.ok) throw new Error('Failed to update charity')
      setSuccess('Charity updated')
      loadCharities()
    } catch (e) {
      setError(e.message)
    }
  }

  async function saveCharity() {
    setError('')
    try {
      const body = editingCharity
        ? { ...charityFormData, charityId: editingCharity.ChildrenCharityID }
        : charityFormData
      
      const res = editingCharity
        ? await requestWithOverride('/mod_charities.php', 'PUT', body)
        : await requestWithOverride('/mod_charities.php', 'POST', body)
      if (!res.ok) throw new Error('Failed to save charity')
      setSuccess(editingCharity ? 'Charity updated' : 'Charity created')
      setShowCharityForm(false)
      setEditingCharity(null)
      setCharityFormData({})
      loadCharities()
    } catch (e) {
      setError(e.message)
    }
  }

  async function deleteCharity(charityId) {
    if (!confirm('Delete this charity?')) return
    try {
      const res = await requestWithOverride('/mod_charities.php', 'DELETE', { charityId })
      if (!res.ok) throw new Error('Failed to delete charity')
      setSuccess('Charity deleted')
      loadCharities()
    } catch (e) {
      setError(e.message)
    }
  }

  function openCharityForm(charity = null) {
    setEditingCharity(charity)
    setCharityFormData(charity ? {
      name: charity.Name,
      approved: charity.Approved ? 1 : 0
    } : { approved: 0 })
    setShowCharityForm(true)
    setError('')
  }

  // Committee members functions
  async function loadCommitteeMembers(committeeId) {
    setError('')
    try {
      const res = await fetch(`/mod_committee_members.php?committeeId=${committeeId}`)
      if (!res.ok) throw new Error('Failed to load committee members')
      const data = await res.json()
      setCommitteeMembers(Array.isArray(data) ? data : [])
      setViewingCommitteeId(committeeId)
    } catch (e) {
      setError(e.message)
    }
  }

  async function approveCommitteeMember(memberCommitteeId, approved) {
    try {
      const res = await requestWithOverride('/mod_committee_members.php', 'PUT', { memberCommitteeId, approved: approved ? 1 : 0 })
      if (!res.ok) throw new Error('Failed to update member')
      setSuccess('Member updated')
      loadCommitteeMembers(viewingCommitteeId)
    } catch (e) {
      setError(e.message)
    }
  }

  async function removeCommitteeMember(memberCommitteeId) {
    if (!confirm('Remove this member from committee?')) return
    try {
      const res = await requestWithOverride('/mod_committee_members.php', 'DELETE', { memberCommitteeId })
      if (!res.ok) throw new Error('Failed to remove member')
      setSuccess('Member removed from committee')
      loadCommitteeMembers(viewingCommitteeId)
    } catch (e) {
      setError(e.message)
    }
  }

  // MFA functions
  async function loadMfaMatrices() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/mod_mfa.php')
      if (!res.ok) throw new Error('Failed to load MFA matrices')
      const data = await res.json()
      setMfaMatrices(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function regenerateMfaMatrix(mfaMatrixId) {
    if (!confirm('Regenerate this MFA matrix? The user will need the new matrix.')) return
    try {
      const res = await requestWithOverride('/mod_mfa.php', 'PUT', { mfaMatrixId })
      if (!res.ok) throw new Error('Failed to regenerate matrix')
      const data = await res.json()
      setSuccess(`Matrix regenerated: ${data.newMatrix}`)
      loadMfaMatrices()
    } catch (e) {
      setError(e.message)
    }
  }

  async function regenerateExpiringMatrices() {
    if (!confirm('Regenerate all expired/expiring matrices (next 48h)? Users will be notified.')) return
    try {
      setError('')
      const res = await fetch('/mfa_regenerate_expiring.php', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to regenerate expiring matrices')
      const data = await res.json()
      const regenerated = typeof data.regenerated === 'number' ? data.regenerated : 0
      setSuccess(`Regenerated ${regenerated} expiring matrices`)
      loadMfaMatrices()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">Moderator Dashboard</h1>
      </header>

      {error && <div style={{ color: 'darkred', marginTop: 12 }}>{error}</div>}
      {success && <div style={{ color: 'darkgreen', marginTop: 12 }}>{success}</div>}

      {/* Tabs */}
      <div style={{ marginTop: 20, borderBottom: '2px solid #ddd' }}>
        <button 
          className={activeTab === 'comments' ? 'btn' : 'btn-secondary'}
          onClick={() => setActiveTab('comments')}
          style={{ marginRight: 8, marginBottom: -2, borderBottom: activeTab === 'comments' ? '2px solid #3273dc' : 'none' }}
        >
          Comments
        </button>
        <button 
          className={activeTab === 'items' ? 'btn' : 'btn-secondary'}
          onClick={() => setActiveTab('items')}
          style={{ marginRight: 8, marginBottom: -2, borderBottom: activeTab === 'items' ? '2px solid #3273dc' : 'none' }}
        >
          Items
        </button>
        <button 
          className={activeTab === 'members' ? 'btn' : 'btn-secondary'}
          onClick={() => setActiveTab('members')}
          style={{ marginRight: 8, marginBottom: -2, borderBottom: activeTab === 'members' ? '2px solid #3273dc' : 'none' }}
        >
          Members
        </button>
        <button 
          className={activeTab === 'committees' ? 'btn' : 'btn-secondary'}
          onClick={() => setActiveTab('committees')}
          style={{ marginRight: 8, marginBottom: -2, borderBottom: activeTab === 'committees' ? '2px solid #3273dc' : 'none' }}
        >
          Committees
        </button>
        <button 
          className={activeTab === 'charities' ? 'btn' : 'btn-secondary'}
          onClick={() => setActiveTab('charities')}
          style={{ marginRight: 8, marginBottom: -2, borderBottom: activeTab === 'charities' ? '2px solid #3273dc' : 'none' }}
        >
          Charities
        </button>
        <button 
          className={activeTab === 'mfa' ? 'btn' : 'btn-secondary'}
          onClick={() => setActiveTab('mfa')}
          style={{ marginBottom: -2, borderBottom: activeTab === 'mfa' ? '2px solid #3273dc' : 'none' }}
        >
          MFA Matrices
        </button>
      </div>

      {loading && <div style={{ marginTop: 20 }}>Loading...</div>}

      {/* Comments Tab */}
      {activeTab === 'comments' && !loading && (
        <div style={{ marginTop: 20 }}>
          <h2>Manage Comments</h2>
          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Item</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Commentor</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Comment</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Date</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Private</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(c => (
                <tr key={c.CommentID}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.CommentID}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.ItemTitle || c.ItemID}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.CommentorUsername || c.CommentorID}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.Comment}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.Date ? new Date(c.Date).toLocaleDateString() : ''}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.Private ? 'No' : 'Yes'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => toggleCommentPrivacy(c.CommentID, c.Private)}>
                      {c.Private ? 'Make Public' : 'Make Private'}
                    </button>
                    <button className="btn" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ff3860', color: 'white' }} onClick={() => deleteComment(c.CommentID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {comments.length === 0 && <div style={{ marginTop: 12 }}>No comments found</div>}
        </div>
      )}

      {/* Items Tab */}
      {activeTab === 'items' && !loading && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Manage Items</h2>
            <div>
              <label style={{ marginRight: 8 }}>Filter by status:</label>
              <select value={itemStatusFilter} onChange={e => setItemStatusFilter(e.target.value)}>
                <option value="">All</option>
                <option value="Under Review (Upload)">Under Review (Upload)</option>
                <option value="Available">Available</option>
                <option value="Under Review (Plagiarism)">Under Review (Plagiarism)</option>
                <option value="Removed">Removed</option>
                <option value="Deleted (Author)">Deleted (Author)</option>
              </select>
            </div>
          </div>
          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Title</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Author</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Type</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Upload Date</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.ItemID}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.ItemID}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.Title}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.AuthorName || item.AuthorID}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.Type}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.Status}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{item.UploadDate ? new Date(item.UploadDate).toLocaleDateString() : ''}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <button 
                      className="btn" 
                      style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px' }} 
                      onClick={() => viewItemDetails(item.ItemID)}
                    >
                      View Details
                    </button>
                    {item.Status === 'Under Review (Upload)' && (
                      <>
                        <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#23d160', color: 'white' }} onClick={() => updateItemStatus(item.ItemID, 'Available')}>Approve</button>
                        <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ff3860', color: 'white' }} onClick={() => updateItemStatus(item.ItemID, 'Removed')}>Decline</button>
                      </>
                    )}
                    <button className="btn" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ff3860', color: 'white' }} onClick={() => deleteItem(item.ItemID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && <div style={{ marginTop: 12 }}>No items found</div>}
          
          {/* Item Details Modal */}
          {viewingItem && itemDetails && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: 24,
                borderRadius: 8,
                maxWidth: '800px',
                maxHeight: '90vh',
                overflow: 'auto',
                width: '90%'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ margin: 0 }}>{itemDetails.Title}</h2>
                  <button 
                    className="btn" 
                    onClick={closeItemDetails}
                    style={{ fontSize: '1.2rem', padding: '4px 12px' }}
                  >
                    ×
                  </button>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}><strong>Author:</strong> {itemDetails.AuthorName || itemDetails.AuthorID}</div>
                  <div style={{ marginBottom: 8 }}><strong>Type:</strong> {itemDetails.Type}</div>
                  <div style={{ marginBottom: 8 }}><strong>Status:</strong> {itemDetails.Status}</div>
                  <div style={{ marginBottom: 8 }}><strong>Upload Date:</strong> {itemDetails.UploadDate ? new Date(itemDetails.UploadDate).toLocaleDateString() + ' ' + new Date(itemDetails.UploadDate).toLocaleTimeString() : ''}</div>
                  {itemDetails.PublicationDate && <div style={{ marginBottom: 8 }}><strong>Publication Date:</strong> {new Date(itemDetails.PublicationDate).toLocaleDateString()}</div>}
                  {itemDetails.DOI && <div style={{ marginBottom: 8 }}><strong>DOI:</strong> {itemDetails.DOI}</div>}
                  {itemDetails.Volume && <div style={{ marginBottom: 8 }}><strong>Volume:</strong> {itemDetails.Volume}</div>}
                  {itemDetails.Issue && <div style={{ marginBottom: 8 }}><strong>Issue:</strong> {itemDetails.Issue}</div>}
                  {itemDetails.PageStart && itemDetails.PageEnd && (
                    <div style={{ marginBottom: 8 }}><strong>Pages:</strong> {itemDetails.PageStart}-{itemDetails.PageEnd}</div>
                  )}
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <h3>Content:</h3>
                  <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{itemDetails.Content || 'No content provided'}</p>
                </div>
                
                {itemDetails.FilePath && (
                  <div style={{ marginBottom: 16 }}>
                    <strong>File:</strong> <a href={itemDetails.FilePath} target="_blank" rel="noopener noreferrer" style={{ color: '#3273dc' }}>Download PDF</a>
                  </div>
                )}
                
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #ddd', display: 'flex', gap: 8 }}>
                  {itemDetails.Status === 'Under Review (Upload)' && (
                    <>
                      <button 
                        className="btn" 
                        style={{ backgroundColor: '#23d160', color: 'white' }} 
                        onClick={() => {
                          updateItemStatus(itemDetails.ItemID, 'Available')
                          closeItemDetails()
                        }}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn" 
                        style={{ backgroundColor: '#ff3860', color: 'white' }} 
                        onClick={() => {
                          updateItemStatus(itemDetails.ItemID, 'Removed')
                          closeItemDetails()
                        }}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  <button className="btn" onClick={closeItemDetails}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && !loading && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Manage Members</h2>
            <div>
              <label style={{ marginRight: 8 }}>Donation Year: 
                <select value={donationYear} onChange={e => setDonationYear(e.target.value)}>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </label>
              <button className="btn" onClick={() => openMemberForm()}>Create Member</button>
            </div>
          </div>
          
          {showMemberForm && (
            <div style={{ marginTop: 12, padding: 16, border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <h3>{editingMember ? 'Edit Member' : 'Create Member'}</h3>
              <div style={{ marginTop: 12 }}>
                <label>Name: <input type="text" value={memberFormData.name || ''} onChange={e => setMemberFormData({...memberFormData, name: e.target.value})} /></label>
              </div>
              {!editingMember && (
                <div style={{ marginTop: 8 }}>
                  <label>Username: <input type="text" value={memberFormData.username || ''} onChange={e => setMemberFormData({...memberFormData, username: e.target.value})} /></label>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <label>Email: <input type="email" value={memberFormData.email || ''} onChange={e => setMemberFormData({...memberFormData, email: e.target.value})} /></label>
              </div>
              {!editingMember && (
                <div style={{ marginTop: 8 }}>
                  <label>Password: <input type="password" value={memberFormData.password || ''} onChange={e => setMemberFormData({...memberFormData, password: e.target.value})} /></label>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <label>Role: 
                  <select value={memberFormData.role || 'Regular'} onChange={e => setMemberFormData({...memberFormData, role: e.target.value})}>
                    <option value="Regular">Regular</option>
                    <option value="Author">Author</option>
                    <option value="Moderator">Moderator</option>
                  </select>
                </label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Organization: <input type="text" value={memberFormData.organization || ''} onChange={e => setMemberFormData({...memberFormData, organization: e.target.value})} /></label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Recovery Email: <input type="email" value={memberFormData.recoveryEmail || ''} onChange={e => setMemberFormData({...memberFormData, recoveryEmail: e.target.value})} /></label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>ORCID: <input type="text" value={memberFormData.orcid || ''} onChange={e => setMemberFormData({...memberFormData, orcid: e.target.value})} placeholder="0000-0000-0000-0000" /></label>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn" onClick={saveMember}>Save</button>
                <button className="btn" onClick={() => { setShowMemberForm(false); setEditingMember(null); setMemberFormData({}) }} style={{ marginLeft: 8 }}>Cancel</button>
              </div>
            </div>
          )}

          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Username</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Role</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Organization</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Donations ({donationYear})</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Downloads</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map(m => (
                <tr key={m.MemberID}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{m.MemberID}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{m.Name}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{m.Username}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{m.PrimaryEmail}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{m.Role}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{m.Organization || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>${m.TotalDonated || 0} ({m.DonationCount || 0})</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{m.DownloadCount || 0}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => openMemberForm(m)}>Edit</button>
                    <button className="btn" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ff3860', color: 'white' }} onClick={() => deleteMember(m.MemberID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {members.length === 0 && <div style={{ marginTop: 12 }}>No members found</div>}
        </div>
      )}

      {/* Committees Tab */}
      {activeTab === 'committees' && !loading && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Manage Committees</h2>
            <button className="btn" onClick={() => openCommitteeForm()}>Create Committee</button>
          </div>

          {showCommitteeForm && (
            <div style={{ marginTop: 12, padding: 16, border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <h3>{editingCommittee ? 'Edit Committee' : 'Create Committee'}</h3>
              <div style={{ marginTop: 12 }}>
                <label>Name: <input type="text" value={committeeFormData.name || ''} onChange={e => setCommitteeFormData({...committeeFormData, name: e.target.value})} /></label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>Description: <textarea value={committeeFormData.description || ''} onChange={e => setCommitteeFormData({...committeeFormData, description: e.target.value})} rows={3} style={{ width: '100%' }} /></label>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn" onClick={saveCommittee}>Save</button>
                <button className="btn" onClick={() => { setShowCommitteeForm(false); setEditingCommittee(null); setCommitteeFormData({}) }} style={{ marginLeft: 8 }}>Cancel</button>
              </div>
            </div>
          )}

          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Description</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Members</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {committees.map(c => (
                <tr key={c.CommitteeID}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.CommitteeID}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.Name}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.Description || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{c.MemberCount || 0}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => { openCommitteeForm(c); loadCommitteeMembers(c.CommitteeID) }}>Edit</button>
                    <button className="btn" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ff3860', color: 'white' }} onClick={() => deleteCommittee(c.CommitteeID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {committees.length === 0 && <div style={{ marginTop: 12 }}>No committees found</div>}
          
          {/* Committee Members Modal */}
          {viewingCommitteeId && committeeMembers.length >= 0 && (
            <div style={{ marginTop: 20, padding: 16, border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <h3>Committee Members</h3>
              <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e5e5' }}>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Username</th>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {committeeMembers.map(cm => (
                    <tr key={cm.MemberCommitteeID}>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{cm.Name}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{cm.Username}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{cm.PrimaryEmail}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>{cm.Approved ? 'Approved' : 'Pending'}</td>
                      <td style={{ padding: 8, border: '1px solid #ddd' }}>
                        {!cm.Approved ? (
                          <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#23d160', color: 'white' }} onClick={() => approveCommitteeMember(cm.MemberCommitteeID, true)}>Approve</button>
                        ) : (
                          <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ffdd57' }} onClick={() => approveCommitteeMember(cm.MemberCommitteeID, false)}>Unapprove</button>
                        )}
                        <button className="btn" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ff3860', color: 'white' }} onClick={() => removeCommitteeMember(cm.MemberCommitteeID)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {committeeMembers.length === 0 && <div style={{ marginTop: 12 }}>No members in this committee</div>}
              <button className="btn" onClick={() => { setViewingCommitteeId(null); setCommitteeMembers([]) }} style={{ marginTop: 12 }}>Close</button>
            </div>
          )}
        </div>
      )}

      {/* Charities Tab */}
      {activeTab === 'charities' && !loading && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Manage Charities</h2>
            <button className="btn" onClick={() => openCharityForm()}>Create Charity</button>
          </div>

          {showCharityForm && (
            <div style={{ marginTop: 12, padding: 16, border: '1px solid #ddd', backgroundColor: '#f9f9f9' }}>
              <h3>{editingCharity ? 'Edit Charity' : 'Create Charity'}</h3>
              <div style={{ marginTop: 12 }}>
                <label>Name: <input type="text" value={charityFormData.name || ''} onChange={e => setCharityFormData({...charityFormData, name: e.target.value})} /></label>
              </div>
              <div style={{ marginTop: 8 }}>
                <label>
                  <input type="checkbox" checked={charityFormData.approved === 1} onChange={e => setCharityFormData({...charityFormData, approved: e.target.checked ? 1 : 0})} />
                  {' '}Approved
                </label>
              </div>
              <div style={{ marginTop: 12 }}>
                <button className="btn" onClick={saveCharity}>Save</button>
                <button className="btn" onClick={() => { setShowCharityForm(false); setEditingCharity(null); setCharityFormData({}) }} style={{ marginLeft: 8 }}>Cancel</button>
              </div>
            </div>
          )}

          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Name</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Approved</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Suggested By</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {charities.map(ch => (
                <tr key={ch.ChildrenCharityID}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{ch.ChildrenCharityID}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{ch.Name}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{ch.Approved ? 'Yes' : 'No'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{ch.SuggestedByUsername || (ch.SuggestedBy ? `User ${ch.SuggestedBy}` : '-')}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => toggleCharityApproval(ch.ChildrenCharityID, ch.Approved)}>
                      {ch.Approved ? 'Unapprove' : 'Approve'}
                    </button>
                    <button className="btn" style={{ marginRight: 4, fontSize: '0.8rem', padding: '4px 8px' }} onClick={() => openCharityForm(ch)}>Edit</button>
                    <button className="btn" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#ff3860', color: 'white' }} onClick={() => deleteCharity(ch.ChildrenCharityID)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {charities.length === 0 && <div style={{ marginTop: 12 }}>No charities found</div>}
        </div>
      )}

      {/* MFA Matrices Tab */}
      {activeTab === 'mfa' && !loading && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>MFA Matrices Management</h2>
            <button className="btn" onClick={regenerateExpiringMatrices}>
              Regenerate All Expiring
            </button>
          </div>
          <table style={{ width: '100%', marginTop: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>ID</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Member</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Username</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Matrix</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Created</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Expiry Date</th>
                <th style={{ padding: 8, border: '1px solid #ddd', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mfaMatrices.map(mfa => {
                const hoursLeft = mfa.HoursUntilExpiry || 0
                const isExpiring = hoursLeft >= 0 && hoursLeft < 48
                const isExpired = hoursLeft < 0
                const expiryStyle = isExpiring ? { backgroundColor: '#ffcccc', fontWeight: 'bold' } : isExpired ? { backgroundColor: '#ff9999', fontWeight: 'bold' } : {}
                return (
                  <tr key={mfa.MFAMatrixID}>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>{mfa.MFAMatrixID}</td>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>{mfa.Name}</td>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>{mfa.Username}</td>
                    <td style={{ padding: 8, border: '1px solid #ddd', fontFamily: 'monospace', fontSize: '0.9rem' }}>{mfa.Matrix}</td>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>{mfa.CreationDate ? new Date(mfa.CreationDate).toLocaleString() : '-'}</td>
                    <td style={{ padding: 8, border: '1px solid #ddd', ...expiryStyle }}>
                      {mfa.ExpiryDate ? new Date(mfa.ExpiryDate).toLocaleString() : '-'}
                      {isExpiring && <div style={{ fontSize: '0.8rem', color: '#cc0000' }}>Expires in {hoursLeft}h!</div>}
                      {isExpired && <div style={{ fontSize: '0.8rem', color: '#990000' }}>EXPIRED</div>}
                    </td>
                    <td style={{ padding: 8, border: '1px solid #ddd' }}>
                      <button className="btn" style={{ fontSize: '0.8rem', padding: '4px 8px', backgroundColor: '#3273dc', color: 'white' }} onClick={() => regenerateMfaMatrix(mfa.MFAMatrixID)}>Regenerate</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {mfaMatrices.length === 0 && <div style={{ marginTop: 12 }}>No MFA matrices found</div>}
        </div>
      )}
    </div>
  )
}

export default ModeratorPage
