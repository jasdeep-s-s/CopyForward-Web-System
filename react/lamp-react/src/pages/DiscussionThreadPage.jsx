// by Pascal Ypperciel, 40210921
import React, { useEffect, useState } from 'react'
import './ItemPage.css'
import DiscussionMessageList from './DiscussionMessageList'

function DiscussionThreadPage({ itemId, discussionId }) {
  const [subject, setSubject] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadSubject() {
      if (!discussionId) return
      try {
        const r = await fetch(`/discussion_title.php?discussion=${encodeURIComponent(discussionId)}`)
        if (!r.ok) return
        const j = await r.json()
        if (!cancelled && j && j.success && j.Subject) setSubject(j.Subject)
      } catch {}
    }
    loadSubject()
    return () => { cancelled = true }
  }, [discussionId])
  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">{subject || `Discussion ${discussionId}`}</h1>
      </header>

      <div style={{ marginTop: 12 }}>
        <p>
          <a href={`#/items/${itemId}/discussions`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${itemId}/discussions` }}>Back to discussions</a>
          {' '}|{' '}
          <a href={`#/items/${itemId}`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${itemId}` }}>Back to item</a>
        </p>
      </div>

      <section style={{ marginTop: 12 }}>
        <DiscussionMessageList discussionId={discussionId} />
      </section>
    </div>
  )
}

export default DiscussionThreadPage
