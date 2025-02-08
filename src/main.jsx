import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // Ensure this is the correct path
import "./index.css";
import "@near-wallet-selector/modal-ui/styles.css";
import { Buffer } from "buffer";
import crypto from "crypto-browserify";

window.Buffer = Buffer;
window.crypto = crypto;

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
