import React from 'react'
import './ItemPage.css'

function ItemDiscussionPage ({ itemId }) {
  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">Discussions for item {itemId}</h1>
      </header>

      <div style={{ marginTop: 12 }}>
        <p>
          <a href={`#/items/${itemId}`} onClick={e => { e.preventDefault(); window.location.hash = `#/items/${itemId}` }}>Back to item</a>
        </p>
      </div>
    </div>
  )
}

export default ItemDiscussionPage
