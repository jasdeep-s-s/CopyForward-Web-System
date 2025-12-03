// by Pascal Ypperciel, 40210921
import React, { useEffect, useState } from 'react'
import './ItemPage.css'

function ItemDonation ({ itemId }) {
  const [charities, setCharities] = useState([])
  const [amount, setAmount] = useState('')
  const [selected, setSelected] = useState('')
  const [authorPercent, setAuthorPercent] = useState(20)
  const [childrenPercent, setChildrenPercent] = useState(60)
  const [cfpPercent, setCfpPercent] = useState(20)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [itemTitle, setItemTitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [suggestMode, setSuggestMode] = useState(false)
  const [suggestName, setSuggestName] = useState('')
  const [suggestLoading, setSuggestLoading] = useState(false)
  const [suggestMessage, setSuggestMessage] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardCcv, setCardCcv] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')

  useEffect(() => {
    fetch('/charities.php')
      .then(r => r.json())
      .then(data => setCharities(data || []))
      .catch(() => setCharities([]))

    fetch(`/item.php?id=${encodeURIComponent(itemId)}`)
      .then(r => r.json())
      .then(d => {
        if (d) {
          setItemTitle(d.Title || '')
          setAuthorName(d.Name || '')
        }
      })
      .catch(() => {})
  }, [itemId])

  function submitSuggestion(e) {
    if (e && e.preventDefault) e.preventDefault()
    const logged = localStorage.getItem('logged_in_id')
    if (!logged) { setSuggestMessage('You must be signed in to suggest'); return }
    if (!suggestName || !suggestName.trim()) { setSuggestMessage('Enter a charity name'); return }
    setSuggestLoading(true)
    setSuggestMessage('')
    fetch('/suggest_charity.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: suggestName.trim(), suggestedBy: parseInt(logged,10) })
    })
    .then(r => r.json())
    .then(d => {
      setSuggestLoading(false)
      if (d && d.success) {
        setSuggestMessage('Suggestion submitted - awaiting approval')
        setSuggestName('')
        setSuggestMode(false)
        fetch('/charities.php').then(r=>r.json()).then(data=>setCharities(data||[])).catch(()=>{})
      } else {
        setSuggestMessage(d && d.error ? d.error : 'Failed to submit suggestion')
      }
    })
    .catch(() => { setSuggestLoading(false); setSuggestMessage('Network error') })
  }

  function validate() {
    setError('')
    const a = parseInt(amount, 10)
    if (!a || a <= 0) { setError('Enter a valid donation amount'); return false }
    if (!selected) { setError('Choose a charity'); return false }
    const sum = Number(authorPercent) + Number(childrenPercent) + Number(cfpPercent)
    if (sum !== 100) { setError('Percentages must add up to 100'); return false }
    if (Number(childrenPercent) < 60) { setError('Children charity percent must be at least 60'); return false }

    const cardNumClean = (cardNumber || '').replace(/\s+/g, '')
    if (!/^\d{13,19}$/.test(cardNumClean)) { setError('Enter a valid card number (13-19 digits)'); return false }
    if (!/^\d{3,4}$/.test(cardCcv || '')) { setError('Enter a valid CCV (3 or 4 digits)'); return false }
    
    const exp = (cardExpiry || '').trim()
    let m = null, y = null
    const mmYY = /^([0-1]?\d)\/(\d{2})$/.exec(exp)
    const mmYYYY = /^([0-1]?\d)\/(\d{4})$/.exec(exp)
    if (mmYYYY) { m = parseInt(mmYYYY[1],10); y = parseInt(mmYYYY[2],10) }
    else if (mmYY) { m = parseInt(mmYY[1],10); y = 2000 + parseInt(mmYY[2],10) }
    else { setError('Expiry date must be MM/YY or MM/YYYY'); return false }
    if (m < 1 || m > 12) { setError('Expiry month must be between 01 and 12'); return false }
    const now = new Date()
    
    const lastOfMonth = new Date(y, m, 0)
    if (lastOfMonth < new Date(now.getFullYear(), now.getMonth(), 1)) { setError('Card expiry must not be in the past'); return false }
    return true
  }

  function submit(e) {
    e.preventDefault()
    if (!validate()) return
    const logged = localStorage.getItem('logged_in_id')
    if (!logged) { setError('You must be signed in to donate'); return }
    
    const cardNumClean = (cardNumber || '').replace(/\s+/g, '')
    const cardLast4 = cardNumClean.slice(-4)
    
    let m = null, y = null
    const mmYY = /^([0-1]?\d)\/(\d{2})$/.exec((cardExpiry||'').trim())
    const mmYYYY = /^([0-1]?\d)\/(\d{4})$/.exec((cardExpiry||'').trim())
    if (mmYYYY) { m = parseInt(mmYYYY[1],10); y = parseInt(mmYYYY[2],10) }
    else if (mmYY) { m = parseInt(mmYY[1],10); y = 2000 + parseInt(mmYY[2],10) }

    setLoading(true)
    fetch('/post_donation.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        donatorId: parseInt(logged,10),
        itemId: parseInt(itemId,10),
        childrenCharityId: parseInt(selected,10),
        amount: parseInt(amount,10),
        authorPercent: parseInt(authorPercent,10),
        childrenPercent: parseInt(childrenPercent,10),
        cfpPercent: parseInt(cfpPercent,10),
        cardLast4: cardLast4,
        cardExpiryMonth: m,
        cardExpiryYear: y
      })
    })
    .then(r => r.json())
    .then(d => {
      setLoading(false)
      if (d && d.success) {
        alert('Payment Processed. Donation recorded. Thank you!')
        window.location.hash = `#/items/${itemId}`
      } else {
        setError(d && d.error ? d.error : 'Failed to record donation')
      }
    })
    .catch(() => { setLoading(false); setError('Network error') })
  }

  return (
    <div className="item-page">
      <header className="item-header">
        <h1 className="item-title">Donate to {authorName || `item ${itemId}`}{itemTitle ? ` for ${itemTitle}` : ''}</h1>
      </header>

      <form className="comment-form" style={{ marginTop: 12 }} onSubmit={submit}>
        <div style={{ marginBottom: 8 }}>
          <label><strong>Amount:</strong>
            <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} style={{ marginLeft: 8 }} />
          </label>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label><strong>Children Charity:</strong>
            <select value={selected} onChange={e => setSelected(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="">-- choose --</option>
              {charities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>

          <div style={{ marginTop: 8 }}>
            {suggestMode ? (
              <div style={{ display: 'inline-block', marginLeft: 8 }}>
                <input placeholder="Charity name" value={suggestName} onChange={e => setSuggestName(e.target.value)} />
                <button className="btn" type="button" onClick={submitSuggestion} disabled={suggestLoading} style={{ marginLeft: 6 }}>{suggestLoading ? 'Submitting...' : 'Suggest'}</button>
                <button type="button" className="btn" style={{ marginLeft: 6 }} onClick={() => { setSuggestMode(false); setSuggestName(''); setSuggestMessage('') }}>Cancel</button>
              </div>
            ) : (
              <button className="btn" type="button" style={{ marginLeft: 8 }} onClick={() => setSuggestMode(true)}>Suggest charity</button>
            )}
            {suggestMessage ? <div style={{ color: 'darkgreen', marginTop: 6 }}>{suggestMessage}</div> : null}
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block' }}><strong>Author %</strong></label>
          <input type="number" min="0" max="100" value={authorPercent} onChange={e => setAuthorPercent(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block' }}><strong>Children Charity %</strong></label>
          <input type="number" min="0" max="100" value={childrenPercent} onChange={e => setChildrenPercent(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block' }}><strong>CFP %</strong></label>
          <input type="number" min="0" max="100" value={cfpPercent} onChange={e => setCfpPercent(e.target.value)} />
        </div>

        
        
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block' }}><strong>Card Number</strong></label>
          <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block' }}><strong>CCV</strong></label>
          <input type="text" placeholder="123" value={cardCcv} onChange={e => setCardCcv(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block' }}><strong>Expiry (MM/YY or MM/YYYY)</strong></label>
          <input type="text" placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
        </div>

        {error ? <div style={{ color: 'darkred', marginBottom: 8 }}>{error}</div> : null}

        <div>
          <button className="btn post" type="submit" disabled={loading} style={{ minWidth: 120 }}>{loading ? 'Processing...' : 'Donate'}</button>
          <button className="btn post" type="button" style={{ marginLeft: 8, minWidth: 120 }} onClick={() => { window.location.hash = `#/items/${itemId}` }}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

export default ItemDonation
