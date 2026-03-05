import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Avatar from './Avatar';
import { exportChatToPDF } from './exportToPDF';
import './App.css';

export default function TextMode({ onBack, avatarFile, llmMode }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // FIX: The Ref Vault implementation for Strategy Chat
  const messagesRef = useRef([]);
  const [messages, setMessages] = useState([]);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Welcome Message
  useEffect(() => {
    const greetingMsg = { 
        sender: 'mica', 
        text: `MICA Intelligence Hub Online. Engine: ${llmMode.toUpperCase()}. Reviewing market data... How can I assist with your strategy today?` 
    };
    messagesRef.current = [greetingMsg];
    setMessages([greetingMsg]);
  }, [llmMode]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setLoading(true);

    // FIX: Add User Message immediately to the Vault and State
    const userMsgObj = { sender: 'user', text: userMsg };
    messagesRef.current = [...messagesRef.current, userMsgObj];
    setMessages([...messagesRef.current]);

    // Prepare History for LLM Context (Excluding the user's current message which goes in user_input)
    const historyPayload = messagesRef.current.slice(0, -1).map(m => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }));

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: userMsg,
          target_lang: "en-US", 
          history: historyPayload,
          llm_mode: llmMode 
        })
      });

      const data = await res.json();
      
      // FIX: Add MICA response to the Vault and State
      const micaMsgObj = { sender: 'mica', text: data.text };
      messagesRef.current = [...messagesRef.current, micaMsgObj];
      setMessages([...messagesRef.current]);

    } catch (e) {
      console.error("Chat error:", e);
      const errorMsg = { sender: 'mica', text: "Connection to MICA Core interrupted." };
      messagesRef.current = [...messagesRef.current, errorMsg];
      setMessages([...messagesRef.current]);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      {/* LEFT SIDE: VISUAL PRESENCE */}
      <div className="avatar-window">
        <button className="back-button" onClick={onBack}>⬅ Dashboard</button>
        <Canvas camera={{ position: [0, 1.4, 1.2], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <spotLight position={[0, 2, 2]} intensity={1} />
          <Suspense fallback={null}>
            <Avatar audioUrl={null} modelPath={avatarFile} isGreeting={false} />
          </Suspense>
          <OrbitControls target={[0, 1.3, 0]} enableZoom={false} />
        </Canvas>
      </div>

      {/* RIGHT SIDE: CHAT INTERFACE */}
      <div className="chat-interface">
        <div className="chat-header">
            <div>
                <h2 style={{margin:0, fontSize: '1.2rem', color: '#fff'}}>MICA Hub</h2>
                <span className="online-status">● {llmMode === 'online' ? 'Cloud API' : 'Local Engine'}</span>
            </div>
            
            {/* FIX: PDF Exporter pulls directly from the Ref Vault */}
            <button 
                className="export-btn" 
                onClick={() => exportChatToPDF(messagesRef.current, "Strategy Chat")}
                title="Download Conversation"
            >
                📥 Export PDF
            </button>
        </div>

        <div className="messages-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`msg ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
          {loading && <div className="msg mica typing">MICA is analyzing...</div>}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about campaigns, ROI, or market trends..."
            disabled={loading}
          />
          <button onClick={sendMessage} disabled={loading}>
            {loading ? "..." : "SEND"}
          </button>
        </div>
      </div>
    </div>
  );
}