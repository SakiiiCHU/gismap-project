import { useState } from "react";
import HomeClassic from "./HomeClassic";
import HomeV2 from "./HomeV2";

export default function HomeBase() {
  const [mode, setMode] = useState("classic");
  const [speed, setSpeed] = useState(0.0001);
  const [decay, setDecay] = useState(0.45);
  const [total, setTotal] = useState(34);
  const [baseSpacing, setBaseSpacing] = useState(12);
  // const [amplitude, setAmplitude] = useState(0.00008);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div
        style={{
          position: "absolute",
          top: "60px",
          right: "15px",
          zIndex: 10,
          background: "rgba(30,30,30,0.8)",
          color: "white",
          padding: "14px 18px",
          borderRadius: "12px",
          backdropFilter: "blur(6px)",
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          fontFamily: "sans-serif",
          width: "200px",  
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
            width: "100%",
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
            width: "100%",
          }}
        >
          {[
            {
              label: "Speed",
              value: speed,
              min: 0.00002,
              max: 0.0002,
              step: 0.000005,
              onChange: setSpeed,
            },
            {
              label: "Decay",
              value: decay,
              min: 0.3,
              max: 0.9,
              step: 0.01,
              onChange: setDecay,
            },
            {
              label: "Total",
              value: total,
              min: 10,
              max: 60,
              step: 1,
              onChange: setTotal,
            },
            {
              label: "Spacing",
              value: baseSpacing,
              min: 6,
              max: 20,
              step: 1,
              onChange: setBaseSpacing,
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

              <input
                type="range"
                min={item.min}
                max={item.max}
                step={item.step}
                value={item.value}
                onChange={(e) => item.onChange(+e.target.value)}
                style={{
                  width: "80px",
                  appearance: "none",
                  height: "2px",
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "2px",
                  outline: "none",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {mode === "classic" ? (
        <HomeClassic 
          FLOW={speed} 
          COEF_DECAY={decay}
          TOTAL={total}
          BASE_SPACING={baseSpacing}
        />
      ) : (
        <HomeV2 />
      )}

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
