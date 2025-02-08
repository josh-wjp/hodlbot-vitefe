import React from "react";

const Footer = () => {
  return (
    <footer
      style={{
        position: "fixed",
        bottom: "0",
        left: "0",
        width: "100%",
        background: "#1a1a1a", // Matches dark mode background
        color: "#f5f5f5", // Matches light text color
        padding: "1rem",
        textAlign: "center",
        boxShadow: "0 -2px 5px rgba(0, 0, 0, 0.2)",
      }}
    >
      <a
        href="https://donate.stripe.com/9AQ6rs9Vf3IR7N6dQQ"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: "#0070f3", // Button background color
          color: "white", // Button text color
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          textDecoration: "none",
          fontSize: "16px",
          cursor: "pointer",
          display: "inline-block",
        }}
      >
        Buy me a coffee with Stripe ☕
      </a>
    </footer>
  );
};

export default Footer;
