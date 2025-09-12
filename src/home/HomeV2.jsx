import { useRef, useEffect } from "react";
import { createNoise3D } from "simplex-noise";

/**
 * Ring deformation via periodic Fourier series with ORDER GUARANTEE
 * - Periodic r(θ): r(0)=r(2π) and r'(0)=r'(2π) → no seam.
 * - Single shared deformation field f(θ) across rings (scaled per ring).
 * - Monotonic enforcement per angle: r_{k+1}(θ_i) ≥ r_k(θ_i)+gap.
 * - Reduced speed (1/3) + strong angular smoothing to remove jaggies.
 * - NEW: Radial sweep that modulates "segment density" and opacity
 *   from outer → inner → outer (ping‑pong), without changing geometry.
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
    const TOTAL = 34;                 // number of rings
    const BASE_SPACING = 12;          // px between rings
    const ANGLE_STEP = 0.015;         // angular sampling (rad)

    // Temporal pulses (slowed to 1/3)
    const PULSE_AMP = 0.08;
    const PULSE_SPEED = 0.0011 / 3;   // per ms
    const RING_PHASE_LAG = 0.06;

    // Outer ring deformation gain
    const OUTER_GAIN_EXP = 1.6;

    // Fourier field
    const M = 6;                      // harmonics
    const COEF_DECAY = 0.55;          // decay across harmonics
    const FLOW = 0.00035 / 3;         // per ms (slower)

    // Minimum radial gap to keep ring order
    const MIN_GAP = BASE_SPACING * 0.6;

    // === Radial sweep (density spotlight) ===
    const SWEEP_SPEED = 0.05;         // cycles per second (visual sweep speed)
    const FOCUS_SIGMA = 2.4;          // how many rings wide the focus blob spreads
    const DENSITY_GAIN = 1.2;         // extra resample density at focus (×base)
    const BASE_ALPHA = 0.25;          // minimum opacity away from focus

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

    // ===== Closed centripetal Catmull–Rom to Bézier =====
    const alpha = 0.5;
    function drawClosedSpline(ctx, points) {
      const n = points.length;
      if (n < 2) return;

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
        const A1x = (p1[0] - p0[0]) / dt01, A1y = (p1[1] - p0[1]) / dt01;
        const A2x = (p2[0] - p1[0]) / dt12, A2y = (p2[1] - p1[1]) / dt12;
        const m1x = (A2x - A1x) * dt12, m1y = (A2y - A1y) * dt12;
        const B1x = (p2[0] - p1[0]) / dt12, B1y = (p2[1] - p1[1]) / dt12;
        const B2x = (p3[0] - p2[0]) / dt23, B2y = (p3[1] - p2[1]) / dt23;
        const m2x = (B2x - B1x) * dt12, m2y = (B2y - B1y) * dt12;
        const c1x = p1[0] + m1x / 3, c1y = p1[1] + m1y / 3;
        const c2x = p2[0] - m2x / 3, c2y = p2[1] - m2y / 3;
        ctx.bezierCurveTo(c1x, c1y, c2x, c2y, p2[0], p2[1]);
      }
    }

    // --- Equal-arc-length resampling for uniform segment spacing ---
    function resampleClosed(points, targetCount) {
      const n = points.length;
      const P = (i) => points[(i + n) % n];
      const cum = new Float32Array(n + 1);
      cum[0] = 0;
      for (let i = 1; i <= n; i++) {
        const a = P(i - 1), b = P(i);
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        cum[i] = cum[i - 1] + Math.hypot(dx, dy);
      }
      const total = cum[n];
      const out = new Array(targetCount);
      let seg = 1;
      for (let k = 0; k < targetCount; k++) {
        const s = (k * total) / targetCount;
        while (seg < n && cum[seg] < s) seg++;
        const s0 = cum[seg - 1], s1 = cum[seg];
        const t = s1 - s0 > 1e-6 ? (s - s0) / (s1 - s0) : 0;
        const a = P(seg - 1), b = P(seg);
        out[k] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      }
      return out;
    }

    function gaussianSmooth(input, kernelSize = 7) {
      const N = input.length;
      const sigma = kernelSize / 2;
      const kernel = new Float32Array(kernelSize);
      let sum = 0;
      for (let i = 0; i < kernelSize; i++) {
        const x = i - Math.floor(kernelSize / 2);
        const w = Math.exp(-(x * x) / (2 * sigma * sigma));
        kernel[i] = w;
        sum += w;
      }
      for (let i = 0; i < kernelSize; i++) kernel[i] /= sum;

      const out = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        let acc = 0;
        for (let k = 0; k < kernelSize; k++) {
          const idx = (i + k - Math.floor(kernelSize / 2) + N) % N;
          acc += input[idx] * kernel[k];
        }
        out[i] = acc;
      }
      return out;
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

      // Base pulse for all rings
      const globalPulse = 1 + Math.sin(tSec * (PULSE_SPEED * 1000)) * PULSE_AMP;

      // === Fourier coefficients ===
      const a = new Float32Array(M + 1);
      const b = new Float32Array(M + 1);
      for (let m = 1; m <= M; m++) {
        const decay = Math.pow(COEF_DECAY, m - 1);
        const na = noise3D(m * 1.17, 0.37, tSec * (FLOW * 1000));
        const nb = noise3D(m * -0.91, 0.53, 100 + tSec * (FLOW * 1000));
        a[m] = decay * na;
        b[m] = decay * nb;
      }

      // === Angular deformation field (smoothed) ===
      const fRaw = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const th = angles[i];
        let sum = 0;
        for (let m = 1; m <= M; m++) sum += a[m] * Math.cos(m * th) + b[m] * Math.sin(m * th);
        const CLAMP = 0.7;
        fRaw[i] = Math.max(-CLAMP, Math.min(CLAMP, sum));
      }
      const f = gaussianSmooth(fRaw, 7);

      // === Compute radii at each angle with monotonic enforcement ===
      const rLine = new Float32Array(TOTAL);
      for (let i = 0; i < N; i++) {
        const th = angles[i];

        for (let ring = 0; ring < TOTAL; ring++) {
          const rPow = Math.pow(ring / (TOTAL - 1), OUTER_GAIN_EXP);
          const baseR = ring * BASE_SPACING * globalPulse;
          const localPulse = 1 + Math.sin(tSec * (PULSE_SPEED * 1000) - ring * RING_PHASE_LAG) * PULSE_AMP;
          const gain = 0.18 + 0.55 * rPow;
          const rRaw = baseR * localPulse * (1 + gain * f[i]);
          rLine[ring] = rRaw;
        }

        // enforce outward monotonic with minimum gap
        let last = rLine[0];
        for (let ring = 1; ring < TOTAL; ring++) {
          const minAllowed = last + MIN_GAP;
          if (rLine[ring] < minAllowed) rLine[ring] = minAllowed;
          last = rLine[ring];
        }

        for (let ring = 0; ring < TOTAL; ring++) {
          const r = rLine[ring];
          if (!pts[ring]) pts[ring] = new Array(N);
          pts[ring][i] = [r * Math.cos(th), r * Math.sin(th)];
        }
      }

      // === Radial sweep focus (outer → inner → outer) ===
      const cycle = tSec * SWEEP_SPEED * 2; // ping-pong period = 1/SWEEP_SPEED
      const phase = cycle % 2;             // 0..2
      const focus = phase < 1
        ? (TOTAL - 1) * phase               // down to inner
        : (TOTAL - 1) * (2 - phase);        // back to outer

      for (let ring = 0; ring < TOTAL; ring++) {
        const rPow = Math.pow(ring / (TOTAL - 1), OUTER_GAIN_EXP);
        const dist = (ring - focus) / FOCUS_SIGMA;
        const wgt = Math.exp(-0.5 * dist * dist); // 0..1 Gaussian around focus

        // Opacity & width modulation
        ctx.globalAlpha = BASE_ALPHA + (1 - BASE_ALPHA) * wgt;
        ctx.lineWidth = 0.7 + rPow * 0.55 + 0.4 * wgt;
        ctx.miterLimit = 1.2;

        // Segment density modulation via equal-arc-length resampling
        const baseCount = Math.max(180, Math.floor(pts[ring].length * 1.2));
        const targetCount = Math.floor(baseCount * (1 + DENSITY_GAIN * wgt));
        const smoothPts = resampleClosed(pts[ring], targetCount);

        ctx.beginPath();
        drawClosedSpline(ctx, smoothPts);
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
