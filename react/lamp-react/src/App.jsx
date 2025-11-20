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

function App() {
  const [showMailPopup, setShowMailPopup] = useState(false);

  const getPath = () => (window.location.hash ? window.location.hash.slice(1) : window.location.pathname)
  const [path, setPath] = useState(() => getPath())

  useEffect(() => {
    const onHash = () => setPath(getPath())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const donationMatch = path.match(/^\/items\/([^\/]+)\/donate$/)
  const discussionMatch = path.match(/^\/items\/([^\/]+)\/discussions?$/)
  const discussionThreadMatch = path.match(/^\/items\/([^\/]+)\/discussions\/(\d+)$/)
  const itemMatch = path.match(/^\/items\/([^\/]+)$/)
  const messageMatch = path.match(/^\/message\/(.+)$/)
  const memberMatch = path.match(/^\/member\/(\d+)$/)
  const statisticsMatch = path === '/statistics'

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
        ) : donationMatch ? (
          <ItemDonationPage itemId={donationMatch[1]} />
        ) : discussionMatch ? (
          <ItemDiscussionPage itemId={discussionMatch[1]} />
        ) : memberMatch ? (
          <MemberPage memberId={memberMatch[1]} />
        ) : itemMatch ? (
          <ItemPage itemId={itemMatch[1]} />
        ) : null}
      </main>
    </div>
  )
}

export default App
