import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Ensure this is the correct path
import "./index.css";
import "@near-wallet-selector/modal-ui/styles.css";
import { Buffer } from "buffer";
import crypto from "crypto-browserify";

// Set the global Buffer (safe to do)
window.Buffer = Buffer;

// Use a fallback for crypto if needed, without overwriting the built-in crypto
if (!window.crypto.subtle) {
    window.customCrypto = crypto; // Use customCrypto as an alternative
}

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
