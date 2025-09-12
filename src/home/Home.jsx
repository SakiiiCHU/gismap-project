import { useRef, useEffect } from "react";
import { createNoise3D } from "simplex-noise";

export default function Home() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const noise3D = createNoise3D();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = "100vw";
      canvas.style.height = "100vh";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    const TOTAL = 34;
    const BASE_SPACING = 12;
    const ANGLE_STEP = 0.03;

    const SHAPE_AMP = 36;
    const SHAPE_FREQ = 0.6;
    const SHAPE_FLOW = 0.0003;

    const DENSITY_STRENGTH = 0.5;
    const DENSITY_FLOW = 0.00025;
    const DENSITY_GAMMA = 2.2;

    const PULSE_AMP = 0.08;
    const PULSE_SPEED = 0.0011;
    const RING_PHASE_LAG = 0.06;

    const OUTER_GAIN_EXP = 1.6;

    function draw(ts) {
      const t = ts;
      const w = canvas.width / (ctx.getTransform().a || 1);
      const h = canvas.height / (ctx.getTransform().a || 1);

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;

      const globalPulse = 1 + Math.sin(t * PULSE_SPEED) * PULSE_AMP;

      const N = Math.floor((Math.PI * 2) / ANGLE_STEP);
      const angles = new Array(N + 1);
      for (let i = 0; i <= N; i++) angles[i] = i * ANGLE_STEP;

      const mu = (noise3D(0.37, 0.91, t * DENSITY_FLOW) + 1) * Math.PI;

      const densityField = new Array(N + 1);
      for (let i = 0; i < N; i++) {
        const a = angles[i];
        let d01 = Math.cos(a - mu) * 0.5 + 0.5;
        d01 = Math.pow(d01, DENSITY_GAMMA);
        densityField[i] = 1 + (d01 - 0.5) * 2 * DENSITY_STRENGTH;
      }
      densityField[N] = densityField[0];

      const shapeField = new Array(N + 1);
      for (let i = 0; i < N; i++) {
        const a = angles[i];
        const s = noise3D(
          Math.cos(a * SHAPE_FREQ),
          Math.sin(a * SHAPE_FREQ),
          100 + t * SHAPE_FLOW
        );
        shapeField[i] = s * 0.5 + 1;
      }
      shapeField[N] = shapeField[0];

      for (let ring = 0; ring < TOTAL; ring++) {
        ctx.beginPath();
        const rPow = Math.pow(ring / (TOTAL - 1), OUTER_GAIN_EXP);
        const baseRadius = ring * BASE_SPACING * globalPulse;
        const localPulse =
          1 + Math.sin(t * PULSE_SPEED - ring * RING_PHASE_LAG) * PULSE_AMP;

        let firstX = 0, firstY = 0; // 🟢 記錄起點

        for (let i = 0; i <= N; i++) {
          const a = angles[i];
          const r =
            baseRadius *
            localPulse *
            densityField[i] *
            (1 + (shapeField[i] - 1) * rPow);

          const x = r * Math.cos(a);
          const y = r * Math.sin(a);
          if (i === 0) {
            ctx.moveTo(x, y);
            firstX = x; firstY = y; // 🟢 存下第一點
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(firstX, firstY); // 🟢 強制補畫回起點
        ctx.stroke();
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: "block",
        width: "100vw",
        height: "100vh",
        background: "black",
      }}
    />
  );
}
