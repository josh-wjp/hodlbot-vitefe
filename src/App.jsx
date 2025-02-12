import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import FrontEndDesign from "./FrontEndDesign";
import Footer from "./Footer";
import ErrorDialog from "./ErrorDialog";
import "./App.css";

const PYTHON_API_URL = "http://localhost:8000/api";
const POLLING_INTERVAL = 120000; // 2 minutes
const AI_DECISION_POLL_INTERVAL = 30000; // 30 seconds

const App = () => {
  // State declarations
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [crypto, setCrypto] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(100);
  // Ensure cryptoBalances is defined
  const [cryptoBalances, setCryptoBalances] = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [aggregateUsdValue, setAggregateUsdValue] = useState(0);
  const [error, setError] = useState(null);
  const [tradeDecisions, setTradeDecisions] = useState({});
  const [autoTrading, setAutoTrading] = useState({});

  const API_BASE_URL = "http://localhost:8000";

  // -----------------------
  // Initialize NEAR Wallet
  // -----------------------
  useEffect(() => {
    (async () => {
      try {
        const isSignedIn = await initNear();
        setWalletConnected(isSignedIn);
        if (isSignedIn) {
          const account = await getAccountId();
          setAccountId(account);
        }
      } catch (err) {
        console.error("Error initializing NEAR wallet:", err);
      }
    })();
  }, []);

  // -----------------------
  // Fetch Crypto Data
  // -----------------------
  useEffect(() => {
    const fetchCryptoData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/coins`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched crypto data:", data);

        // Build a price map using lowercase coin IDs
        const pricesMap = {};
        data.forEach((coin) => {
          pricesMap[coin.id.toLowerCase()] = coin.current_price;
        });
        setCryptoPrices(pricesMap);
      } catch (err) {
        console.error("Error fetching crypto data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // -----------------------
  // Calculate Aggregate USD Value
  // -----------------------
  useEffect(() => {
    // Example: Sum prices (adjust logic as needed if you have balances per coin)
    const totalUsdValue = Object.entries(cryptoBalances).reduce((sum, [coin, bal]) => {
      // Use the lowercase key for lookup
      const price = cryptoPrices[coin.toLowerCase()] || 0;
      return sum + bal * price;
    }, 0);
    setAggregateUsdValue(totalUsdValue);
  }, [cryptoBalances, cryptoPrices]);

  // -----------------------
  // Toggle Auto-Trading (standardize coin name to lowercase)
  // -----------------------
  const toggleAutoTrading = async (coin) => {
    const standardizedCoin = coin.toLowerCase();
    const isOn = !!autoTrading[standardizedCoin];
    setError(null);
    try {
      const endpoint = isOn
        ? `${PYTHON_API_URL}/trading/stop`
        : `${PYTHON_API_URL}/trading/start`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin: standardizedCoin }),
      });

      if (!response.ok) {
        let msg = "Unknown error";
        try {
          const data = await response.json();
          msg = data.error || msg;
        } catch (parseErr) {
          // If parsing fails, fallback to msg
        }
        setError(msg);
        return; // Do not update autoTrading state if the request fails
      }

      console.log(`Auto-trading ${isOn ? "stopped" : "started"} for ${standardizedCoin}`);
      setError(null);
      setAutoTrading((prev) => ({ ...prev, [standardizedCoin]: !isOn }));
    } catch (err) {
      console.error("Error toggling auto-trading:", err);
      setError(err.message);
    }
  };

  // -----------------------
  // Poll AI Decisions
  // -----------------------
  useEffect(() => {
    const pollAiDecisions = async () => {
      const activeCoins = Object.keys(autoTrading).filter((c) => autoTrading[c]);
      if (activeCoins.length === 0) return;

      for (const coin of activeCoins) {
        try {
          const resp = await fetch(`${PYTHON_API_URL}/trading/decision/${coin}`);
          if (!resp.ok) {
            let msg = `Unknown error fetching AI decision for ${coin}`;
            try {
              const data = await resp.json();
              msg = data.error || msg;
            } catch (e) {}
            console.error(msg);
            setError(msg);
            continue;
          }
          setError(null);
          const decision = await resp.json();
          console.log(`AI decision for ${coin}:`, decision);

          if (decision.error) {
            // Store only the error string
            setTradeDecisions((prev) => ({ ...prev, [coin]: decision.error }));
          } else {
            setTradeDecisions((prev) => ({ ...prev, [coin]: decision }));
            if (decision.decision === "BUY") {
              autoTransaction(coin, "buy", 1, decision.price);
            } else if (decision.decision === "SELL") {
              autoTransaction(coin, "sell", 1, decision.price);
            }
            // HOLD: do nothing
          }
        } catch (err) {
          console.error("AI decision error:", err);
          setError(err.message);
        }
      }
    };

    pollAiDecisions();
    const aiInterval = setInterval(pollAiDecisions, AI_DECISION_POLL_INTERVAL);
    return () => clearInterval(aiInterval);
  }, [autoTrading]);

  // -----------------------
  // Auto Transaction Helper
  // -----------------------
  const autoTransaction = (coin, type, amountToTrade, price) => {
    setCrypto(coin);
    setAmount(String(amountToTrade));
    setTimeout(() => {
      handleTransaction(type);
    }, 100);
  };

  // -----------------------
  // Manual Buy/Sell
  // -----------------------
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
    const coinKey = crypto.toLowerCase();
    const price = cryptoPrices[coinKey];
    if (!price) {
      alert("Unable to fetch price. Try again later.");
      return;
    }
    if (type === "buy" && transactionAmount > balance) {
      alert("Insufficient NEAR balance to complete the transaction.");
      return;
    }

    const newBalance = type === "buy"
      ? balance - transactionAmount
      : balance + transactionAmount;
    setBalance(newBalance);

    setCryptoBalances((prev) => {
      const prevBal = prev[coinKey] || 0;
      const updatedBal = type === "buy"
        ? prevBal + transactionAmount
        : Math.max(0, prevBal - transactionAmount);
      return { ...prev, [coinKey]: updatedBal };
    });

    const newTransaction = {
      type,
      amount: transactionAmount,
      date: new Date().toLocaleString(),
      coin: coinKey,
      price,
    };
    setTransactionHistory((prev) => [newTransaction, ...prev]);

    setCrypto("");
    setAmount("");
  };

  const handleSelectCrypto = (selectedCrypto) => {
    setCrypto(selectedCrypto);
  };

  return (
    <>
      <FrontEndDesign
        walletConnected={walletConnected}
        login={login}
        accountId={accountId}
        balance={balance}
        error={error}
        loading={loading}
        cryptoPrices={cryptoPrices}
        tradeDecisions={tradeDecisions}
        handleSelectCrypto={handleSelectCrypto}
        handleTransaction={handleTransaction}
        logout={logout}
        crypto={crypto}
        amount={amount}
        setAmount={setAmount}
        transactionHistory={transactionHistory}
        aggregateUsdValue={aggregateUsdValue}
        cryptoBalances={cryptoBalances}
        autoTrading={autoTrading}
        toggleAutoTrading={toggleAutoTrading}
      />

      <ErrorDialog error={error} onClose={() => setError(null)} />

      <Footer />
    </>
  );
};

export default App;
