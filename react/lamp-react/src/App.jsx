import { useState, useEffect } from 'react'
import './App.css'
import Header from './Header'
import MessagePopup from './pages/MessagePopup'
import InternalMessage from './pages/InternalMessage'
import ItemPage from './pages/ItemPage'
import ItemDiscussionPage from './pages/ItemDiscussionPage'
import DiscussionThreadPage from './pages/DiscussionThreadPage'
import ItemDonationPage from './pages/ItemDonation'
import MemberPage from './pages/MemberPage'
import StatisticsPage from './pages/StatisticsPage'
import Homepage from './pages/Homepage'
import AuthorsPage from './pages/AuthorsPage'

function App() {
  const [showMailPopup, setShowMailPopup] = useState(false);
  const [matrixNotice, setMatrixNotice] = useState(null)

  const getPath = () => (window.location.hash ? window.location.hash.slice(1) : window.location.pathname)
  const [path, setPath] = useState(() => getPath())

  useEffect(() => {
    const onHash = () => setPath(getPath())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    function onMatrix(evt) {
      if (evt?.detail) setMatrixNotice(evt.detail)
    }
    window.addEventListener('matrixNotice', onMatrix)
    return () => window.removeEventListener('matrixNotice', onMatrix)
  }, [])

  useEffect(() => {
    async function fetchPending() {
      try {
        const res = await fetch('/mfa_status.php', { credentials: 'include' })
        const data = await res.json()
        if (data?.pending) {
          setMatrixNotice({
            matrix: data.matrix,
            expiry: data.expiry
          })
        }
      } catch (e) {
        // ignore
      }
    }
    fetchPending()
  }, [])

  function formatMatrix(str) {
    if (!str) return ''
    const cleaned = str.replace(/\s+/g, '').toUpperCase()
    const chunks = cleaned.match(/.{1,5}/g) || []
    return chunks.join(' ')
  }

  async function acknowledgeMatrix() {
    try {
      await fetch('/mfa_ack.php', { method: 'POST', credentials: 'include' })
    } catch (e) {
      // ignore errors
    }
    setMatrixNotice(null)
  }

  const donationMatch = path.match(/^\/items\/([^\/]+)\/donate$/)
  const discussionMatch = path.match(/^\/items\/([^\/]+)\/discussions?$/)
  const discussionThreadMatch = path.match(/^\/items\/([^\/]+)\/discussions\/(\d+)$/)
  const itemMatch = path.match(/^\/items\/([^\/]+)$/)
  const messageMatch = path.match(/^\/message\/(.+)$/)
  const memberMatch = path.match(/^\/member\/(\d+)$/)
  const statisticsMatch = path === '/statistics'
  const authorsMatch = path === '/authors'

  return (
    <div className="app">
      <Header onMailClick={() => setShowMailPopup(true)} />

      {(showMailPopup || messageMatch) && (
        <MessagePopup onClose={() => {
          setShowMailPopup(false)
          if (messageMatch) window.location.hash = '#/'
        }}>
          <InternalMessage prefillTo={messageMatch ? decodeURIComponent(messageMatch[1]) : undefined} openCompose={!!messageMatch} />
        </MessagePopup>
      )}

      <main className="app-main">
        {statisticsMatch ? (
          <StatisticsPage />
        ) : discussionThreadMatch ? (
          <DiscussionThreadPage itemId={discussionThreadMatch[1]} discussionId={discussionThreadMatch[2]} />
        ) : authorsMatch ? (
          <AuthorsPage />
        ) : donationMatch ? (
          <ItemDonationPage itemId={donationMatch[1]} />
        ) : discussionMatch ? (
          <ItemDiscussionPage itemId={discussionMatch[1]} />
        ) : memberMatch ? (
          <MemberPage memberId={memberMatch[1]} />
        ) : itemMatch ? (
          <ItemPage itemId={itemMatch[1]} />
        ) : (
          <Homepage />
        )}
      </main>

      {matrixNotice ? (
        <MessagePopup onClose={acknowledgeMatrix}>
          <div>
            <h3>Security matrix updated</h3>
            <p>Your MFA matrix has been renewed. Please copy or note it for your records.</p>
            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', background: '#f5f5f5', padding: 8, borderRadius: 4 }}>
              {formatMatrix(matrixNotice.matrix)}
            </pre>
            {matrixNotice.expiry ? <p>Expires on: {matrixNotice.expiry}</p> : null}
            <button className="btn primary" type="button" onClick={acknowledgeMatrix} style={{ marginTop: 12 }}>I have viewed my matrix</button>
          </div>
        </MessagePopup>
      ) : null}
    </div>
  )
}

export default App
