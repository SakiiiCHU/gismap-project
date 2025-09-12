import { useState } from "react";
import HomeClassic from "./HomeClassic";
import HomeV2 from "./HomeV2";

export default function HomeBase() {
  const [mode, setMode] = useState("classic");

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      {/* 右上角切換面板 */}
      <div
        style={{
          position: "absolute",
          top: "60px",        
          right: "20px",
          zIndex: 10,
          background: "rgba(30,30,30,0.8)",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          backdropFilter: "blur(6px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontFamily: "sans-serif",
          fontSize: "14px",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="radio"
            name="mode"
            value="classic"
            checked={mode === "classic"}
            onChange={() => setMode("classic")}
          />
          Classic Mode
        </label>

        <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <input
            type="radio"
            name="mode"
            value="v2"
            checked={mode === "v2"}
            onChange={() => setMode("v2")}
          />
          V2 Mode
        </label>
      </div>

      {/* 顯示動畫 */}
      {mode === "classic" ? <HomeClassic /> : <HomeV2 />}
    </div>
  );
}
