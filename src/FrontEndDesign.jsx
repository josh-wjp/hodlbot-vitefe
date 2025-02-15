import React, { useState } from "react";
import CryptoIndex from "./components/CryptoIndex";
import "./components/CryptoIndex.css"; // Ensure styles are applied

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
  pnl,
  totalPnl,
  autoTrading,
  toggleAutoTrading,
  applyStrategy,
  resetStrategy={resetStrategy},
  setAutoTradingStrategies,
  autoTradingStrategies,
  isSimulationMode,
  toggleSimulationMode,
}) => {
  // Strategy State Variables
  const [profitThreshold, setProfitThreshold] = useState(5);
  const [maxLoss, setMaxLoss] = useState(10);
  const [tradeFrequency, setTradeFrequency] = useState(15);
  const [smaWindow, setSmaWindow] = useState(5);
  const [rsiWindow, setRsiWindow] = useState(14);
  const [bollingerWindow, setBollingerWindow] = useState(20);
  const [adxThreshold, setAdxThreshold] = useState(25);

  const [isDebouncing, setIsDebouncing] = useState(false);
  const isAutoOn = crypto && autoTrading[crypto.toLowerCase()] === true;

// Handle Apply Strategy
const handleApplyStrategy = () => {
  if (!crypto) {
    alert("Please select a cryptocurrency first.");
    return;
  }

  const strategy = {
    profitThreshold,
    maxLoss,
    tradeFrequency,
    smaWindow,
    rsiWindow,
    bollingerWindow,
    adxThreshold,
  };

  applyStrategy(crypto, strategy); // Call the function passed as a prop
  setAutoTradingStrategies((prev) => ({
    ...prev,
    [crypto.toLowerCase()]: strategy, // Save the strategy to state
  }));
};

  // Handle Reset to Default Strategy
  const handleResetToDefault = () => {
    setProfitThreshold(5);
    setMaxLoss(10);
    setTradeFrequency(15);
    setSmaWindow(5);
    setRsiWindow(14);
    setBollingerWindow(20);
    setAdxThreshold(25);
    alert("Trading strategy reset to defaults.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Main Container */}
      <div
        className={`container ${!walletConnected ? "logged-out" : ""}`}
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: walletConnected ? "repeat(3, 1fr)" : "1fr",
          gap: "20px",
          padding: "20px",
          marginTop: "10px",
          marginBottom: "110px",
          overflow: "hidden",
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

                {/* Auto Trading Toggle Button */}
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
          <>
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

              <div className="pnl-section">
                <h3>Profit / Loss</h3>
                <p>Total PnL: ${totalPnl.toFixed(2)}</p>
                {pnl && Object.keys(pnl).length > 0 ? (
                  <ul>
                    {Object.entries(pnl).map(([coin, profit], idx) => (
                      <li key={idx}>
                        <strong>{coin.toUpperCase()}:</strong> ${profit.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No profit/loss data available.</p>
                )}
              </div>

              <div className="transaction-history">
                <h3>Transaction History</h3>
                {transactionHistory.length > 0 ? (
                  <div className="transaction-list">
                    {transactionHistory.map((txn, idx) => (
                      <div key={idx}>
                        <p>
                          <strong>{txn.type.toUpperCase()}</strong>: {txn.amount} {txn.coin} @ ${txn.price.toFixed(2)}
                          {txn.realizedProfit !== 0 ? (
                            <span> (Profit: {txn.realizedProfit.toFixed(2)})</span>
                          ) : null}
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
              >
                {isSimulationMode ? "Switch to Live Mode" : "Switch to Simulation Mode"}
              </div>
            </div>

            <div className="strategy-column">
              <h2>Auto-Trading Strategies</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleApplyStrategy();
                }}
              >
                <div className="strategy-input">
                  <label htmlFor="profit-threshold">Profit Threshold (%)</label>
                  <input
                    type="number"
                    id="profit-threshold"
                    value={profitThreshold}
                    onChange={(e) => setProfitThreshold(parseFloat(e.target.value))}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="strategy-input">
                  <label htmlFor="max-loss">Max Loss (%)</label>
                  <input
                    type="number"
                    id="max-loss"
                    value={maxLoss}
                    onChange={(e) => setMaxLoss(parseFloat(e.target.value))}
                    placeholder="e.g., 10"
                  />
                </div>
                <div className="strategy-input">
                  <label htmlFor="trade-frequency">Trade Frequency (min)</label>
                  <input
                    type="number"
                    id="trade-frequency"
                    value={tradeFrequency}
                    onChange={(e) => setTradeFrequency(parseInt(e.target.value, 10))}
                    placeholder="e.g., 15"
                  />
                </div>
                <div className="strategy-input">
                  <label htmlFor="sma-window">SMA Window (days)</label>
                  <input
                    type="number"
                    id="sma-window"
                    value={smaWindow}
                    onChange={(e) => setSmaWindow(parseInt(e.target.value, 10))}
                    placeholder="e.g., 5"
                  />
                </div>
                <div className="strategy-input">
                  <label htmlFor="rsi-window">RSI Window (days)</label>
                  <input
                    type="number"
                    id="rsi-window"
                    value={rsiWindow}
                    onChange={(e) => setRsiWindow(parseInt(e.target.value, 10))}
                    placeholder="e.g., 14"
                  />
                </div>
                <div className="strategy-input">
                  <label htmlFor="bollinger-window">Bollinger Bands Window</label>
                  <input
                    type="number"
                    id="bollinger-window"
                    value={bollingerWindow}
                    onChange={(e) => setBollingerWindow(parseInt(e.target.value, 10))}
                    placeholder="e.g., 20"
                  />
                </div>
                <div className="strategy-input">
                  <label htmlFor="adx-threshold">ADX Threshold</label>
                  <input
                    type="number"
                    id="adx-threshold"
                    value={adxThreshold}
                    onChange={(e) => setAdxThreshold(parseInt(e.target.value, 10))}
                    placeholder="e.g., 25"
                  />
                </div>
                <button type="submit" className="apply-strategy-button">
                  Apply Strategy
                </button>
                <button
                  type="button"
                  className="reset-strategy-button"
                  onClick={handleResetToDefault}
                  style={{ marginLeft: "10px" }}
                >
                  Reset to Default
                </button>
              </form>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer>
        <a
          href="https://donate.stripe.com/9AQ6rs9Vf3IR7N6dQQ"
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy me a coffee with Stripe ☕
        </a>
      </footer>
    </div>
  );
};

export default FrontEndDesign;
