import { useState, useEffect } from "react";

function InternalMessage() {
  const [email, setEmail] = useState("");
  const [memberId, setMemberId] = useState(null);
  const [tempEmail, setTempEmail] = useState("");
  const [emailSet, setEmailSet] = useState(false);

  const [view, setView] = useState("received");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setSendError("");

    const to = composeTo.trim();
    const body = composeBody.trim();

    if (!to || !body) {
      setSendError("Please fill in both fields.");
      return;
    }

    if (!memberId) {
      setSendError("Missing sender ID.");
      return;
    }

    try {
      setSending(true);

      const res = await fetch("/send_message.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: memberId,
          toEmail: to,
          message: body,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setSendError(data.error || "Failed to send message.");
        return;
      }

      setComposeBody("");
      setComposeTo("");
      setShowCompose(false);

      if (view === "sent") {
        const now = new Date();
        const formatted = now.toISOString().slice(0, 19).replace("T", " ");
        setMessages((prev) => [
          {
            PeerEmail: to,
            Message: body,
            Date: formatted,
            Direction: "sent",
          },
          ...prev,
        ]);
      }
    } catch (err) {
      console.error(err);
      setSendError("Network or server error while sending.");
    } finally {
      setSending(false);
    }
  };

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
        <button onClick={() => setShowCompose((v) => !v)}>
          {showCompose ? "Close" : "New Message"}
        </button>
      </div>

      {showCompose && (
        <form
          onSubmit={handleSendMessage}
          style={{
            border: "1px solid #ccc",
            padding: "0.75rem",
            borderRadius: "4px",
            background: "#fafafa",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: "0.25rem",
              }}
            >
              To (email):
            </label>
            <input
              type="email"
              value={composeTo}
              onChange={(e) => setComposeTo(e.target.value)}
              style={{
                width: "100%",
                padding: "0.4rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              required
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                marginBottom: "0.25rem",
              }}
            >
              Message:
            </label>
            <textarea
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "0.4rem",
                borderRadius: "4px",
                border: "1px solid #ccc",
                resize: "vertical",
              }}
              required
            />
          </div>

          {sendError && (
            <p style={{ color: "red", fontSize: "0.85rem" }}>{sendError}</p>
          )}

          <button
            type="submit"
            disabled={sending}
            style={{
              alignSelf: "flex-start",
              padding: "0.4rem 0.9rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              background: sending ? "#ddd" : "#f5f5f5",
              cursor: sending ? "default" : "pointer",
            }}
          >
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      )}

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
