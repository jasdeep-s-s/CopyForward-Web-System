import { useState, useEffect } from "react";

function InternalMessage() {
  const [email, setEmail] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [tempEmail, setTempEmail] = useState("");
  const [emailSet, setEmailSet] = useState(false);

  const [view, setView] = useState("received");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("logged_in_email");
    const savedId = localStorage.getItem("logged_in_id");

    if (savedEmail) {
      setEmail(savedEmail);
      setEmailSet(true);
    }
    if (savedId) {
      setMemberId(parseInt(savedId));
    }
  }, []);

  const saveEmail = () => {
    if (!tempEmail.trim()) return;
    const cleaned = tempEmail.trim();
    localStorage.setItem("logged_in_email", cleaned);
    setEmail(cleaned);
    setEmailSet(true);
  };

  useEffect(() => {
    if (emailSet && !memberId) {
      const fetchMemberId = async () => {
        const res = await fetch(
          `/messages.php?email=${encodeURIComponent(email)}`
        );
        const data = await res.json();
        if (data.success && data.memberId) {
          localStorage.setItem("logged_in_id", data.memberId);
          setMemberId(data.memberId);
        }
      };
      fetchMemberId();
    }
  }, [emailSet, email, memberId]);

  useEffect(() => {
    if (!memberId) return;

    const fetchMessages = async () => {
      setLoading(true);

      const res = await fetch(
        `/messages.php?memberId=${memberId}&view=${view}`
      );

      const data = await res.json();

      if (data.success) {
        setMessages(data.messages || []);
      }

      setLoading(false);
    };

    fetchMessages();
  }, [memberId, view]);

  if (!emailSet) {
    return (
      <div>
        <h2>Setup Email</h2>
        <p>Please enter your email address to use the mail system:</p>

        <input
          value={tempEmail}
          onChange={(e) => setTempEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ padding: "0.4rem", width: "100%", marginBottom: "1rem" }}
        />
        <button onClick={saveEmail}>Save Email</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Mail ({email})</h2>
        <button>New Message</button>
      </div>

      <select value={view} onChange={(e) => setView(e.target.value)}>
        <option value="received">Received</option>
        <option value="sent">Sent</option>
      </select>

      <div style={{ border: "1px solid #ccc", padding: "1rem" }}>
        {loading && <p>Loading...</p>}

        {!loading && messages.length === 0 && <p>No messages found.</p>}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: "1rem",
              padding: "0.5rem",
              background: "#fff",
              borderRadius: "4px",
              border: "1px solid #ddd",
            }}
          >
            <div style={{ fontSize: "0.9rem", marginBottom: "0.25rem" }}>
              {view === "received" ? (
                <>From: {m.PeerEmail}</>
              ) : (
                <>To: {m.PeerEmail}</>
              )}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#666" }}>{m.Date}</div>
            <div style={{ marginTop: "0.5rem" }}>{m.Message}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InternalMessage;
