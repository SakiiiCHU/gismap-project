// src/App.jsx
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Home from "./home/Home";
import MapPage from "./map/page.jsx";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<MapPage />} />
      </Routes>
    </Router>
  );
}

export default App;
