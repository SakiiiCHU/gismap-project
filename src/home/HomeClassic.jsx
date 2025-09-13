import { useRef, useEffect } from "react";
import { createNoise3D } from "simplex-noise";

export default function HomeClassic({
  FLOW = 0.0001,
  COEF_DECAY = 0.45,
  TOTAL = 34,
  BASE_SPACING = 12,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const dprRef = useRef(1);

  const flowRef = useRef(FLOW);
  const decayRef = useRef(COEF_DECAY);
  const totalRef = useRef(TOTAL);
  const spacingRef = useRef(BASE_SPACING);

  flowRef.current = FLOW;
  decayRef.current = COEF_DECAY;
  totalRef.current = TOTAL;
  spacingRef.current = BASE_SPACING;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const ANGLE_STEP = 0.002;

    const noise3D = createNoise3D();
    const N = Math.floor((Math.PI * 2) / ANGLE_STEP);
    const angles = new Float32Array(N);
    for (let i = 0; i < N; i++) angles[i] = i * ANGLE_STEP;

    const pts = [];

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

    function draw(tsMs) {
      const tSec = tsMs * 0.001;
      const dpr = dprRef.current;

      const currentFLOW = flowRef.current;
      const currentDECAY = decayRef.current;
      const currentTOTAL = Math.floor(totalRef.current);
      const currentSPACING = spacingRef.current;
      const MIN_GAP = currentSPACING * 0.6;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = canvas.width / dpr, h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);
      ctx.strokeStyle = "white";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // 固定使用 5 階頻率
      const FIXED_M = 5;
      const a = new Float32Array(FIXED_M + 1);
      const b = new Float32Array(FIXED_M + 1);
      for (let m = 1; m <= FIXED_M; m++) {
        const decay = Math.pow(currentDECAY, m - 1);
        const na = noise3D(m * 1.17, 0.37, tSec * (currentFLOW * 1000));
        const nb = noise3D(m * -0.91, 0.53, 100 + tSec * (currentFLOW * 1000));
        a[m] = decay * na;
        b[m] = decay * nb;
      }

      const f = new Float32Array(N);
      for (let i = 0; i < N; i++) {
        const th = angles[i];
        let sum = 0;
        for (let m = 1; m <= FIXED_M; m++)
          sum += a[m] * Math.cos(m * th) + b[m] * Math.sin(m * th);
        f[i] = Math.max(-0.9, Math.min(0.9, sum));
      }

      const rLine = new Float32Array(currentTOTAL);
      for (let i = 0; i < N; i++) {
        const th = angles[i];
        for (let ring = 0; ring < currentTOTAL; ring++) {
          const rPow = Math.pow(ring / (currentTOTAL - 1), 2); // 固定外圈增益
          const baseR = ring * currentSPACING;
          const gain = 0.18 + 0.55 * rPow;
          const rRaw = baseR * (1 + gain * f[i]);
          rLine[ring] = rRaw;
        }
        let last = rLine[0];
        for (let ring = 1; ring < currentTOTAL; ring++) {
          const minAllowed = last + MIN_GAP;
          if (rLine[ring] < minAllowed) rLine[ring] = minAllowed;
          last = rLine[ring];
        }
        for (let ring = 0; ring < currentTOTAL; ring++) {
          const r = rLine[ring];
          if (!pts[ring]) pts[ring] = new Array(N);
          pts[ring][i] = [r * Math.cos(th), r * Math.sin(th)];
        }
      }

      for (let ring = 0; ring < currentTOTAL; ring++) {
        ctx.lineWidth = 0.8;
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
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        background: "black",
        display: "block",
      }}
    />
  );
}
