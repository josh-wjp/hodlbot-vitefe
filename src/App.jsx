import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import Footer from "./Footer";
import CryptoIndex from "./components/CryptoIndex";
import "./App.css";

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [crypto, setCrypto] = useState(""); // Cryptocurrency input
  const [amount, setAmount] = useState(""); // Amount for buy/sell
  const [tradeDecision, setTradeDecision] = useState(null); // API response for trade decision
  const [loading, setLoading] = useState(false); // Loading state for API requests
  const [balance, setBalance] = useState(100); // Mock NEAR Wallet Balance
  const [cryptoBalances, setCryptoBalances] = useState({}); // Balances for each cryptocurrency
  const [cryptoPrices, setCryptoPrices] = useState({}); // Current prices for each cryptocurrency
  const [transactionHistory, setTransactionHistory] = useState([]); // Transaction history
  const [aggregateUsdValue, setAggregateUsdValue] = useState(0); // Total crypto value in USD
  //const API_BASE_URL = "https://hodlbot-api-bmcmdhccf5hmgahy.eastus2-01.azurewebsites.net";
  const API_BASE_URL = "http://localhost:8000";

  useEffect(() => {
    (async () => {
      try {
        const isSignedIn = await initNear();
        setWalletConnected(isSignedIn);

        if (isSignedIn) {
          const account = await getAccountId(); // Await account retrieval
          setAccountId(account);
        }
      } catch (error) {
        console.error("Error initializing NEAR wallet:", error);
      }
    })();
  }, []);

  useEffect(() => {
    // Update USD value whenever cryptoBalances or cryptoPrices change
    const totalUsdValue = Object.entries(cryptoBalances).reduce((sum, [coin, balance]) => {
      const price = cryptoPrices[coin] || 0; // Use stored price or default to 0
      return sum + balance * price;
    }, 0);
    setAggregateUsdValue(totalUsdValue);
  }, [cryptoBalances, cryptoPrices]);

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

      // Update the price of the searched crypto
      setCryptoPrices((prevPrices) => ({
        ...prevPrices,
        [crypto.toUpperCase()]: data.price,
      }));

      setTradeDecision(data);
    } catch (error) {
      console.error("Error fetching trade decision:", error);
      setTradeDecision({ error: "Unable to fetch trade decision. Try again later." });
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (type) => {
    if (!crypto) {
      alert("Please select a cryptocurrency first.");
      return;
    }

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    const transactionAmount = Number(amount);

    let price = cryptoPrices[crypto.toUpperCase()];
    if (!price) {
      try {
        const response = await fetch(`${API_BASE_URL}/trade/${crypto}`);
        if (response.ok) {
          const data = await response.json();
          price = data.price;
          setCryptoPrices((prevPrices) => ({
            ...prevPrices,
            [crypto.toUpperCase()]: price,
          }));
        } else {
          throw new Error("Failed to fetch current price.");
        }
      } catch (error) {
        console.error(`Error fetching price for ${crypto.toUpperCase()}:`, error);
        alert("Unable to complete transaction. Please try again later.");
        return;
      }
    }

    if (type === "buy" && transactionAmount > balance) {
      alert("Insufficient NEAR balance to complete the transaction.");
      return;
    }

    const newBalance = type === "buy" ? balance - transactionAmount : balance + transactionAmount;
    setBalance(newBalance);

    setCryptoBalances((prevBalances) => {
      const currentBalance = prevBalances[crypto.toUpperCase()] || 0;
      const newCryptoBalance =
        type === "buy" ? currentBalance + transactionAmount : Math.max(0, currentBalance - transactionAmount);
      return { ...prevBalances, [crypto.toUpperCase()]: newCryptoBalance };
    });

    const newTransaction = {
      type,
      amount: transactionAmount,
      date: new Date().toLocaleString(),
      coin: crypto.toUpperCase(),
      price,
    };

    setTransactionHistory((prev) => [newTransaction, ...prev]);

    setCrypto("");
    setAmount("");
    setTradeDecision(null);
  };

  const handleSelectCrypto = (selectedCrypto) => {
    setCrypto(selectedCrypto);
  };

  return (
    <div className="container">
      {/* Left Column */}
      <div>
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
            <p>Wallet Balance: {balance.toFixed(4)} NEAR</p>

            {/* Cryptocurrency Index */}
            <CryptoIndex cryptoPrices={cryptoPrices} onSelectCrypto={handleSelectCrypto} />

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

            {/* Trade Indicator */}
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
      <div>
        <h2>Balances & Transactions</h2>
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
                    <strong>{txn.type.toUpperCase()}</strong>: {txn.amount} {txn.coin} @ ${txn.price.toFixed(2)}
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

export default App;
