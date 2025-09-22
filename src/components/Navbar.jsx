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

      <button
        className={`hamburger ${menuOpen ? "is-active" : ""}`}
        onClick={toggleMenu}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
      >
        <span className="line line1"></span>
        <span className="line line2"></span>
      </button>

      <div className={`overlay-menu ${menuOpen ? "open" : ""}`}>
        
        <ul className="overlay-menu__list">
          <li><Link to="/" onClick={closeMenu}>Home</Link></li>
          <li><Link to="/explore" onClick={closeMenu}>Explore</Link></li>
          <li><a href="#" onClick={closeMenu}>About</a></li>
        </ul>
      </div>

    </nav>
  );
}
