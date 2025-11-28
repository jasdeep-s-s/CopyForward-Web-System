// by Pascal Ypperciel, 40210921
function MessagePopup({ onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
      onClick={onClose} // click outside to close
    >
      <div
        style={{
          background: "white",
          padding: "1.5rem",
          borderRadius: "8px",
          width: "80vw",
          maxWidth: "900px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()} // don't close when clicking inside
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "0.5rem",
          }}
        >
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            X
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

export default MessagePopup;
