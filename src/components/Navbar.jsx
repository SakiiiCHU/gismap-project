// src/components/Navbar.jsx
import React from "react";

export default function Navbar() {
  return (
    <nav className="navbar">
  <div className="navbar__logo">GIS Map Explorer</div>
  <ul className="navbar__menu">
    <li><a href="#">Home</a></li>
    <li><a href="#">Explore</a></li>
    <li><a href="#">About</a></li>
  </ul>
</nav>

  );
}
