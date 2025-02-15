import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import FrontEndDesign from "./FrontEndDesign";
import Footer from "./Footer";
import ErrorDialog from "./ErrorDialog";
import "./App.css";

// Use a single API base constant for all endpoints.
const API_URL = "http://localhost:8000/api";

// Define polling intervals (in milliseconds)
const LIVE_POLLING_INTERVAL = 300000; // 5 minutes
const SIMULATION_POLLING_INTERVAL = 10000; // 10 seconds for simulation mode
const AI_DECISION_POLL_INTERVAL = 30000; // 30 seconds

const App = () => {
  // Core state declarations.
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

  // Initialize NEAR Wallet.
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

  // Fetch simulation/live mode using the /mode endpoint.
  useEffect(() => {
    const fetchMode = async () => {
      try {
        const response = await fetch(`${API_URL}/mode`);
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

  // Toggle between simulation and live mode.
  const toggleSimulationMode = async () => {
    try {
      const newMode = isSimulationMode ? "live" : "simulation";
      const response = await fetch(`${API_URL}/mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: newMode }),
      });
      if (response.ok) {
        // Update simulation mode state (this triggers re-fetching of coin data).
        setIsSimulationMode(!isSimulationMode);
      } else {
        const errorData = await response.json();
        console.error("Error toggling mode:", errorData);
      }
    } catch (err) {
      console.error("Error toggling mode:", err);
    }
  };

  // Fetch Crypto Data only if logged in.
  // The effect re-runs when either walletConnected or isSimulationMode changes.
  useEffect(() => {
    if (!walletConnected) return;

    const intervalDuration = isSimulationMode
      ? SIMULATION_POLLING_INTERVAL
      : LIVE_POLLING_INTERVAL;

    const fetchCryptoData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/coins`);
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
    const interval = setInterval(fetchCryptoData, intervalDuration);
    return () => clearInterval(interval);
  }, [walletConnected, isSimulationMode]);

  // Calculate Aggregate USD Value whenever cryptoBalances or cryptoPrices changes.
  useEffect(() => {
    const totalUsdValue = Object.entries(cryptoBalances).reduce((sum, [coin, bal]) => {
      const price = cryptoPrices[coin.toLowerCase()] || 0;
      return sum + bal * price;
    }, 0);
    setAggregateUsdValue(totalUsdValue);
  }, [cryptoBalances, cryptoPrices]);

// Refactored Manual/Auto Transaction Handler
const handleTransaction = async (
  type,
  { coin: transCoin, amount: transAmount, price: transPrice } = {}
) => {
  // Use passed coin (from auto trades) if provided; otherwise use state.
  const usedCoin = transCoin !== undefined ? transCoin : crypto;
  if (!usedCoin) {
    alert("Please select a cryptocurrency first.");
    return;
  }
  const coinKey = usedCoin.toLowerCase();

  // Use the passed amount if defined; if not, fallback to state.
  // Also, default to 1 if state amount is falsy.
  const transactionAmount =
    transAmount != null && !isNaN(Number(transAmount)) && Number(transAmount) > 0
      ? Number(transAmount)
      : Number(amount) || 1;

  // Use the passed price if defined; otherwise, get it from state.
  const priceVal =
    transPrice != null ? transPrice : cryptoPrices[coinKey];

  // Validate amount and price.
  if (!transactionAmount || isNaN(transactionAmount) || transactionAmount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }
  if (!priceVal) {
    alert("Unable to fetch price. Try again later.");
    return;
  }

  const currentBalance = cryptoBalances[coinKey] || 0;
  if (type === "buy" && transactionAmount * priceVal > balance) {
    alert("Insufficient NEAR balance to complete the transaction.");
    return;
  }
  if (type === "sell" && transactionAmount > currentBalance) {
    alert("Insufficient crypto balance to complete the transaction.");
    return;
  }

  // Update NEAR balance.
  const newBalance =
    type === "buy"
      ? balance - transactionAmount * priceVal
      : balance + transactionAmount * priceVal;
  setBalance(newBalance);

  // Update crypto balance for the coin.
  setCryptoBalances((prev) => {
    const prevBal = prev[coinKey] || 0;
    const updatedBal =
      type === "buy" ? prevBal + transactionAmount : Math.max(0, prevBal - transactionAmount);
    return { ...prev, [coinKey]: updatedBal };
  });

  // Add a new transaction to the history.
  const newTxn = {
    type,
    amount: transactionAmount,
    date: new Date().toLocaleString(),
    coin: coinKey,
    price: priceVal,
  };
  setTransactionHistory((prev) => [newTxn, ...prev]);

  // For manual transactions (when no parameter was passed), clear state.
  if (transCoin === undefined) {
    setCrypto("");
    setAmount("");
  }

  console.log(`Transaction processed: ${type} ${transactionAmount} ${coinKey} @ ${priceVal}`);
};

// Auto Transaction Helper: call handleTransaction with explicit parameters.
const autoTransaction = (coin, type, amountToTrade, price) => {
  console.log(`Auto transaction: ${type} ${amountToTrade} ${coin} @ ${price}`);
  handleTransaction(type, { coin, amount: amountToTrade, price });
};

  // Toggle Auto-Trading
  const toggleAutoTrading = async (coin) => {
    const standardizedCoin = coin.toLowerCase();
    setError(null);
    try {
      const endpoint = autoTrading[standardizedCoin]
        ? `${API_URL}/trading/stop`
        : `${API_URL}/trading/start`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coin: standardizedCoin }),
      });
      if (!response.ok) throw new Error("Error toggling auto-trading");
      setAutoTrading((prev) => ({ ...prev, [standardizedCoin]: !prev[standardizedCoin] }));
    } catch (err) {
      console.error("Error toggling auto-trading:", err);
      setError(err.message);
    }
  };

  // Poll AI Decisions for active auto trading coins.
  useEffect(() => {
    const pollAiDecisions = async () => {
      const activeCoins = Object.keys(autoTrading).filter((c) => autoTrading[c]);
      if (!activeCoins.length) return;
      for (const coin of activeCoins) {
        try {
          const resp = await fetch(`${API_URL}/trading/decision/${coin}`);
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
