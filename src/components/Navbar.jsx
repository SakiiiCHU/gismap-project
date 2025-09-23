import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar__logo font-zeyada font-bold text-2xl">
        GIS Map Explorer
      </div>

      {/* 電腦版選單 */}
      {/* 電腦版選單 */}
      <ul className="navbar__menu">
        <li>
          <Link to="/" className="flip-link">
            <span className="flip-inner">
              <span className="front">Home</span>
              <span className="back">Home</span>
            </span>
          </Link>
        </li>
        <li>
          <Link to="/explore" className="flip-link">
            <span className="flip-inner">
              <span className="front">Explore</span>
              <span className="back">Explore</span>
            </span>
          </Link>
        </li>
        <li>
          <a href="#" className="flip-link">
            <span className="flip-inner">
              <span className="front">About</span>
              <span className="back">About</span>
            </span>
          </a>
        </li>
      </ul>

      <button
        className={`hamburger ${menuOpen ? "is-active" : ""}`}
        onClick={toggleMenu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        <span className="line line1"></span>
        <span className="line line2"></span>
      </button>

      <div className={`overlay-menu ${menuOpen ? "open" : ""}`}>
        <div className="overlay-logo font-zeyada font-bold text-2xl">
          GIS Map Explorer
        </div>
        <ul className="overlay-menu__list">
          <li>
            <Link to="/" onClick={closeMenu} className="flip-link">
              <span className="flip-inner">
                <span className="front">Home</span>
                <span className="back">Home</span>
              </span>
            </Link>
          </li>
          <li>
            <Link to="/explore" onClick={closeMenu} className="flip-link">
              <span className="flip-inner">
                <span className="front">Explore</span>
                <span className="back">Explore</span>
              </span>
            </Link>
          </li>
          <li>
            <a href="#" onClick={closeMenu} className="flip-link">
              <span className="flip-inner">
                <span className="front">About</span>
                <span className="back">About</span>
              </span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
