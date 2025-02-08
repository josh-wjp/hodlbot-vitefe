import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import "./App.css";

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState("");

useEffect(() => {
  (async () => {
    try {
      const isSignedIn = await initNear();
      setWalletConnected(isSignedIn);

      if (isSignedIn) {
        const account = getAccountId();
        console.log("Fetched Account ID:", account); // Debug log
        setAccountId(account || "Unknown Account");
      }
    } catch (error) {
      console.error("Error initializing NEAR wallet:", error);
    }
  })();
}, []);

  return (
    <div className="app">
      <h1>HodlBot AI Trading</h1>
      {!walletConnected ? (
        <button onClick={login} className="login-button">
          Connect NEAR Wallet
        </button>
      ) : (
        <div>
          <p>Welcome, {accountId}!</p>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
