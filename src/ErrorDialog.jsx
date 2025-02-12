import React from "react";
import "./ErrorDialog.css"; // optional CSS styling

const ErrorDialog = ({ error, onClose }) => {
  if (!error) {
    // If there's no error, render nothing
    return null;
  }

  // Otherwise render a simple overlay + dialog
  return (
    <div className="error-dialog-overlay">
      <div className="error-dialog">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onClose}>OK</button>
      </div>
    </div>
  );
};

export default ErrorDialog;
