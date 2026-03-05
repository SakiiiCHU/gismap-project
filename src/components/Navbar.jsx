// Navbar.jsx (Complete replacement)
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);

  // 如果你還沒有 About 頁，先用這個避免 href="#"
  const handleAboutClick = (e) => {
    e.preventDefault();
    closeMenu();
    // 之後你做 /about 再改成 <Link to="/about" ... />
    alert("About page is coming soon 🙂");
  };

  return (
    <nav className="navbar">
      <div className="navbar__logo font-zeyada font-bold text-2xl">
        GIS Map Explorer
      </div>

      {/* Desktop menu */}
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
          <Link to="/visual-lab" className="flip-link">
            <span className="flip-inner">
              <span className="front">Visual Lab</span>
              <span className="back">Visual Lab</span>
            </span>
          </Link>
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

      {/* Mobile overlay */}
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
            <Link to="/visual-lab" onClick={closeMenu} className="flip-link">
              <span className="flip-inner">
                <span className="front">Visual Lab</span>
                <span className="back">Visual Lab</span>
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}