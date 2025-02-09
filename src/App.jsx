import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import Footer from "./Footer";
import "./App.css";

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [crypto, setCrypto] = useState(""); // Cryptocurrency input
  const [tradeDecision, setTradeDecision] = useState(null); // API response for trade decision
  const [loading, setLoading] = useState(false); // Loading state for API requests
  const [balance, setBalance] = useState(null); // NEAR Wallet Balance
  const [transactionHistory, setTransactionHistory] = useState([]); // Transaction history state
  const API_BASE_URL = "https://hodlbot-api-bmcmdhccf5hmgahy.eastus2-01.azurewebsites.net";

  // Initialize NEAR Wallet
  useEffect(() => {
    (async () => {
      try {
        const isSignedIn = await initNear();
        setWalletConnected(isSignedIn);

        if (isSignedIn) {
          const account = await getAccountId();
          console.log("Fetched account ID from NEAR Wallet:", account);

          if (!account) {
            console.error("Invalid or missing account ID. Please sign in with a valid NEAR account.");
            setAccountId("");
          } else {
            setAccountId(account);
            fetchWalletBalance(account);
          }
        }
      } catch (error) {
        console.error("Error initializing NEAR wallet:", error);
      }
    })();
  }, []);

  // Fetch Wallet Balance
  const fetchWalletBalance = async (accountId) => {
    if (!accountId || !/^[a-z0-9._-]+$/.test(accountId)) {
      console.error("Invalid account ID. Cannot fetch wallet balance:", accountId);
      setBalance(null);
      return;
    }

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
        throw new Error(`Failed to fetch wallet balance. Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.result && data.result.amount) {
        const yoctoNEAR = data.result.amount;
        setBalance(Number(yoctoNEAR) / Math.pow(10, 24));
      } else {
        console.error("No balance data in response:", data);
        setBalance(null);
      }
    } catch (error) {
      console.error("Error fetching wallet balance:", error);
      setBalance(null);
    }
  };

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

  // Fetch Transaction History
  const fetchTransactionHistory = async () => {
    try {
      // Note: Replace `<transaction-hash>` with a real hash if available
      const response = await fetch("https://rpc.testnet.near.org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "dontcare",
          method: "tx_status",
          params: ["<transaction-hash>", accountId], // Replace dynamically
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch transaction history.");
      }

      const data = await response.json();
      console.log("Transaction history:", data);
      // Assuming `data` contains an array of transactions
      setTransactionHistory(data.transactions || []);
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

            {/* Transaction History Section */}
            <button onClick={fetchTransactionHistory} className="transaction-button">
              View Transactions
            </button>
            <div className="transaction-history">
              {transactionHistory.length > 0 ? (
                transactionHistory.map((txn, idx) => (
                  <p key={idx}>
                    <strong>Transaction:</strong> {txn.hash} <br />
                    <strong>Status:</strong> {txn.status}
                  </p>
                ))
              ) : (
                <p>No transaction history available.</p>
              )}
            </div>

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
