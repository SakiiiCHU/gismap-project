// src/home/Home.jsx
import { useRef, useEffect } from "react";

export default function Home() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    function draw(t) {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.translate(w/2, h/2);

      for (let i = 0; i < 20; i++) {
        let r = i * 10 + Math.sin(t/500 + i*0.3) * 5;
        if (r < 0) r = 0; // ✅ 避免負值

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI*2);
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
        width={500}
        height={500}
        style={{ display: "block" }}
      />
    </div>
  );
}
