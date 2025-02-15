import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import FrontEndDesign from "./FrontEndDesign";
import Footer from "./Footer";
import ErrorDialog from "./ErrorDialog";
import "./App.css";

// Use the /api base for endpoints that belong to the API
const API_BASE_URL = "http://localhost:8000";

const POLLING_INTERVAL = 300000; // 5 minutes
const AI_DECISION_POLL_INTERVAL = 30000; // 30 seconds

const App = () => {
  // Core state declarations
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [crypto, setCrypto] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState(100);
  const [cryptoBalances, setCryptoBalances] = useState({});
  const [cryptoPrices, setCryptoPrices] = useState({});
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [aggregateUsdValue, setAggregateUsdValue] = useState(0);
  const [error, setError] = useState(null);
  const [tradeDecisions, setTradeDecisions] = useState({});
  const [autoTrading, setAutoTrading] = useState({});
  const [isSimulationMode, setIsSimulationMode] = useState(false); // Simulation mode state

  // Initialize NEAR Wallet
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

  // Fetch simulation/live mode using the /api endpoint
  useEffect(() => {
    const fetchMode = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/mode`);
        if (response.ok) {
          const data = await response.json();
          setIsSimulationMode(data.mode === "simulation");
        }
      } catch (err) {
        console.error("Error fetching mode:", err);
      }
    };

    fetchMode();
  }, []);

  // Toggle between simulation and live mode
  const toggleSimulationMode = async () => {
    try {
      const newMode = isSimulationMode ? "live" : "simulation";
      const response = await fetch(`${API_BASE_URL}/api/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      if (response.ok) {
        // This will trigger the re-run of the coin fetching effect below
        setIsSimulationMode(!isSimulationMode);
      } else {
        const errorData = await response.json();
        console.error("Error toggling mode:", errorData);
      }
    } catch (err) {
      console.error("Error toggling mode:", err);
    }
  };

  // Fetch Crypto Data only if logged in
  // NOTE: Added isSimulationMode as a dependency so the data refreshes when mode changes.
  useEffect(() => {
    if (!walletConnected) return;

    const fetchCryptoData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/coins`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
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
  }, [walletConnected, isSimulationMode]); // <== Updated here!

  // Calculate Aggregate USD Value
  useEffect(() => {
    const totalUsdValue = Object.entries(cryptoBalances).reduce(
      (sum, [coin, bal]) => {
        const price = cryptoPrices[coin.toLowerCase()] || 0;
        return sum + bal * price;
      },
      0
    );
    setAggregateUsdValue(totalUsdValue);
  }, [cryptoBalances, cryptoPrices]);

  // Toggle Auto-Trading
  const toggleAutoTrading = async (coin) => {
    const standardizedCoin = coin.toLowerCase();
    setError(null);
    try {
      const endpoint = autoTrading[standardizedCoin]
        ? `${API_BASE_URL}/api/trading/stop`
        : `${API_BASE_URL}/api/trading/start`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin: standardizedCoin }),
      });
      if (!response.ok) throw new Error("Error toggling auto-trading");
      setAutoTrading((prev) => ({
        ...prev,
        [standardizedCoin]: !prev[standardizedCoin],
      }));
    } catch (err) {
      console.error("Error toggling auto-trading:", err);
      setError(err.message);
    }
  };

  // Poll AI Decisions
  useEffect(() => {
    const pollAiDecisions = async () => {
      const activeCoins = Object.keys(autoTrading).filter((c) => autoTrading[c]);
      if (!activeCoins.length) return;
      for (const coin of activeCoins) {
        try {
          const resp = await fetch(
            `${API_BASE_URL}/api/trading/decision/${coin}`
          );
          if (!resp.ok)
            throw new Error(`Error fetching AI decision for ${coin}`);
          const decision = await resp.json();
          setTradeDecisions((prev) => ({ ...prev, [coin]: decision }));
          if (decision.decision === "BUY") {
            autoTransaction(coin, "buy", 1, decision.price);
          } else if (decision.decision === "SELL") {
            autoTransaction(coin, "sell", 1, decision.price);
          }
        } catch (err) {
          console.error("AI decision error:", err);
          setError(err.message);
        }
      }
    };
    const interval = setInterval(pollAiDecisions, AI_DECISION_POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [autoTrading]);

  // Auto Transaction Helper
  const autoTransaction = (coin, type, amountToTrade, price) => {
    setCrypto(coin);
    setAmount(String(amountToTrade));
    setTimeout(() => handleTransaction(type), 100);
  };

  // Manual Buy/Sell
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
    const currentBalance = cryptoBalances[coinKey] || 0;
    if (!price) {
      alert("Unable to fetch price. Try again later.");
      return;
    }
    if (type === "buy" && transactionAmount * price > balance) {
      alert("Insufficient NEAR balance to complete the transaction.");
      return;
    }
    if (type === "sell" && transactionAmount > currentBalance) {
      alert("Insufficient crypto balance to complete the transaction.");
      return;
    }
    const newBalance =
      type === "buy"
        ? balance - transactionAmount * price
        : balance + transactionAmount * price;
    setBalance(newBalance);
    setCryptoBalances((prev) => {
      const prevBal = prev[coinKey] || 0;
      const updatedBal =
        type === "buy"
          ? prevBal + transactionAmount
          : Math.max(0, prevBal - transactionAmount);
      return { ...prev, [coinKey]: updatedBal };
    });
    setTransactionHistory((prev) => [
      {
        type,
        amount: transactionAmount,
        date: new Date().toLocaleString(),
        coin: coinKey,
        price,
      },
      ...prev,
    ]);
    setCrypto("");
    setAmount("");
  };

  const handleSelectCrypto = (selectedCrypto) => setCrypto(selectedCrypto);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
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
        isSimulationMode={isSimulationMode}
        toggleSimulationMode={toggleSimulationMode}
        style={{ flex: 1 }}
      />
      <ErrorDialog error={error} onClose={() => setError(null)} />
      <Footer />
    </div>
  );
};

export default App;
