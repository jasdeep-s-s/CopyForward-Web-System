import { useState, useEffect } from 'react'
import './App.css'
import Header from './Header'
import MessagePopup from './pages/MessagePopup'
import InternalMessage from './pages/InternalMessage'
import ItemPage from './pages/ItemPage'

function App() {
  const [showMailPopup, setShowMailPopup] = useState(false);

  const getPath = () => (window.location.hash ? window.location.hash.slice(1) : window.location.pathname)
  const [path, setPath] = useState(() => getPath())

  useEffect(() => {
    const onHash = () => setPath(getPath())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const itemMatch = path.match(/^\/items\/(.+)$/)

  return (
    <div className="app">
      <Header onMailClick={() => setShowMailPopup(true)} />

      {showMailPopup && (
        <MessagePopup onClose={() => setShowMailPopup(false)}>
          <InternalMessage />
        </MessagePopup>
      )}

      <main className="app-main">
        {itemMatch ? (
          <ItemPage itemId={itemMatch[1]} />
        ) : (
          null
        )}
      </main>
    </div>
  )
}

export default App
