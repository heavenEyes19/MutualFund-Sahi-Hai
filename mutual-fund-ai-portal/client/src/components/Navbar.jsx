import { Link } from "react-router-dom";

const theme = {
blue: "#1a6fd4",
line: "#dfe8f3",
softText: "#94a3b8",
};

export default function Navbar() {
return (
<nav
style={{
position: "sticky",
top: 0,
zIndex: 100,
display: "flex",
justifyContent: "space-between",
alignItems: "center",
gap: 16,
padding: "18px 6%",
borderBottom: `1px solid ${theme.line}`,
background: "rgba(247,249,252,0.88)",
backdropFilter: "blur(14px)",
flexWrap: "wrap",
}}
>
{/* Logo */}
<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
<div
style={{
width: 30,
height: 30,
borderRadius: 10,
background: "linear-gradient(135deg, #0f4c81, #1a6fd4)",
display: "flex",
alignItems: "center",
justifyContent: "center",
}}
>
📈 </div>

```
    <div>
      <p style={{ margin: 0, fontSize: 12, color: theme.softText }}>
        Mutual Fund Project
      </p>
      <p style={{ margin: "2px 0 0", fontSize: 17, fontWeight: 700 }}>
        MF Dashboard
      </p>
    </div>
  </div>

  {/* Tabs */}
  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
    
    <Link to="/guide" style={linkStyle}>Finance Guide</Link>
    <Link to="/chatbot" style={linkStyle}>AI Chatbot</Link>
    <Link to="/funds" style={linkStyle}>Funds</Link>
    <Link to="/portfolio" style={linkStyle}>Portfolio</Link>
  </div>

  {/* Notification Icon */}
  <div style={{ fontSize: 20, cursor: "pointer" }}>
    🔔
  </div>
</nav>


);
}

const linkStyle = {
textDecoration: "none",
color: "#1a6fd4",
padding: "10px 16px",
borderRadius: 12,
background: "#ffffff",
border: "1px solid #dfe8f3",
fontSize: 14,
fontWeight: 600,
};
