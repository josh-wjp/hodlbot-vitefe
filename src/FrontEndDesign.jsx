import React, { useState } from "react";
import CryptoIndex from "./components/CryptoIndex";

const FrontEndDesign = ({
  walletConnected,
  login,
  accountId,
  balance,
  loading,
  cryptoPrices,
  tradeDecisions,
  handleSelectCrypto,
  handleTransaction,
  logout,
  crypto,
  amount,
  setAmount,
  transactionHistory,
  aggregateUsdValue,
  cryptoBalances,
  autoTrading,
  toggleAutoTrading,
  isSimulationMode, // New prop
  toggleSimulationMode, // New prop
}) => {
  const [isDebouncing, setIsDebouncing] = useState(false);
  const isAutoOn = crypto && autoTrading[crypto.toLowerCase()] === true;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh", // Ensures the full height of the viewport
      }}
    >
      {/* Main Container */}
      <div
        className={`container ${!walletConnected ? "logged-out" : ""}`}
        style={{
          flex: 1, // Makes the container take up available space
          display: "grid",
          gridTemplateColumns: walletConnected ? "1fr 1fr" : "1fr", // Adjust columns
          gap: "20px",
          padding: "20px",
          marginTop: "10px",
          marginBottom: "110px",
          overflow: "hidden", // Prevent scrolling
        }}
      >
        <div className="left-column">
          <h2>HodlBot AI</h2>
          <h4>An AI-powered crypto trading tool with NEAR integration</h4>
          <p>-For Entertainment Purposes Only-</p>
          <p>-Index updates every five minutes-</p>

          {!walletConnected ? (
            <button onClick={login} className="login-button">
              Connect NEAR Wallet
            </button>
          ) : (
            <>
              <p>Welcome, {accountId}!</p>
              <p>Wallet Balance: {balance.toFixed(4)} NEAR</p>

              {loading ? (
                <p>Loading cryptocurrency data...</p>
              ) : (
                <CryptoIndex
                  cryptoPrices={cryptoPrices}
                  tradeDecisions={tradeDecisions}
                  onSelectCrypto={handleSelectCrypto}
                />
              )}

              <div className="trade-input">
                <input
                  type="number"
                  placeholder={`Amount of ${crypto || "crypto"} (e.g., 5)`}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <button onClick={() => handleTransaction("buy")} disabled={loading}>
                  Buy
                </button>
                <button onClick={() => handleTransaction("sell")} disabled={loading}>
                  Sell
                </button>

                {/* Auto Button with Debounce */}
                <button
                  className={`auto-button ${isAutoOn ? "on" : "off"}`}
                  onClick={() => {
                    if (!crypto) {
                      alert("Please select a cryptocurrency first.");
                      return;
                    }
                    if (isDebouncing) return;
                    setIsDebouncing(true);
                    toggleAutoTrading(crypto.toLowerCase());
                    setTimeout(() => setIsDebouncing(false), 500);
                  }}
                  disabled={loading || isDebouncing}
                >
                  {isAutoOn ? "Stop Auto" : "Start Auto"}
                </button>
              </div>

              <button onClick={logout} className="logout-button">
                Logout
              </button>
            </>
          )}
        </div>

        {walletConnected && (
          <div className="right-column">
            <h2>Balances and Transactions</h2>
            <div className="crypto-balances">
              <h3>Crypto Balances</h3>
              <p>Aggregate USD Value: ${aggregateUsdValue.toFixed(2)}</p>
              {Object.keys(cryptoBalances).length > 0 ? (
                <ul>
                  {Object.entries(cryptoBalances).map(([coin, bal], idx) => (
                    <li key={idx}>
                      <strong>{coin}:</strong> {bal.toFixed(4)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No crypto balances available.</p>
              )}
            </div>

            <div className="transaction-history">
              <h3>Transaction History</h3>
              {transactionHistory.length > 0 ? (
                <div className="transaction-list">
                  {transactionHistory.map((txn, idx) => (
                    <div key={idx}>
                      <p>
                        <strong>{txn.type.toUpperCase()}</strong>: {txn.amount} {txn.coin} @ $
                        {txn.price.toFixed(2)}
                      </p>
                      <p>Date: {txn.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No transaction history available.</p>
              )}
            </div>

            {/* Simulation Mode Toggle */}
            <div
              className={`mode-toggle ${isSimulationMode ? "simulation" : ""}`}
              onClick={toggleSimulationMode}
              style={{
                marginTop: "20px",
                padding: "15px",
                background: isSimulationMode ? "#f39c12" : "#3498db",
                color: "#fff",
                textAlign: "center",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              {isSimulationMode ? "Switch to Live Mode" : "Switch to Simulation Mode"}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer
        style={{
          background: "#1a1a1a",
          color: "#f5f5f5",
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
            background: "#0070f3",
            color: "white",
            padding: "10px 20px",
            border: "none",
            borderRadius: "5px",
            textDecoration: "none",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Buy me a coffee with Stripe ☕
        </a>
      </footer>
    </div>
  );
};

export default FrontEndDesign;
