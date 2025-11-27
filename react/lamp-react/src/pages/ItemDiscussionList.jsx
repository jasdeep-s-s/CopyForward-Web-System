import React, { useEffect, useState } from 'react'
import './ItemPage.css'
import DiscussionMessageList from './DiscussionMessageList'

function ItemDiscussionList ({ itemId }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const logged = localStorage.getItem('logged_in_id') || ''

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const logged = localStorage.getItem('logged_in_id') || ''
        const url = `/discussions.php?item=${encodeURIComponent(itemId)}` + (logged ? `&member=${encodeURIComponent(logged)}` : '')
        const r = await fetch(url)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        if (!cancelled) setRows(Array.isArray(d) ? d : [])
      } catch (e) {
        console.error('discussions fetch error', e)
        if (!cancelled) setError('Discussions not available')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [itemId])

  return (
    <div>
      {loading ? (
        <div>Loading…</div>
      ) : error ? (
        <div className="empty">{error}</div>
      ) : rows && rows.length ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
              <tr>
              <th style={{ textAlign: 'left', padding: 6 }}>Committee</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Committee Description</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Subject</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Voting Deadline</th>
              <th style={{ textAlign: 'left', padding: 6 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <React.Fragment key={idx}>
                <tr style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: 6, verticalAlign: 'middle' }}>{r.Name || 'Unknown'}</td>
                  <td style={{ padding: 6, verticalAlign: 'middle' }}>{r.Description || ''}</td>
                  <td style={{ padding: 6, verticalAlign: 'middle' }}>
                    <a
                      href={`#/items/${encodeURIComponent(itemId)}/discussions/${encodeURIComponent(r.DiscussionID)}`}
                      onClick={e => { e.preventDefault(); window.location.hash = `#/items/${itemId}/discussions/${r.DiscussionID}` }}
                      className="version-link"
                    >
                      {r.Subject || ''}
                    </a>
                  </td>
                  <td style={{ padding: 6, verticalAlign: 'middle' }}>{r.VotingDeadline ? r.VotingDeadline : 'Not Started'}</td>
                  <td style={{ padding: 6, verticalAlign: 'middle' }}>{r.Status || ''}</td>
                </tr>
                
              </React.Fragment>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="empty">
          {logged
            ? 'No discussions visible.'
            : 'No discussions. Sign in to view committee discussions.'}
        </div>
      )}
    </div>
  )
}

export default ItemDiscussionList
