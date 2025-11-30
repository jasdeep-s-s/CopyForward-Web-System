// by Pascal Ypperciel, 40210921
import React, { useEffect, useState } from 'react'

function StatisticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/statistics.php')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        if (!cancelled) setStats(data)
      } catch (e) {
        console.error('statistics fetch error', e)
        if (!cancelled) setError('Statistics not available')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  const [growthUsage, setGrowthUsage] = useState(null)
  const [growthLoading, setGrowthLoading] = useState(true)
  const [growthError, setGrowthError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadGrowth() {
      setGrowthLoading(true)
      setGrowthError('')
      try {
        const r = await fetch('/statistics.php?report=growth_usage')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        if (!cancelled) setGrowthUsage(d)
      } catch (e) {
        console.error('growth usage fetch error', e)
        if (!cancelled) setGrowthError('Growth report not available')
      } finally {
        if (!cancelled) setGrowthLoading(false)
      }
    }

    loadGrowth()
    return () => { cancelled = true }
  }, [])

  const [annualAccess, setAnnualAccess] = useState(null)
  const [annualLoading, setAnnualLoading] = useState(true)
  const [annualError, setAnnualError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadAnnual() {
      setAnnualLoading(true)
      setAnnualError('')
      try {
        const r = await fetch('/statistics.php?report=annual_access')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        if (!cancelled) setAnnualAccess(d)
      } catch (e) {
        console.error('annual access fetch error', e)
        if (!cancelled) setAnnualError('Annual access report not available')
      } finally {
        if (!cancelled) setAnnualLoading(false)
      }
    }

    loadAnnual()
    return () => { cancelled = true }
  }, [])

  const [annualByCountry, setAnnualByCountry] = useState(null)
  const [annualByCountryLoading, setAnnualByCountryLoading] = useState(true)
  const [annualByCountryError, setAnnualByCountryError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadByCountry() {
      setAnnualByCountryLoading(true)
      setAnnualByCountryError('')
      try {
        const r = await fetch('/statistics.php?report=annual_by_country')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        if (!cancelled) setAnnualByCountry(d)
      } catch (e) {
        console.error('annual by country fetch error', e)
        if (!cancelled) setAnnualByCountryError('Annual by-country report not available')
      } finally {
        if (!cancelled) setAnnualByCountryLoading(false)
      }
    }

    loadByCountry()
    return () => { cancelled = true }
  }, [])

  const [annualByAuthor, setAnnualByAuthor] = useState(null)
  const [annualByAuthorLoading, setAnnualByAuthorLoading] = useState(true)
  const [annualByAuthorError, setAnnualByAuthorError] = useState('')

  const [topItems, setTopItems] = useState(null)
  const [topItemsLoading, setTopItemsLoading] = useState(true)
  const [topItemsError, setTopItemsError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadByAuthor() {
      setAnnualByAuthorLoading(true)
      setAnnualByAuthorError('')
      try {
        const r = await fetch('/statistics.php?report=annual_by_author')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        const normalized = Array.isArray(d) ? d : (d && (d.rows || d.data) ? (d.rows || d.data) : [])
        if (!cancelled) setAnnualByAuthor(normalized)
      } catch (e) {
        console.error('annual by author fetch error', e)
        if (!cancelled) setAnnualByAuthorError('Annual by-author report not available')
      } finally {
        if (!cancelled) setAnnualByAuthorLoading(false)
      }
    }

    loadByAuthor()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadTopItems() {
      setTopItemsLoading(true)
      setTopItemsError('')
      try {
        const r = await fetch('/statistics.php?report=top_items')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const d = await r.json()
        if (!cancelled) setTopItems(d)
      } catch (e) {
        console.error('top items fetch error', e)
        if (!cancelled) setTopItemsError('Top items report not available')
      } finally {
        if (!cancelled) setTopItemsLoading(false)
      }
    }

    loadTopItems()
    return () => { cancelled = true }
  }, [])

  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">Record of CFP Statistics</h1>
      </header>

      <section style={{ marginTop: 16 }}>
        {loading ? (
          <div>Loading…</div>
        ) : error ? (
          <div className="empty">{error}</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <strong>Total members</strong>
                <div>{stats.totalMembers ?? 0}</div>
              </div>
              <div>
                <strong>Total items</strong>
                <div>{stats.totalItems ?? 0}</div>
              </div>
              <div>
                <strong>Total downloads</strong>
                <div>{stats.totalDownloads ?? 0}</div>
              </div>
              <div>
                <strong>Total donations</strong>
                <div>{typeof stats.totalDonations === 'number' ? `$${stats.totalDonations.toFixed(2)}` : (stats.totalDonations ?? 0)}</div>
              </div>
            </div>

            <section style={{ marginTop: 20 }}>
              <h3>Growth and usage of content in CFP</h3>
              {growthLoading ? (
                <div>Loading…</div>
              ) : growthError ? (
                <div className="empty">{growthError}</div>
              ) : growthUsage && growthUsage.length ? (
                <table style={{ width: 'auto', maxWidth: '100%', margin: '0 auto', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'middle' }}>Deposit Type</th>
                      <th style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>Number Deposited</th>
                      <th style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>Percentage of Total Deposits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {growthUsage.map(row => (
                      <tr key={row.Type} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: 6, verticalAlign: 'middle' }}>{row.Type}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{row.ItemCount ?? 0}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{typeof row.ItemPercentage !== 'undefined' ? `${Number(row.ItemPercentage).toFixed(2)}%` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">No data</div>
              )}
            </section>

            
            
            <section style={{ marginTop: 20 }}>
              <h3>Annual access to CFP’s content</h3>
              {annualLoading ? (
                <div>Loading…</div>
              ) : annualError ? (
                <div className="empty">{annualError}</div>
              ) : annualAccess && annualAccess.length ? (
                <table style={{ width: 'auto', maxWidth: '100%', margin: '0 auto', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'middle' }}>Type</th>
                      <th style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>Download Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualAccess.map(row => (
                      <tr key={row.Type} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: 6, verticalAlign: 'middle' }}>{row.Type}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{row.DownloadCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">No data</div>
              )}
            </section>
            
            <section style={{ marginTop: 20 }}>
              <h3>Annual access of CFP’s content by countries</h3>
              {annualByCountryLoading ? (
                <div>Loading…</div>
              ) : annualByCountryError ? (
                <div className="empty">{annualByCountryError}</div>
              ) : annualByCountry && annualByCountry.length ? (
                <table style={{ width: 'auto', maxWidth: '100%', margin: '0 auto', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'middle' }}>Country</th>
                      <th style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>Download Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualByCountry.map((row, idx) => (
                      <tr key={`${row.Country ?? 'unknown'}-${idx}`} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: 6, verticalAlign: 'middle' }}>{row.Country || 'Unknown'}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{row.DownloadCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">No data</div>
              )}
            </section>
            
            <section style={{ marginTop: 20 }}>
              <h3>Annual access of CFP’s content by authors (Ranked)</h3>
              {annualByAuthorLoading ? (
                <div>Loading…</div>
              ) : annualByAuthorError ? (
                <div className="empty">{annualByAuthorError}</div>
              ) : annualByAuthor && annualByAuthor.length ? (
                <table style={{ width: 'auto', maxWidth: '100%', margin: '0 auto', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>Rank</th>
                      <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'middle' }}>Author</th>
                      <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'middle' }}>Organization</th>
                      <th style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>Download Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualByAuthor.map((row, idx) => (
                      <tr key={`${row.Name ?? 'unknown'}-${idx}`} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{row.Rank ?? idx + 1}</td>
                        <td style={{ padding: 6, verticalAlign: 'middle' }}>{row.Name || 'Unknown'}</td>
                        <td style={{ padding: 6, verticalAlign: 'middle' }}>{row.Organization || ''}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{row.DownloadCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">No data</div>
              )}
            </section>

            <section style={{ marginTop: 20 }}>
              <h3>Top 10 most downloaded items</h3>
              {topItemsLoading ? (
                <div>Loading…</div>
              ) : topItemsError ? (
                <div className="empty">{topItemsError}</div>
              ) : topItems && topItems.length ? (
                <table style={{ width: 'auto', maxWidth: '100%', margin: '0 auto', borderCollapse: 'collapse', tableLayout: 'auto' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>Rank</th>
                      <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'middle' }}>Title</th>
                      <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'middle' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: 6, verticalAlign: 'middle' }}>Author</th>
                      <th style={{ padding: 6, verticalAlign: 'middle', textAlign: 'center' }}>Download Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topItems.map((row, idx) => (
                      <tr key={`${row.ItemID ?? idx}`} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{idx + 1}</td>
                        <td style={{ padding: 6, verticalAlign: 'middle' }}><a href={`#/items/${row.ItemID}`}>{row.Title || 'Untitled'}</a></td>
                        <td style={{ padding: 6, verticalAlign: 'middle' }}>{row.Type || ''}</td>
                        <td style={{ padding: 6, verticalAlign: 'middle' }}>{row.Author || 'Unknown'}</td>
                        <td style={{ padding: 6, textAlign: 'center', verticalAlign: 'middle' }}>{row.DownloadCount ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty">No data</div>
              )}
            </section>
          </>
        )}
      </section>
    </div>
  )
}

export default StatisticsPage
