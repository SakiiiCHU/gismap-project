import { useState } from "react";
import HomeClassic from "./HomeClassic";
import HomeV2 from "./HomeV2";

export default function HomeBase() {
  const [mode, setMode] = useState("classic");
  const [complexity, setComplexity] = useState(5);
  const [speed, setSpeed] = useState(0.0001);
  const [amplitude, setAmplitude] = useState(0.00008);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: "60px",
          right: "20px",
          zIndex: 10,
          background: "rgba(30,30,30,0.8)",
          color: "white",
          padding: "14px 18px",
          borderRadius: "12px",
          backdropFilter: "blur(6px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontFamily: "sans-serif",
          width: "230px", // ⬅️ 控制總寬
          fontSize: "12px",
        }}
      >
        {/* --- pill tabs --- */}
        <div
          style={{
            position: "relative",
            display: "flex",
            border: "1px solid #555",
            borderRadius: "999px",
            overflow: "hidden",
            marginBottom: "14px",
            width: "100%", // ⬅️ 基準寬度
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "2px",
              bottom: "2px",
              left: mode === "classic" ? "2px" : "calc(50% + 2px)",
              width: "calc(50% - 4px)",
              borderRadius: "999px",
              background: "white",
              transition: "left 0.25s",
            }}
          />
          {["classic", "v2"].map((m) => (
            <div
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "6px 0",
                cursor: "pointer",
                color: mode === m ? "black" : "white",
                fontWeight: 500,
                zIndex: 1,
                userSelect: "none",
              }}
            >
              {m === "classic" ? "Classic" : "V2"}
            </div>
          ))}
        </div>

        {/* --- sliders --- */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            width: "100%", // 與 pill 寬一致
          }}
        >
          {[
            {
              label: "Complexity",
              value: complexity,
              min: 1,
              max: 10,
              step: 1,
              onChange: setComplexity,
            },
            {
              label: "Speed",
              value: speed,
              min: 0.00005,
              max: 0.001,
              step: 0.00005,
              onChange: setSpeed,
            },
            {
              label: "Amplitude",
              value: amplitude,
              min: 0,
              max: 0.0002,
              step: 0.00001,
              onChange: setAmplitude,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* 左文字固定寬 */}
              <div
                style={{
                  width: "70px",
                  color: "#ccc",
                  textAlign: "left",
                  flexShrink: 0,
                }}
              >
                {item.label}
              </div>

              {/* 右bar固定寬 */}
              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={item.value}
                onChange={(e) => item.onChange(+e.target.value)}
                style={{
                  width: "120px", // ⬅️ 固定寬度
                  appearance: "none",
                  height: "2px",
                  background: "rgba(255,255,255,0.2)", // 可選，白20%
                  borderRadius: "2px",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {mode === "classic" ? (
        <HomeClassic M={complexity} FLOW={speed} PULSE_AMP={amplitude} />
      ) : (
        <HomeV2 />
      )}

      {/* --- 自訂 slider thumb --- */}
      <style>
        {`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 10px;
            height: 10px;
            border: 1.5px solid white;
            border-radius: 3px;
            background: transparent;
            cursor: pointer;
            margin-top: -4px;
          }
          input[type=range]::-moz-range-thumb {
            width: 10px;
            height: 10px;
            border: 1.5px solid white;
            border-radius: 3px;
            background: transparent;
            cursor: pointer;
          }
        `}
      </style>
    </div>
  );
}
