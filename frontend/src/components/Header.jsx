import React from 'react';
import './Header.css';

export default function Header({ sessionId, analyzed }) {
  return (
    <header className="header">
      <div className="header-inner">
        {/* Brand */}
        <div className="header-brand">
          <div className="header-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="url(#g1)" strokeWidth="1.5"/>
              <path d="M7 17l4-5 3 3 4-6 3 4" stroke="url(#g2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="21" cy="9" r="2" fill="#3b82f6"/>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="28" y2="28">
                  <stop stopColor="#3b82f6"/>
                  <stop offset="1" stopColor="#8b5cf6"/>
                </linearGradient>
                <linearGradient id="g2" x1="7" y1="17" x2="21" y2="9">
                  <stop stopColor="#06b6d4"/>
                  <stop offset="1" stopColor="#3b82f6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="header-title">
              <span className="gradient-text">AnalytIQ</span>
            </h1>
            <p className="header-subtitle">Autonomous Data Analyst</p>
          </div>
        </div>

        {/* Status pills */}
        <div className="header-status">
          {sessionId && (
            <div className="status-pill">
              <div className="pulse-dot blue" />
              <span className="status-label">Session Active</span>
            </div>
          )}
          {analyzed && (
            <div className="status-pill status-pill--success">
              <div className="pulse-dot green" />
              <span className="status-label">Analysis Complete</span>
            </div>
          )}
          <div className="status-pill">
            <div className="online-dot" />
            <span className="status-label">Backend Online</span>
          </div>
        </div>
      </div>
      <div className="glow-line" />
    </header>
  );
}
