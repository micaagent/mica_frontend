import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Avatar from './Avatar';
import { exportChatToPDF } from './exportToPDF';
import './App.css'; 

export default function VideoMode({ onBack, avatarFile, llmMode }) {
  const [input, setInput] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [responseText, setResponseText] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState('en-US'); 
  const videoRef = useRef(null);
  const [isGreeting, setIsGreeting] = useState(false);

  // FIX: THE REF VAULT. This safely stores the history immune to closure bugs.
  const chatHistoryRef = useRef([]); 
  const [chatHistory, setChatHistory] = useState([]); // Used purely to trigger re-renders if needed

  const supportedLanguages = [
    { code: "en-US", label: "🇺🇸 English" },
    { code: "hi-IN", label: "🇮🇳 Hindi" },
    { code: "ja-JP", label: "🇯🇵 Japanese" },
    { code: "es-ES", label: "🇪🇸 Spanish" },
    { code: "fr-FR", label: "🇫🇷 French" },
    { code: "de-DE", label: "🇩🇪 German" },
  ];

  // --- 1. GREETING SEQUENCE ---
  useEffect(() => {
    const triggerGreeting = async () => {
      setIsGreeting(true);
      setTimeout(() => setIsGreeting(false), 4000);

      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/greet', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ user_input: "", target_lang: lang, history: [], llm_mode: llmMode })
        });
        const data = await res.json();
        
        setAudioUrl(data.audio_url);
        setResponseText(data.text);
        
        // FIX: Save greeting to both the vault and state
        const greetingMsg = { sender: 'mica', text: data.text };
        chatHistoryRef.current = [greetingMsg];
        setChatHistory([greetingMsg]);
        
      } catch (e) {
        console.error("Greeting failed:", e);
      }
      setLoading(false);
    };

    triggerGreeting();
  }, [lang, llmMode]); 

  // Clear history on language change safely
  useEffect(() => {
    chatHistoryRef.current = [];
    setChatHistory([]); 
  }, [lang]);

  // --- 2. WEBCAM SETUP ---
  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (e) { console.error("Camera denied:", e); }
    }
    setupCamera();
    return () => {
        if(videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };
  }, []);

  // --- 3. SPEECH RECOGNITION ---
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Microphone dictation is primarily supported on Chrome, Edge, or Safari 14.1+.");
        return;
    }

    try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang; 
        recognition.interimResults = false; 
        recognition.maxAlternatives = 1;
        
        setResponseText("");
        
        recognition.onstart = () => setListening(true);
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInput(transcript);
          sendMessage(transcript);
        };
        
        recognition.onerror = (event) => {
            console.error("Speech Error:", event.error);
            setListening(false);
            if (event.error === 'not-allowed') {
                alert("Microphone access denied. Please click the lock icon in your URL bar.");
            }
        };

        recognition.onend = () => setListening(false);
        recognition.start();

    } catch (err) {
        console.error("Failed to initialize speech recognition:", err);
        setListening(false);
    }
  };

  // --- 4. BACKEND COMMUNICATION ---
  const sendMessage = async (msg) => {
    if(!msg) return;
    setLoading(true);
    
    // FIX: Pull history directly from the Ref Vault, guaranteeing 100% accuracy
    const historyPayload = chatHistoryRef.current.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
    }));

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ 
            user_input: msg,
            target_lang: lang,
            history: historyPayload,
            llm_mode: llmMode 
        })
      });
      const data = await res.json();
      
      setAudioUrl(data.audio_url);
      setResponseText(data.text);
      
      // FIX: Push the new interaction to the Ref Vault
      const newInteraction = [
          { sender: 'user', text: msg },
          { sender: 'mica', text: data.text }
      ];
      chatHistoryRef.current = [...chatHistoryRef.current, ...newInteraction];
      setChatHistory([...chatHistoryRef.current]);
      
    } catch (e) { console.error("Chat failure:", e); }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <div className="avatar-window">
        <button className="back-button" onClick={onBack}>⬅ End Session</button>
        
        {/* FIX: The PDF Exporter now pulls directly from the Ref Vault */}
        <button 
            className="export-btn video-export-btn" 
            onClick={() => exportChatToPDF(chatHistoryRef.current, "Live Consult")}
            title="Download Full Conversation Transcript"
        >
            📥 Export PDF
        </button>

        <div style={{
            position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', 
            zIndex: 100, background: 'rgba(0,0,0,0.8)', padding: '8px 15px', borderRadius: '25px', 
            border: '1px solid rgba(0, 210, 255, 0.3)'
        }}>
            <select 
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
                style={{ background: 'transparent', color: '#00d2ff', border: 'none', fontSize: '16px', cursor: 'pointer', outline: 'none', fontWeight: 'bold' }}
            >
                {supportedLanguages.map((l) => (
                    <option key={l.code} value={l.code} style={{color: 'black'}}>{l.label}</option>
                ))}
            </select>
        </div>

        {responseText && (
            <div className="subtitle-overlay">
                <strong style={{color: '#00d2ff'}}>MICA ({llmMode}):</strong> {responseText}
            </div>
        )}

        <Canvas camera={{ position: [0, 1.4, 1.2], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <spotLight position={[0, 2, 2]} intensity={1} />
          <Suspense fallback={null}>
            <Avatar key={avatarFile} audioUrl={audioUrl} modelPath={avatarFile} isGreeting={isGreeting} />
          </Suspense>
          <OrbitControls target={[0, 1.3, 0]} enableZoom={false}/>
        </Canvas>
      </div>
      
      <div className="user-video">
        <video ref={videoRef} autoPlay muted playsInline />
      </div>
      
      <div className="controls-overlay">
        <div className="status-pill">
            {loading ? `Analyzing via ${llmMode.toUpperCase()}...` : `Listening (${supportedLanguages.find(l=>l.code===lang)?.label})`}
        </div>
        
        <div className="mic-container">
            <button 
                className={`mic-button ${listening ? 'active' : ''}`} 
                onClick={startListening} 
                disabled={loading}
            >
                {listening ? "🛑 Recording..." : "🎤 Push to Talk"}
            </button>
        </div>
      </div>
    </div>
  );
}