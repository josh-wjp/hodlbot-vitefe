import { useEffect, useState } from "react";
import { initNear, login, logout, isSignedIn, getAccountId } from "./near-wallet";
import "./App.css"; // Ensure styles are loaded

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [tradeAction, setTradeAction] = useState("BUY");
  const [tradeAmount, setTradeAmount] = useState("");

  // Initialize NEAR wallet on component mount
  useEffect(() => {
    (async () => {
      try {
        await initNear();
        if (isSignedIn()) {
          setWalletConnected(true);
          setAccountId(getAccountId());
        await fetchTradeHistory(); // Load trade history on login
      }

      } catch (error) {
        console.error("Error initializing wallet:", error);
      }
    })();
  }, []);

  // Fetch user's trade history (replace with real API/smart contract call)
  const fetchTradeHistory = async () => {
    try {
      const mockTrades = [
        { action: "BUY", amount: "1.5 NEAR", date: "2025-02-06" },
        { action: "SELL", amount: "2.0 NEAR", date: "2025-02-05" },
      ];
      setTradeHistory(mockTrades);
    } catch (error) {
      console.error("Error fetching trade history:", error);
    }
  };

const submitTrade = async () => {
  const tradeAmountNumber = parseFloat(tradeAmount); // Convert tradeAmount to a number

  if (!tradeAmount || isNaN(tradeAmountNumber)) {
    alert("Please enter a valid trade amount.");
    return;
  }

  try {
    // Replace with smart contract call (storeTradeDecision)
    console.log(`Submitting ${tradeAction} trade for ${tradeAmountNumber} NEAR`);
    setTradeHistory([
      ...tradeHistory,
      {
        action: tradeAction,
        amount: `${tradeAmountNumber} NEAR`,
        date: new Date().toISOString().split("T")[0],
      },
    ]);
    setTradeAmount(""); // Clear input after submission
  } catch (error) {
    console.error("Trade submission failed:", error);
  }
};

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

          {/* Trade Submission UI */}
          <div className="trade-section">
            <h2>Execute Trade</h2>
            <select value={tradeAction} onChange={(e) => setTradeAction(e.target.value)}>
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
              <option value="HOLD">HOLD</option>
            </select>
            <input
              type="number"
              placeholder="Amount (NEAR)"
              value={tradeAmount}
              onChange={(e) => setTradeAmount(e.target.value)}
            />
            <button onClick={submitTrade}>Submit Trade</button>
          </div>

          {/* Trade History UI */}
          <div className="trade-history">
            <h2>Trade History</h2>
            {tradeHistory.length > 0 ? (
              <ul>
                {tradeHistory.map((trade, index) => (
                  <li key={index}>
                    {trade.date} - {trade.action} {trade.amount}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No trades recorded.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
