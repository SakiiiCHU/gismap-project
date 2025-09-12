// src/App.jsx
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import HomeBase from "./home/HomeBase.jsx";   
import MapPage from "./map/page.jsx";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
      <Route path="/" element={<HomeBase />} />
      <Route path="/explore" element={<MapPage />} />
      </Routes>
    </Router>
  );
}

export default App;
