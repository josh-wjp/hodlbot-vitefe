import React from "react";
import CryptoIndex from "./components/CryptoIndex";

// This component receives all its data & handlers via props from App.jsx
const FrontEndDesign = ({
  walletConnected,
  login,
  accountId,
  balance,
  error,
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
}) => {
  return (
    <div className="container">
      {/* Left Column */}
      <div className="left-column">
        <h1>HodlBot AI</h1>
        <p>An AI-powered crypto trading tool with NEAR integration</p>
        <p>-For Educational Purposes Only-</p>
        <p>-Index updates every two minutes-</p>

        {!walletConnected ? (
          <button onClick={login} className="login-button">
            Connect NEAR Wallet
          </button>
        ) : (
          <>
            <p>Welcome, {accountId}!</p>
            <p>Wallet Balance: {balance.toFixed(4)} NEAR</p>

            {/* Cryptocurrency Index */}
            {error ? (
              <p>Error fetching cryptocurrency data: {error}</p>
            ) : loading ? (
              <p>Loading cryptocurrency data...</p>
            ) : (
              <CryptoIndex
                cryptoPrices={cryptoPrices}
                tradeDecisions={tradeDecisions}
                onSelectCrypto={handleSelectCrypto}
              />
            )}

            {/* Buy/Sell Section */}
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
            </div>

            <button onClick={logout} className="logout-button">
              Logout
            </button>
          </>
        )}
      </div>

      {/* Right Column */}
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
      </div>
    </div>
  );
};

export default FrontEndDesign;
