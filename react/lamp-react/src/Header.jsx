function Header({ onMailClick }) {
  return (
    <header
      style={{
        padding: "1rem",
        backgroundColor: "#282c34",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "1.2rem",
      }}
    >
      <div
        onClick={onMailClick}
        style={{ cursor: "pointer" }}
      >
        Mail
      </div>
      <div>Profile</div>
    </header>
  );
}

export default Header;
