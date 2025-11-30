// By Elhadji Moussa Diongue, 40186654
import React, { useCallback, useEffect, useState } from 'react'
import './Homepage.css'

function Homepage () {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [loggedInId, setLoggedInId] = useState(() => localStorage.getItem('logged_in_id'))
  const [canDownload, setCanDownload] = useState(null)
  const [downloadInfo, setDownloadInfo] = useState(null)
  const [topItems, setTopItems] = useState([])
  const [topLoading, setTopLoading] = useState(true)
  const [topError, setTopError] = useState('')

  const fetchItems = useCallback(async (term = '') => {
    setLoading(true)
    setError('')
    try {
      const url = term ? `/items.php?q=${encodeURIComponent(term)}` : '/items.php'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const normalized = Array.isArray(data)
        ? data.map(item => ({
          id: item.ItemID,
          title: item.Title,
          topic: item.Topic,
          type: item.Type,
          status: item.Status,
          uploadDate: item.UploadDate,
          publicationDate: item.PublicationDate,
          parentTitleId: item.ParentTitleID,
          author: item.AuthorName,
          authorMemberId: item.AuthorMemberID,
          downloadCount: item.DownloadCount || 0,
          totalDonations: item.TotalDonations || 0
        }))
        : []
      setItems(normalized)
    } catch (e) {
      console.error('items fetch error', e)
      setError('Unable to load items right now.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    let cancelled = false
    async function loadTop() {
      setTopLoading(true)
      setTopError('')
      try {
        const res = await fetch('/statistics.php?report=top_items')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const normalized = Array.isArray(data)
          ? data.map(it => ({
            id: it.ItemID,
            title: it.Title,
            author: it.Author,
            authorMemberId: it.AuthorMemberID,
            type: it.Type,
            downloads: it.DownloadCount || 0
          }))
          : []
        if (!cancelled) setTopItems(normalized)
      } catch (e) {
        console.error('top items fetch error', e)
        if (!cancelled) {
          setTopItems([])
          setTopError('Popular items not available right now.')
        }
      } finally {
        if (!cancelled) setTopLoading(false)
      }
    }
    loadTop()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function handleStorage () {
      setLoggedInId(localStorage.getItem('logged_in_id'))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!loggedInId) {
      setCanDownload(null)
      setDownloadInfo(null)
      return undefined
    }

    async function checkDownload () {
      try {
        const res = await fetch(`/can_download.php?member=${encodeURIComponent(loggedInId)}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) {
          setCanDownload(typeof data.allowed === 'boolean' ? data.allowed : null)
          setDownloadInfo(data || null)
        }
      } catch (e) {
        console.error('can_download fetch error', e)
        if (!cancelled) {
          setCanDownload(null)
          setDownloadInfo(null)
        }
      }
    }

    checkDownload()
    return () => { cancelled = true }
  }, [loggedInId])

  function handleSearchSubmit (e) {
    e.preventDefault()
    fetchItems(search.trim())
  }

  function resetSearch () {
    setSearch('')
    fetchItems('')
  }

  function viewItem (id) {
    window.location.hash = `#/items/${id}`
  }

  async function handleDownload (e, itemId) {
    e.preventDefault()
    e.stopPropagation()

    const memberId = localStorage.getItem('logged_in_id')
    if (!memberId) {
      alert('Please sign in to download items.')
      return
    }

    if (canDownload === false) {
      const days = downloadInfo && downloadInfo.window_days ? downloadInfo.window_days : 7
      alert(`You can download one item every ${days} day(s).`)
      return
    }

    try {
      const preview = await fetch(`/download_item.php?item=${encodeURIComponent(itemId)}&member=${encodeURIComponent(memberId)}&preview=1`)
      if (!preview.ok) throw new Error(`HTTP ${preview.status}`)
      const previewJson = await preview.json()
      if (previewJson && previewJson.allowed) {
        window.location.href = `/download_item.php?item=${encodeURIComponent(itemId)}&member=${encodeURIComponent(memberId)}`
      } else {
        alert('You have reached your download limit for now.')
      }
    } catch (err) {
      console.error('download preview error', err)
      alert('Unable to start the download. Please try again later.')
    }
  }

  function goToAuthors () {
    window.location.hash = '#/authors'
  }

  function formatDate (value) {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString()
  }

  return (
    <div className="homepage">
      <header className="homepage-header">
        <h1>CFP Library</h1>
        <p>Browse research shared by our community. Click any title to open the full item page.</p>
      </header>

      <div className="homepage-controls">
        <form className="homepage-search" onSubmit={handleSearchSubmit}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search titles, topics, authors..."
            aria-label="Search items"
          />
          <button className="btn" type="submit">Search</button>
          {search ? (
            <button className="btn" type="button" onClick={resetSearch}>Clear</button>
          ) : null}
        </form>
        <button className="btn primary" type="button" onClick={goToAuthors}>
          List of authors
        </button>
      </div>

      {loading ? (
        <div>Loading items…</div>
      ) : error ? (
        <div className="empty">{error}</div>
      ) : items.length === 0 ? (
        <div className="empty">No items found. Try another search term.</div>
      ) : (
        <>
          <div className="homepage-results-info">
            Showing {items.length} item{items.length !== 1 ? 's' : ''}
          </div>
          <ul className="homepage-items">
            {items.map(item => (
              <li key={item.id} className="homepage-item-card" onClick={() => viewItem(item.id)}>
                <div className="homepage-item-header">
                  <div>
                    <h3 className="homepage-item-title">{item.title}</h3>
                    {item.author ? (
                      <div className="homepage-item-author">
                        By{' '}
                        {item.authorMemberId ? (
                          <a href={`#/member/${item.authorMemberId}`} onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.hash = `#/member/${item.authorMemberId}` }}>
                            {item.author}
                          </a>
                        ) : (
                          item.author
                        )}
                      </div>
                    ) : null}
                  </div>
                  {loggedInId ? (
                    <button className="btn download" type="button" onClick={e => handleDownload(e, item.id)}>
                      Download
                    </button>
                  ) : null}
                </div>
                <div className="homepage-item-meta">
                  {item.topic ? <span><strong>Topic:</strong> {item.topic}</span> : null}
                  {item.type ? <span><strong>Type:</strong> {item.type}</span> : null}
                  {item.status ? <span><strong>Status:</strong> {item.status}</span> : null}
                  {item.uploadDate ? <span><strong>Uploaded:</strong> {formatDate(item.uploadDate)}</span> : null}
                </div>
                <div className="homepage-item-stats">
                  <span>{item.downloadCount} download{item.downloadCount === 1 ? '' : 's'}</span>
                  <span>${Number(item.totalDonations || 0).toFixed(2)} raised</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      <section className="popular-section">
        <div className="popular-header">
          <h2>Most popular items</h2>
          <span className="popular-subtitle">Based on download counts</span>
        </div>
        {topLoading ? (
          <div>Loading popular items…</div>
        ) : topError ? (
          <div className="empty">{topError}</div>
        ) : topItems.length === 0 ? (
          <div className="empty">No popular items to show yet.</div>
        ) : (
          <div className="popular-list">
            {topItems.map((item, idx) => (
              <div key={item.id} className="popular-card" onClick={() => viewItem(item.id)}>
                <div>
                  <div className="popular-rank">#{idx + 1}</div>
                  <div className="popular-title">{item.title}</div>
                  <div className="popular-meta">
                    {item.author ? (
                      <>
                        By{' '}
                        {item.authorMemberId ? (
                          <a href={`#/member/${item.authorMemberId}`} onClick={e => { e.preventDefault(); e.stopPropagation(); window.location.hash = `#/member/${item.authorMemberId}` }}>
                            {item.author}
                          </a>
                        ) : (
                          item.author
                        )}
                      </>
                    ) : 'Unknown'}
                    {item.type ? <span className="popular-type"> · {item.type}</span> : null}
                  </div>
                </div>
                <div className="popular-downloads">
                  {item.downloads} download{item.downloads === 1 ? '' : 's'}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Homepage
