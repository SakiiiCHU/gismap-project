// src/home/Home.jsx
import { useRef, useEffect } from "react";
import { createNoise3D } from "simplex-noise";

export default function Home() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const noise3D = createNoise3D();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    const totalLayers = 35;      // 層數
    const baseSpacing = 10;      // 平均間距
    const stepAngle = 0.04;      // 每圈角度取樣

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.translate(w / 2, h / 2);

      for (let i = 0; i < totalLayers; i++) {
        ctx.beginPath();

        for (let a = 0; a <= Math.PI * 2 + stepAngle; a += stepAngle) {
          // --- 🔑 角度密度控制 ---
          // 在某些角度（如 200°~300°）密度更高
          const angleDeg = (a * 180) / Math.PI;
          const hotspot =
            angleDeg > 200 && angleDeg < 300
              ? 0.6 // 壓縮，密度更高
              : 1.2; // 放鬆，密度更低

          // 動態因子（時間流動 + 角度控制）
          const densityFactor =
            1 + Math.sin(t * 0.001 + a * 2) * 0.15 * hotspot;

          // 基本半徑（加入密度變化）
          const baseRadius = i * baseSpacing * densityFactor;

          // 外圈形狀 noise
          const nx = Math.cos(a);
          const ny = Math.sin(a);
          const noise =
            noise3D(nx, ny, t * 0.0003) * (i / totalLayers) * 20;

          const r = baseRadius + noise;
          const x = r * Math.cos(a);
          const y = r * Math.sin(a);

          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.stroke();
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }, []);

  return (
    <div
      style={{
        background: "black",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <canvas
        ref={canvasRef}
        width={800}
        height={800}
        style={{ display: "block" }}
      />
    </div>
  );
}
