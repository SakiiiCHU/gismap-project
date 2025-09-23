import "./LoadingOverlay.css";

export default function LoadingOverlay({ text = "Loading..." }) {
  return (
    <div className="loading-overlay">
      <p className="font-kanit">{text}</p>
      <div className="spinner"></div>
    </div>
  );
}


