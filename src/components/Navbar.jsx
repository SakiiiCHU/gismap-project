// src/components/Navbar.jsx
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__logo font-zeyada font-bold text-2xl">GIS Map Explorer</div>
      <ul className="navbar__menu">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/explore">Explore</Link></li>
        <li><a href="#">About</a></li>
      </ul>
    </nav>
  );
}
