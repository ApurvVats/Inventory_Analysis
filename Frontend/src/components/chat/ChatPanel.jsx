import { useState } from "react";
import "./chat.css";
import React from "react";
export default function ChatPanel() {
  const [messages, setMessages] = useState([{ role: "assistant", content: "Hi! Ask me about your reports." }]);
  const [input, setInput] = useState("");

  const send = async () => {
    if (!input.trim()) return;
    const q = input.trim();
    setMessages((m)=>[...m, { role: "user", content: q }]);
    setInput("");
    // MVP: echo + fake intent parsing.
    setTimeout(() => {
      setMessages((m)=>[...m, { role: "assistant", content: `I will soon run a query for: "${q}"` }]);
    }, 300);
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">Chatbot</div>
      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.content}</div>
        ))}
      </div>
    <div className="chat-input">
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (input.trim()) send();
      }
    }}
    placeholder="Ask a question..."
  />
  <button onClick={send} disabled={!input.trim()}>
    Send
  </button>
</div>

    </div>
  );
}
