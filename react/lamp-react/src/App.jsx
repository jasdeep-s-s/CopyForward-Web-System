import { useState } from 'react'
import './App.css'
import Header from './Header'
import MessagePopup from './pages/MessagePopup'
import InternalMessage from './pages/InternalMessage'

function App() {
  const [phpOutput, setPhpOutput] = useState("");
  const [showMailPopup, setShowMailPopup] = useState(false);

  const runPhp = async () => {
    const res = await fetch("/foo.php");
    const text = await res.text();
    setPhpOutput(text);
  };


  return (
    <div className="app">
      <Header onMailClick={() => setShowMailPopup(true)} />

      {showMailPopup && (
        <MessagePopup onClose={() => setShowMailPopup(false)}>
          <InternalMessage />
        </MessagePopup>
      )}

      <main className="app-main">
        <h1>Poopoo Caca</h1>
        <button onClick={runPhp}>Run PHP</button>
        <p>{phpOutput}</p>
      </main>
    </div>
  )
}

export default App
