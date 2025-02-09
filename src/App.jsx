import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import Footer from "./Footer"; // Import Footer component
import "./App.css";

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [crypto, setCrypto] = useState(""); // Cryptocurrency input
  const [tradeDecision, setTradeDecision] = useState(null); // API response for trade decision
  const [loading, setLoading] = useState(false); // Loading state for API requests
  const [balance, setBalance] = useState(null); // NEAR Wallet Balance
  const API_BASE_URL = "https://hodlbot-api-bmcmdhccf5hmgahy.eastus2-01.azurewebsites.net";

useEffect(() => {
  (async () => {
    try {
      const isSignedIn = await initNear();
      setWalletConnected(isSignedIn);

      if (isSignedIn) {
        const account = await getAccountId(); // Await account retrieval
        console.log("Fetched account ID from NEAR Wallet:", account);

        if (!account) {
          console.error("Invalid or missing account ID. Please sign in with a valid NEAR account.");
          setAccountId(""); // Clear invalid account ID
        } else {
          setAccountId(account);
          fetchWalletBalance(account); // Fetch balance only for valid accounts
        }
      }
    } catch (error) {
      console.error("Error initializing NEAR wallet:", error);
    }
  })();
}, []);


// Fetch wallet balance
const fetchWalletBalance = async (accountId) => {
  if (!accountId || !/^[a-z0-9._-]+$/.test(accountId)) {
    console.error("Invalid account ID. Cannot fetch wallet balance:", accountId);
    setBalance(null);
    return;
  }

  console.log("Fetching wallet balance for account ID:", accountId);

  try {
    const response = await fetch("https://rpc.testnet.near.org", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "dontcare",
        method: "query",
        params: {
          request_type: "view_account",
          finality: "final",
          account_id: accountId,
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch wallet balance. Response status: " + response.status);
    }

    const data = await response.json();
    console.log("Wallet balance data received:", data);

    if (data.result && data.result.amount) {
      const yoctoNEAR = data.result.amount; // Balance in yoctoNEAR
      setBalance(Number(yoctoNEAR) / Math.pow(10, 24)); // Convert to NEAR
    } else {
      console.error("No balance data in response:", data);
      setBalance(null);
    }
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    setBalance(null); // Handle balance fetch failure
  }
};

// Call fetchWalletBalance after wallet connection
useEffect(() => {
  if (walletConnected && accountId && /^[a-z0-9._-]+$/.test(accountId)) {
    fetchWalletBalance(accountId);
  }
}, [walletConnected, accountId]);

  // Fetch Trade Decision
  const handleGetTradeDecision = async () => {
    if (!crypto) {
      alert("Please enter a cryptocurrency.");
      return;
    }

    setLoading(true);
    setTradeDecision(null);

    try {
      const response = await fetch(`${API_BASE_URL}/trade/${crypto}`);
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

  // Fetch Transaction History (Currently mocked)
  const fetchTransactionHistory = async (accountId) => {
    try {
      const response = await fetch("https://rpc.testnet.near.org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "tx",
          params: [accountId],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transaction history.");
      }

      const data = await response.json();
      console.log("Transaction history:", data);
      // Process and display data here if needed
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    }
  };

  // Frontend Render
  return (
    <div className="app">
      <div className="container">
        <h1>HodlBot AI</h1>
        <p>An AI-powered crypto trading tool with NEAR integration</p>
        <p>-For Educational Purposes Only-</p>

        {!walletConnected ? (
          <button onClick={login} className="login-button">
            Connect NEAR Wallet
          </button>
        ) : (
          <>
            <p>Welcome, {accountId}!</p>
            <p>
              Wallet Balance:{" "}
              {balance !== null ? `${balance.toFixed(4)} NEAR` : "Loading..."}
            </p>

            {/* Trade Decision Section */}
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
      <Footer />
    </div>
  );
};

export default App;
