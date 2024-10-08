import React from 'react';
import './header.css';

function Header({ darkMode, toggleDarkMode }) {
  const handleLogoClick = () => {
    window.location.href = '/';
  }
  return (
    <header>
      <button className="header-button" onClick={handleLogoClick}>
        <img src="/logo.png" alt="QuickChess!"></img>
      </button>
      <div className="dark-mode-container">
        <label className="dark-mode-label">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={toggleDarkMode}
            className="dark-mode-checkbox"
          />
          <span className="dark-mode-slider"></span>
        </label>
        <span className="dark-mode-text">{darkMode ? '🌙' : '☀️'}</span>
      </div>
    </header>
  )
}

export default Header;