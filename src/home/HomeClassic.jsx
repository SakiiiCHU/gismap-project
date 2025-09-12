import { useRef, useEffect } from "react";
import { createNoise3D } from "simplex-noise";

/**
 * Ring deformation via periodic Fourier series with ORDER GUARANTEE
 * - Periodic r(θ): r(0)=r(2π) and r'(0)=r'(2π) → no seam.
 * - Single shared deformation field f(θ) across rings (scaled per ring).
 * - **Monotonic enforcement per angle**: for every θ_i, ensure r_{k+1}(θ_i) ≥ r_k(θ_i)+gap
 *   to prevent inner rings from exceeding/overlapping outer rings.
 * - Canvas fixed and per-frame save/restore to avoid spill.
 */
export default function Home() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const dprRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ===== Parameters =====
    const TOTAL = 34;             // number of rings
    const BASE_SPACING = 12;      // base spacing between rings (px)
    const ANGLE_STEP = 0.002;      // denser sampling for smoothness

    // Temporal pulses
    const PULSE_AMP = 0.00008;
    const PULSE_SPEED = 0.000000001;   // per ms
    const RING_PHASE_LAG = 0.0001;

    // Outer ring deformation gain
    const OUTER_GAIN_EXP = 2;   // outer rings deform more

    // Fourier (periodic) deformation field f(θ)
    const M = 5;                  // harmonics
    const COEF_DECAY = 0.45;      // higher-order decay
    const FLOW = 0.0001;         // per ms (noise time flow)

    // Monotonic gap between adjacent rings (in pixels)
    const MIN_GAP = BASE_SPACING * 0.6; // tune 0.4~0.8 depending on look

    // DPR-aware resize
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      dprRef.current = dpr;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
    }

    resize();
    window.addEventListener("resize", resize);

    const N = Math.floor((Math.PI * 2) / ANGLE_STEP);
    const angles = new Float32Array(N);
    for (let i = 0; i < N; i++) angles[i] = i * ANGLE_STEP;

    const pts = new Array(N);
    const noise3D = createNoise3D();

    // ---- Closed centripetal Catmull-Rom to Bezier (periodic) ----
    const alpha = 0.5;
    function drawClosedSpline(ctx, points) {
      const n = points.length;
      if (n < 2) return;

      // chord-length parameters (periodic)
      const t = new Float32Array(n + 3);
      const P = (i) => points[(i + n) % n];
      t[0] = 0;
      for (let i = 0; i < n + 2; i++) {
        const a = P(i - 1), b = P(i);
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        t[i + 1] = t[i] + Math.pow(Math.hypot(dx, dy), alpha);
      }

      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 0; i < n; i++) {
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        const t0 = t[i], t1 = t[i + 1], t2 = t[i + 2], t3 = t[i + 3];
        const dt01 = t1 - t0 || 1e-6;
        const dt12 = t2 - t1 || 1e-6;
        const dt23 = t3 - t2 || 1e-6;
        // tangents
        const A1x = (p1[0] - p0[0]) / dt01, A1y = (p1[1] - p0[1]) / dt01;
        const A2x = (p2[0] - p1[0]) / dt12, A2y = (p2[1] - p1[1]) / dt12;
        const m1x = (A2x - A1x) * dt12, m1y = (A2y - A1y) * dt12;
        const B1x = (p2[0] - p1[0]) / dt12, B1y = (p2[1] - p1[1]) / dt12;
        const B2x = (p3[0] - p2[0]) / dt23, B2y = (p3[1] - p2[1]) / dt23;
        const m2x = (B2x - B1x) * dt12, m2y = (B2y - B1y) * dt12;
        // Hermite -> Bezier
        const c1x = p1[0] + m1x / 3, c1y = p1[1] + m1y / 3;
        const c2x = p2[0] - m2x / 3, c2y = p2[1] - m2y / 3;
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
      }
      // no closePath(): end point equals start point due to periodic construction
    }

    function draw(tsMs) {
      const tSec = tsMs * 0.001;
      const dpr = dprRef.current;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.width / dpr, h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);

      ctx.strokeStyle = "white";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = "transparent";
      ctx.globalCompositeOperation = "source-over";

      // Global pulse
      const globalPulse = 1 + Math.sin(tSec * (PULSE_SPEED * 1000)) * PULSE_AMP;

      // === Build a single periodic deformation field f(θ) ===
      // f(θ) = Σ_{m=1..M} [a_m cos(mθ) + b_m sin(mθ)] with decayed amplitudes
      const a = new Float32Array(M + 1);
      const b = new Float32Array(M + 1);
      for (let m = 1; m <= M; m++) {
        const decay = Math.pow(COEF_DECAY, m - 1);
        const na = noise3D(m * 1.17, 0.37, tSec * (FLOW * 1000));
        const nb = noise3D(m * -0.91, 0.53, 100 + tSec * (FLOW * 1000));
        a[m] = decay * na;
        b[m] = decay * nb;
      }

      const f = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const th = angles[i];
        let sum = 0;
        for (let m = 1; m <= M; m++) sum += a[m] * Math.cos(m * th) + b[m] * Math.sin(m * th);
        // Soft clamp to avoid extreme dents that could cause self-loops
        const CLAMP = 0.9; // in practice |sum| rarely exceeds ~1
        f[i] = Math.max(-CLAMP, Math.min(CLAMP, sum));
      }

      // === For each angle θ_i, compute radii across rings and enforce monotonicity ===
      // Prepare an array to reuse per θ index
      const rLine = new Float32Array(TOTAL);

      for (let i = 0; i < N; i++) {
        const th = angles[i];

        // First: raw radii per ring
        for (let ring = 0; ring < TOTAL; ring++) {
          const rPow = Math.pow(ring / (TOTAL - 1), OUTER_GAIN_EXP);
          const baseR = ring * BASE_SPACING * globalPulse;
          const localPulse = 1 + Math.sin(tSec * (PULSE_SPEED * 1000) - ring * RING_PHASE_LAG) * PULSE_AMP;
          const gain = 0.18 + 0.55 * rPow; // outer rings deform more
          const rRaw = baseR * localPulse * (1 + gain * f[i]);
          rLine[ring] = rRaw;
        }

        // Second: monotonic enforcement outward with minimum gap
        let last = rLine[0];
        for (let ring = 1; ring < TOTAL; ring++) {
          const minAllowed = last + MIN_GAP;
          if (rLine[ring] < minAllowed) rLine[ring] = minAllowed;
          last = rLine[ring];
        }

        // Third: write cartesian points for each ring at angle θ_i
        for (let ring = 0; ring < TOTAL; ring++) {
          const r = rLine[ring];
          if (!pts[ring]) pts[ring] = new Array(N);
          pts[ring][i] = [r * Math.cos(th), r * Math.sin(th)];
        }
      }

      // === Draw rings from inner to outer ===
      for (let ring = 0; ring < TOTAL; ring++) {
        const rPow = Math.pow(ring / (TOTAL - 1), OUTER_GAIN_EXP);
        ctx.lineWidth = 0.8 + rPow * 0.6;
        ctx.beginPath();
        drawClosedSpline(ctx, pts[ring]);
        ctx.stroke();
      }

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        display: "block",
        width: "100vw",
        height: "100vh",
        background: "black",
      }}
    />
  );
}
