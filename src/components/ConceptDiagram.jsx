// src/components/ConceptDiagram.jsx
export default function ConceptDiagram() {
  return (
    <div className="diagram">
      <svg
        className="diagram__svg"
        viewBox="0 0 980 360"
        role="img"
        aria-label="Concept diagram: MRT or District filter to Venues, then to Events"
      >
        <defs>
          {/* soft glow */}
          <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="
                1 0 0 0 0
                0 1 0 0 0
                0 0 1 0 0
                0 0 0 0.7 0"
              result="glowColor"
            />
            <feMerge>
              <feMergeNode in="glowColor" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* glass */}
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.14)" />
            <stop offset="55%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
          </linearGradient>

          {/* accent strokes */}
          <linearGradient id="accentA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,90,160,0.95)" />
            <stop offset="100%" stopColor="rgba(255,180,220,0.55)" />
          </linearGradient>

          <linearGradient id="accentB" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(90,190,255,0.95)" />
            <stop offset="100%" stopColor="rgba(180,230,255,0.55)" />
          </linearGradient>

          <linearGradient id="accentC" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(90,255,200,0.85)" />
            <stop offset="100%" stopColor="rgba(170,255,230,0.45)" />
          </linearGradient>

          {/* arrow head */}
          <marker
            id="arrow"
            markerWidth="12"
            markerHeight="12"
            refX="10"
            refY="6"
            orient="auto"
          >
            <path d="M0,0 L12,6 L0,12 Z" fill="rgba(255,255,255,0.75)" />
          </marker>

          {/* dotted flow */}
          <pattern id="dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1.8" cy="1.8" r="1.1" fill="rgba(255,255,255,0.16)" />
          </pattern>
        </defs>

        {/* background hint */}
        <rect x="0" y="0" width="980" height="360" fill="url(#dots)" opacity="0.55" />

        {/* LEFT INPUT: MRT */}
        <g filter="url(#glow)">
          <rect
            x="70"
            y="72"
            rx="22"
            ry="22"
            width="260"
            height="108"
            fill="url(#glass)"
            stroke="url(#accentA)"
            strokeWidth="1.6"
            opacity="0.98"
          />
          <text x="100" y="110" className="diagram__title">MRT Filter</text>
          <text x="100" y="138" className="diagram__sub">
            Line → Station (500m walk)
          </text>
        </g>

        {/* LEFT INPUT: District */}
        <g filter="url(#glow)">
          <rect
            x="70"
            y="196"
            rx="22"
            ry="22"
            width="260"
            height="108"
            fill="url(#glass)"
            stroke="url(#accentB)"
            strokeWidth="1.6"
            opacity="0.98"
          />
          <text x="100" y="234" className="diagram__title">District Filter</text>
          <text x="100" y="262" className="diagram__sub">
            Administrative area selection
          </text>
        </g>

        {/* MIDDLE: Venues */}
        <g filter="url(#glow)">
          <rect
            x="390"
            y="108"
            rx="26"
            ry="26"
            width="240"
            height="144"
            fill="rgba(255,255,255,0.06)"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.6"
          />
          <text x="510" y="160" textAnchor="middle" className="diagram__title">
            Venues
          </text>
          <text x="510" y="188" textAnchor="middle" className="diagram__sub">
            Verified locations
          </text>

          {/* tiny “pins” */}
          <g opacity="0.85">
            <circle cx="450" cy="215" r="3.2" fill="rgba(255,255,255,0.55)" />
            <circle cx="482" cy="225" r="2.6" fill="rgba(255,255,255,0.45)" />
            <circle cx="520" cy="214" r="3.4" fill="rgba(255,255,255,0.60)" />
            <circle cx="560" cy="228" r="2.8" fill="rgba(255,255,255,0.45)" />
            <circle cx="590" cy="214" r="3.1" fill="rgba(255,255,255,0.52)" />
          </g>
        </g>

        {/* RIGHT: Events */}
        <g filter="url(#glow)">
          <rect
            x="700"
            y="120"
            rx="26"
            ry="26"
            width="210"
            height="120"
            fill="rgba(255,255,255,0.08)"
            stroke="url(#accentC)"
            strokeWidth="1.6"
          />
          <text x="805" y="164" textAnchor="middle" className="diagram__title">
            Events
          </text>
          <text x="805" y="192" textAnchor="middle" className="diagram__sub">
            Exhibitions · Workshops
          </text>
        </g>

        {/* FLOW LINES */}
        <path
          d="M330 126 C 365 126, 360 160, 390 160"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        <path
          d="M330 250 C 365 250, 360 210, 390 200"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />
        <path
          d="M630 180 C 660 180, 670 180, 700 180"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="2"
          markerEnd="url(#arrow)"
        />

        {/* CAPTION */}
        <text x="70" y="342" className="diagram__caption">
          Concept: spatial filters → venue lookup → event results (kept in sync with the map UI)
        </text>
      </svg>
    </div>
  );
}