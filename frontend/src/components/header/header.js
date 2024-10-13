import React from 'react';
import { Link } from 'react-router-dom';
import './header.css';

function Header({ darkMode, toggleDarkMode, isLoggedIn }) {
  const handleLogoClick = () => {
    window.location.href = '/';
  }
  return (
    <header className={`header ${darkMode ? 'dark-mode' : ''}`}>
      <Link className="header-button" onClick={handleLogoClick}>
        <img src="/logo.png" alt="Quick Chess"></img>
      </Link>
      {isLoggedIn && (
        <nav className='nav-bar'>
          <div className='nav-bar-element'>
          <Link to="/profile">Profile</Link>
          </div>
          <div className='nav-bar-element'>
          <Link to="/learn">Learn</Link>
          </div>
          <div className='nav-bar-element'>
          <Link to="/puzzles">Puzzles</Link>
          </div>
          <div className='nav-bar-element'>
          <Link to="/Settings">Settings</Link>
          </div>
        </nav>
      )}
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