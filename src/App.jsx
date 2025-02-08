import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import Footer from "./Footer"; // Import Footer component
import "./App.css";

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [crypto, setCrypto] = useState("");
  const [tradeDecision, setTradeDecision] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const isSignedIn = await initNear();
        setWalletConnected(isSignedIn);

        if (isSignedIn) {
          const account = getAccountId();
          setAccountId(account);
        }
      } catch (error) {
        console.error("Error initializing NEAR wallet:", error);
      }
    })();
  }, []);

  const handleGetTradeDecision = async () => {
    if (!crypto) {
      alert("Please enter a cryptocurrency.");
      return;
    }

    setLoading(true);
    setTradeDecision(null);

    try {
      const response = await fetch(`https://hodlbot-api-bmcmdhccf5hmgahy.eastus2-01.azurewebsites.net/${crypto}`);
      if (!response.ok) {
        throw new Error("Failed to fetch trade decision.");
      }
      const data = await response.json();
      setTradeDecision(data);
    } catch (error) {
      console.error("Error fetching trade decision:", error);
      setTradeDecision({ error: "Unable to fetch trade decision. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>HodlBot AI</h1>
        <p>-For Educational Purposes Only-</p>
        {!walletConnected ? (
          <button onClick={login} className="login-button">
            Connect NEAR Wallet
          </button>
        ) : (
          <>
            <p>Welcome, {accountId}!</p>
            <div className="trade-input">
              <input
                type="text"
                placeholder="Enter cryptocurrency (e.g., bitcoin)"
                value={crypto}
                onChange={(e) => setCrypto(e.target.value)}
              />
              <button onClick={handleGetTradeDecision} disabled={loading}>
                {loading ? "Loading..." : "Get Trade Decision"}
              </button>
            </div>
            {tradeDecision && (
              <div className="trade-result">
                {tradeDecision.error ? (
                  <p>{tradeDecision.error}</p>
                ) : (
                  <>
                    <h3>Trade Decision: {tradeDecision.decision}</h3>
                    <p>Price: ${tradeDecision.price}</p>
                    <p>RSI: {tradeDecision.RSI}</p>
                  </>
                )}
              </div>
            )}
            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </>
        )}
      </div>
      <Footer /> {/* Add Footer component here */}
    </div>
  );
};

export default App;
