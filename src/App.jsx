import React, { useState } from 'react';
import Home from './Home';
import TextMode from './TextMode';
import VideoMode from './VideoMode';
import './App.css';

export default function App() {
  // --- APPLICATION STATE ---
  const [mode, setMode] = useState('home'); // Controls which screen is active
  const [avatar, setAvatar] = useState('/avatar.vrm'); // Controls which 3D model is loaded
  const [llmMode, setLlmMode] = useState('offline'); // NEW: Controls the AI Engine routing (Ollama vs Cloud)

  return (
    <>
      {/* HOME SCREEN 
        Passes down state setters so the user can select their Agent and Engine 
      */}
      {mode === 'home' && (
        <Home 
            onSelectMode={setMode} 
            onSelectAvatar={setAvatar} 
            llmMode={llmMode} 
            setLlmMode={setLlmMode} 
        />
      )}
      
      {/* TEXT MODE (Strategy Chat)
        Passes the selected avatar file and the current LLM mode to the chat interface 
      */}
      {mode === 'text' && (
        <TextMode 
            onBack={() => setMode('home')} 
            avatarFile={avatar} 
            llmMode={llmMode} 
        />
      )}
      
      {/* VIDEO MODE (Live Consult)
        Passes the selected avatar file and the current LLM mode to the voice/video interface 
      */}
      {mode === 'video' && (
        <VideoMode 
            onBack={() => setMode('home')} 
            avatarFile={avatar} 
            llmMode={llmMode} 
        />
      )}
    </>
  );
}