import { Link } from "react-router-dom";
import ConceptDiagram from "../components/ConceptDiagram.jsx";

export default function HomeBase() {
  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">Taipei · Exhibitions · Workshops</div>

          <h1 className="hero-title">
            Discover Taipei’s Art Events Through Interactive Mapping
          </h1>

          <p className="hero-text">
            A multi-layer GIS interface for exploring exhibitions and creative
            workshops across Taipei. Discover venues through spatial filters,
            MRT stations, and district-based searches.
          </p>

          <div className="hero-buttons">
            <Link to="/explore" className="btn-primary">
              Explore the Map
            </Link>
          </div>

          <div className="hero-tech">
            React · React-Leaflet · GeoJSON · FitBounds · FlyTo · Node · Express
            · MySQL
          </div>
        </div>
      </section>

      {/* CONCEPT */}
      <section className="concept">
        <h2>Spatial Discovery Through Multiple Filters</h2>

        <p>
          Cultural venues are discovered through the intersection of spatial
          datasets and user-selected filters. MRT stations, administrative
          districts, and verified venue locations combine to dynamically reveal
          exhibitions and workshops across the city.
        </p>
        <ConceptDiagram />
      </section>

      {/* FEATURES */}
      <section className="features">
        <h2>Key Interaction Features</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <h3>Layered GeoJSON Map</h3>
            <p>
              MRT lines, stations, districts and venues are dynamically rendered
              as interactive GeoJSON layers.
            </p>
          </div>

          <div className="feature-card">
            <h3>Bi-Directional Interaction</h3>
            <p>
              Map selections update filter controls while UI selections
              highlight spatial geometry on the map.
            </p>
          </div>

          <div className="feature-card">
            <h3>Map-Result Synchronization</h3>
            <p>
              Selecting a result navigates the map using flyTo and displays the
              venue through markers and popups.
            </p>
          </div>

          <div className="feature-card">
            <h3>FitBounds Navigation</h3>
            <p>
              The map automatically adjusts the viewport to keep selected areas
              clearly visible.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
