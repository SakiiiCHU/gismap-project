import "./LoadingOverlay.css";

export default function LoadingOverlay({ text = "Loading..." }) {
  return (
    <div className="loading-overlay">
      <p>{text}</p>
      <div className="spinner"></div>
    </div>
  );
}


