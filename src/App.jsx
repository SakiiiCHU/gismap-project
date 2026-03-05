// src/App.jsx  (Complete replacement)
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";

import Navbar from "./components/Navbar";
import HomeBase from "./home/HomeBase.jsx";
import MapPage from "./map/page.jsx";
import VisualLab from "./VisualLab/VisualLabBase.jsx";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeBase />} />
        <Route path="/explore" element={<MapPage />} />
        <Route path="/visual-lab" element={<VisualLab />} />
      </Routes>
    </Router>
  );
}

export default App;