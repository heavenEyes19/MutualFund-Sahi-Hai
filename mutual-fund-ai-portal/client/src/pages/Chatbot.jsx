import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Chatbot() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = message;
    setMessage("");

    // ✅ Add user message safely
    setChat(prev => [...prev, { user: userMsg }]);

    try {
      const res = await fetch("http://localhost:5000/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMsg
        }),
      });

      const data = await res.json();

      // ✅ Add bot reply safely
      setChat(prev => [...prev, { bot: data.reply }]);

    } catch (err) {
      console.error(err);

      setChat(prev => [
        ...prev,
        { bot: "Error connecting to server" }
      ]);
    }
  };

  return (
    <>
    <Navbar/>

    <div style={{ padding: "40px" }}>

      <h2>AI Fund Advisor</h2>

      <div style={{ marginTop: 20 }}>
        {chat.map((c, i) => (
          <div key={i}>
            {c.user && <p><b>You:</b> {c.user}</p>}
            {c.bot && <p><b>AI:</b> {c.bot}</p>}
          </div>
        ))}
      </div>

      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        placeholder="Ask about mutual funds..."
      />

      <button onClick={sendMessage}>Send</button>
    </div>
    </>

  );
}