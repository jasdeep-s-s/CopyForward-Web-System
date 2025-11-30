// by Pascal Ypperciel, 40210921
import React, { useEffect, useState } from 'react'
import './ItemPage.css'
import ItemDiscussionList from './ItemDiscussionList'

function ItemDiscussionPage ({ itemId }) {
  const [title, setTitle] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function loadTitle() {
      if (!itemId) return
      try {
        const r = await fetch(`/item_title.php?item=${encodeURIComponent(itemId)}`)
        if (!r.ok) return
        const j = await r.json()
        if (!cancelled && j && j.success && j.Title) setTitle(j.Title)
      } catch {}
    }
    loadTitle()
    return () => { cancelled = true }
  }, [itemId])
  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">Discussions for {title || `item ${itemId}`}</h1>
      </header>

      <div style={{ marginTop: 12 }}>
        <p>
          <a href={`#/items/${itemId}`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${itemId}` }}>Back to item</a>
        </p>
      </div>

      <section style={{ marginTop: 12 }}>
        <ItemDiscussionList itemId={itemId} />
      </section>
    </div>
  )
}

export default ItemDiscussionPage
