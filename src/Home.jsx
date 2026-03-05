import React, { useState } from 'react';
import './App.css'; 

export default function Home({ onSelectMode, onSelectAvatar, llmMode, setLlmMode }) {
  // Track which persona card is visually active
  const [selectedId, setSelectedId] = useState('agent1');

  // MICA AGENTS: Mapping the exact filenames from the public folder
  const agents = [
    { 
      id: 'agent1', 
      label: 'MICA Core', 
      desc: 'Chief Strategist', 
      file: '/avatar.vrm', 
      icon: '🧠' 
    },
    { 
      id: 'agent2', 
      label: 'Analyst', 
      desc: 'Data & ROI Focus', 
      file: '/Bob.vrm', 
      icon: '📊' 
    },
    { 
      id: 'agent3', 
      label: 'Creative', 
      desc: 'Content & Copy', 
      file: '/Alice.vrm', 
      icon: '🎨' 
    }
  ];

  // Handle agent selection and update the global avatar state
  const handleAgentClick = (a) => {
    setSelectedId(a.id);
    onSelectAvatar(a.file); 
  };

  return (
    <div className="home-container">
      <h1 className="brand-title">MICA</h1>
      <p className="brand-subtitle">Marketing Intelligence & Campaign Automation</p>
      
      {/* AGENT SELECTION GRID */}
      <div className="selection-grid">
        {agents.map(a => (
            <div 
                key={a.id} 
                className={`persona-card ${selectedId === a.id ? 'active' : ''}`}
                onClick={() => handleAgentClick(a)}
            >
                <div className="persona-icon">{a.icon}</div>
                <div className="persona-label">{a.label}</div>
                <div className="persona-desc">{a.desc}</div>
            </div>
        ))}
      </div>

      {/* --- NEW: ENGINE TOGGLE SWITCH --- */}
      <div className="engine-toggle-container">
        <span className={llmMode === 'offline' ? 'active-label' : 'inactive-label'}>
          Local (Offline)
        </span>
        
        <label className="switch">
          <input 
            type="checkbox" 
            checked={llmMode === 'online'} 
            onChange={() => setLlmMode(prev => prev === 'offline' ? 'online' : 'offline')} 
          />
          <span className="slider round"></span>
        </label>
        
        <span className={llmMode === 'online' ? 'active-label online-glow' : 'inactive-label'}>
          Cloud API (Online)
        </span>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mode-buttons">
        <button className="action-btn" onClick={() => onSelectMode('text')}>
           💬 Strategy Chat
        </button>
        <button className="action-btn" onClick={() => onSelectMode('video')}>
           📹 Live Consult
        </button>
      </div>
    </div>
  );
}