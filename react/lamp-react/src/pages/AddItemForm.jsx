import React, { useEffect, useState } from 'react'

function AddItemForm({ onClose }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [authorOrcid, setAuthorOrcid] = useState(null)
  const [parentItems, setParentItems] = useState([])
  const [title, setTitle] = useState('')
  const [publicationDate, setPublicationDate] = useState('')
  const [topic, setTopic] = useState('')
  const [type, setType] = useState('Thesis')
  const [parentId, setParentId] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const logged = localStorage.getItem('logged_in_id')
        if (!logged) {
          setError('You must be signed in to upload an item.')
          setLoading(false)
          return
        }

        const r = await fetch(`/member_orcid.php?member=${encodeURIComponent(logged)}`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const j = await r.json()
        if (!j || !j.success || !j.ORCID) {
          setError('Your account does not have an ORCID on file. Uploading is not allowed.')
          setLoading(false)
          return
        }
        if (!cancelled) setAuthorOrcid(j.ORCID)

        try {
          const mi = await fetch(`/member_items.php?orcid=${encodeURIComponent(j.ORCID)}`)
          if (mi.ok) {
            const items = await mi.json()
            if (!cancelled) setParentItems(Array.isArray(items) ? items : [])
          }
        } catch {
            //ignore
        }
      } catch (err) {
        console.error('AddItemForm load error', err)
        setError('Failed to initialize upload form')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const types = ['Thesis','Article','Monograph & Book','Monograph Chapter','Conference Paper','Non-Thesis Graduate Project','Dataset']

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMessage('')
    setError('')
    if (!authorOrcid) { setError('Missing ORCID'); return }
    if (!title.trim()) { setError('Title is required'); return }
    if (!type) { setError('Type is required'); return }
    if (content.length > 5000) { setError('Content exceeds 5000 characters'); return }
    if (title.length > 256) { setError('Title exceeds 256 characters'); return }
    if (topic.length > 256) { setError('Topic exceeds 256 characters'); return }

    setSubmitting(true)
    try {
      const payload = {
        authorOrcid: authorOrcid,
        title: title.trim(),
        publicationDate: publicationDate || null,
        topic: topic.trim(),
        type: type,
        parentId: parentId || null,
        content: content.trim()
      }
      const res = await fetch('/post_item.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const j = await res.json()
      if (j && j.success) {
        setSuccessMessage('Item submitted for review')
        setTimeout(() => { if (onClose) onClose(); }, 1200)
      } else {
        setError((j && j.error) ? j.error : 'Failed to submit item')
      }
    } catch (err) {
      console.error('post item error', err)
      setError('Network error while submitting item')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>Loading…</div>
  if (error) return (
    <div>
      <div style={{ color: 'darkred', marginBottom: 8 }}>{error}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn" onClick={onClose}>Close</button>
      </div>
    </div>
  )

  return (
    <div>
      <h3>Upload an Item</h3>
      {successMessage ? <div style={{ color: 'darkgreen', marginBottom: 8 }}>{successMessage}</div> : null}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label><strong>Title</strong></label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label><strong>Publication Date</strong></label>
          <input type="date" value={publicationDate} onChange={e => setPublicationDate(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label><strong>Topic</strong></label>
          <input value={topic} onChange={e => setTopic(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label><strong>Type</strong></label>
          <select value={type} onChange={e => setType(e.target.value)}>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label><strong>Parent Item (optional)</strong></label>
          <select value={parentId} onChange={e => setParentId(e.target.value)}>
            <option value="">(none)</option>
            {parentItems.map(it => (
              <option key={it.ItemID} value={it.ItemID}>{it.Title} ({it.ItemID})</option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: 8 }}>
          <label><strong>Content (max 5000 chars)</strong></label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={6} style={{ width: '100%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" type="submit" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit for review'}</button>
          <button className="btn" type="button" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default AddItemForm
