import React, { useCallback, useEffect, useState } from 'react'
import './Homepage.css'

function AuthorsPage () {
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchAuthors = useCallback(async (term = '') => {
    setLoading(true)
    setError('')
    try {
      const url = term ? `/authors.php?q=${encodeURIComponent(term)}` : '/authors.php'
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const normalized = Array.isArray(data)
        ? data.map(author => ({
          id: author.MemberID,
          name: author.Name || author.Username || 'Unknown Author',
          username: author.Username,
          organization: author.Organization,
          email: author.PrimaryEmail,
          orcid: author.ORCID,
          itemCount: author.ItemCount || 0,
          totalRaised: author.TotalRaised || 0
        }))
        : []
      setAuthors(normalized)
    } catch (e) {
      console.error('authors fetch error', e)
      setError('Unable to load authors.')
      setAuthors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuthors()
  }, [fetchAuthors])

  function handleSearchSubmit (e) {
    e.preventDefault()
    fetchAuthors(search.trim())
  }

  function resetSearch () {
    setSearch('')
    fetchAuthors('')
  }

  function openMember (id) {
    window.location.hash = `#/member/${id}`
  }

  function backToHome () {
    window.location.hash = '#/'
  }

  return (
    <div className="homepage">
      <header className="homepage-header">
        <h1>Authors</h1>
        <p>Meet the people who share their work with the Copy Forward community.</p>
      </header>

      <div className="homepage-controls">
        <form className="homepage-search" onSubmit={handleSearchSubmit}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search authors by name or organization"
            aria-label="Search authors"
          />
          <button className="btn" type="submit">Search</button>
          {search ? (
            <button className="btn" type="button" onClick={resetSearch}>Clear</button>
          ) : null}
        </form>
        <button className="btn primary" type="button" onClick={backToHome}>
          Back to items
        </button>
      </div>

      {loading ? (
        <div>Loading authors…</div>
      ) : error ? (
        <div className="empty">{error}</div>
      ) : authors.length === 0 ? (
        <div className="empty">No authors found.</div>
      ) : (
        <div>
          <div className="homepage-results-info">
            Showing {authors.length} author{authors.length !== 1 ? 's' : ''}
          </div>
          <div className="authors-grid">
            {authors.map(author => (
              <div key={author.id} className="author-card">
                <h3>{author.name}</h3>
                {author.username ? <div className="author-username">@{author.username}</div> : null}
                <div className="author-meta">
                  {author.organization ? <span><strong>Organization:</strong> {author.organization}</span> : null}
                  {author.email ? <span><strong>Email:</strong> {author.email}</span> : null}
                  {author.orcid ? <span><strong>ORCID:</strong> {author.orcid}</span> : null}
                  <span><strong>Items:</strong> {author.itemCount}</span>
                  <span><strong>Raised:</strong> ${Number(author.totalRaised || 0).toFixed(2)}</span>
                </div>
                <div className="author-actions">
                  <button className="btn" type="button" onClick={() => openMember(author.id)}>
                    View profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AuthorsPage
