import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import FrontEndDesign from "./FrontEndDesign";
import Footer from "./Footer";
import ErrorDialog from "./ErrorDialog";
import "./App.css";

// Use a single API base constant for all endpoints.
const API_URL = "http://localhost:8000/api";

// Define polling intervals (in milliseconds)
const LIVE_POLLING_INTERVAL = 300000; // 5 minutes (live mode)
const SIMULATION_POLLING_INTERVAL = 10000; // 10 seconds (simulation mode)
const AI_DECISION_POLL_INTERVAL = 10000; // 1 second

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

  // New state variables for PnL and holdings.
  const [holdings, setHoldings] = useState({}); // { bitcoin: { quantity: X, avgCost: Y } }
  const [pnl, setPnl] = useState({}); // { bitcoin: realizedProfit }
  const [totalPnl, setTotalPnl] = useState(0);

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
        setIsSimulationMode(!isSimulationMode);
      } else {
        const errorData = await response.json();
        console.error("Error toggling mode:", errorData);
      }
    } catch (err) {
      console.error("Error toggling mode:", err);
    }
  };

  // Fetch Crypto Data (re-fetch when walletConnected or simulation mode changes).
  useEffect(() => {
    if (!walletConnected) return;
    const intervalDuration = isSimulationMode ? SIMULATION_POLLING_INTERVAL : LIVE_POLLING_INTERVAL;
    const fetchCryptoData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/coins`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
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

  // Calculate Aggregate USD Value.
  useEffect(() => {
    const totalUsdValue = Object.entries(cryptoBalances).reduce((sum, [coin, bal]) => {
      const price = cryptoPrices[coin.toLowerCase()] || 0;
      return sum + bal * price;
    }, 0);
    setAggregateUsdValue(totalUsdValue);
  }, [cryptoBalances, cryptoPrices]);

  // Refactored Transaction Handler:
  // Accepts an optional parameter object for coin, amount, and price.
 const handleTransaction = async (
  type,
  { coin: transCoin, amount: transAmount, price: transPrice } = {}
) => {
  // Use passed coin if available; otherwise, use the state.
  const usedCoin = transCoin !== undefined ? transCoin : crypto;
  if (!usedCoin) {
    alert("Please select a cryptocurrency first.");
    return;
  }
  const coinKey = usedCoin.toLowerCase();

  // Use passed amount if provided; otherwise, use state. Default to 1.
  const transactionAmount =
    typeof transAmount !== "undefined" && Number(transAmount) > 0
      ? Number(transAmount)
      : Number(amount) || 1;
  const priceVal =
    typeof transPrice !== "undefined" ? transPrice : cryptoPrices[coinKey];

  // Validate transaction amount.
  if (!transactionAmount || isNaN(transactionAmount) || transactionAmount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }
  if (!priceVal) {
    alert("Unable to fetch price. Try again later.");
    return;
  }

  // For buy orders, ensure the total purchase value is at least $10.
  if (type === "buy" && transactionAmount * priceVal < 10) {
    alert("Minimum purchase amount is $10.");
    return;
  }

  // For sell orders, ensure the sale would yield profit.
  // Check against holdings' average cost.
  const currentHolding = holdings[coinKey] || { quantity: 0, avgCost: 0 };
  if (type === "sell") {
    if (transactionAmount > currentHolding.quantity) {
      alert("Insufficient coin holdings to complete the transaction.");
      return;
    }
    if (priceVal <= currentHolding.avgCost) {
      alert("Sale would not be profitable. Waiting for a better price.");
      return;
    }
  }

  // For buy orders, also check that the purchase doesn't exceed NEAR balance.
  if (type === "buy" && transactionAmount * priceVal > balance) {
    alert("Insufficient NEAR balance to complete the transaction.");
    return;
  }

  // Update NEAR balance.
  const newBalance =
    type === "buy"
      ? balance - transactionAmount * priceVal
      : balance + transactionAmount * priceVal;
  setBalance(newBalance);

  if (type === "buy") {
    // Update holdings: Calculate new average cost.
    const prevQty = currentHolding.quantity;
    const prevAvgCost = currentHolding.avgCost;
    const newQuantity = prevQty + transactionAmount;
    const newAvgCost =
      prevQty > 0
        ? (prevQty * prevAvgCost + transactionAmount * priceVal) / newQuantity
        : priceVal;
    setHoldings((prev) => ({
      ...prev,
      [coinKey]: { quantity: newQuantity, avgCost: newAvgCost },
    }));
    // Also update cryptoBalances for display.
    setCryptoBalances((prev) => ({ ...prev, [coinKey]: newQuantity }));
  } else if (type === "sell") {
    // Calculate realized profit.
    const realizedProfit = (priceVal - currentHolding.avgCost) * transactionAmount;
    const newQuantity = currentHolding.quantity - transactionAmount;
    if (newQuantity > 0) {
      setHoldings((prev) => ({
        ...prev,
        [coinKey]: { quantity: newQuantity, avgCost: currentHolding.avgCost },
      }));
    } else {
      setHoldings((prev) => {
        const updated = { ...prev };
        delete updated[coinKey];
        return updated;
      });
    }
    setCryptoBalances((prev) => ({ ...prev, [coinKey]: newQuantity }));
    // Update profit/loss for this coin.
    setPnl((prev) => ({
      ...prev,
      [coinKey]: (prev[coinKey] || 0) + realizedProfit,
    }));
  }

  // Create a new transaction history entry.
  const newTxn = {
    type,
    amount: transactionAmount,
    date: new Date().toLocaleString(),
    coin: coinKey,
    price: priceVal,
    realizedProfit: type === "sell" ? (priceVal - currentHolding.avgCost) * transactionAmount : 0,
  };
  setTransactionHistory((prev) => [newTxn, ...prev]);

  // Recalculate total PnL.
  const updatedPnl = { ...pnl };
  if (type === "sell") {
    updatedPnl[coinKey] = (pnl[coinKey] || 0) + (priceVal - currentHolding.avgCost) * transactionAmount;
  }
  const newTotalPnl = Object.values(updatedPnl).reduce((sum, val) => sum + val, 0);
  setTotalPnl(newTotalPnl);

  // For manual transactions (when no parameter was passed), clear input fields.
  if (transCoin === undefined) {
    setCrypto("");
    setAmount("");
  }

  console.log(`Processed ${type} of ${transactionAmount} ${coinKey} at ${priceVal}`);
};


  // Auto Transaction Helper calls handleTransaction with explicit parameters.
  const autoTransaction = (coin, type, amountToTrade, price) => {
    console.log(`Auto transaction: ${type} ${amountToTrade} ${coin} @ ${price}`);
    handleTransaction(type, { coin, amount: amountToTrade, price });
  };

  // Toggle Auto-Trading.
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
          // Calculate quantity so that at least $10 is spent:
          const qty = Math.ceil(10 / decision.price);
          console.log(`Auto BUY for ${coin}: quantity ${qty} @ ${decision.price}`);
          autoTransaction(coin, "buy", qty, decision.price);
        } else if (decision.decision === "SELL") {
          // For SELL: Only sell if holdings exist and the price is at least 5% above the average cost.
          const coinKey = coin.toLowerCase();
          const coinHoldings = holdings[coinKey]?.quantity || 0;
          const avgCost = holdings[coinKey]?.avgCost || 0;
          const profitThreshold = 0.05; // 5% profit threshold.
          if (coinHoldings > 0 && decision.price >= avgCost * (1 + profitThreshold)) {
            // Sell 20% of holdings (minimum 1 coin).
            const sellPercentage = 0.2;
            const sellAmount = Math.max(1, Math.floor(coinHoldings * sellPercentage));
            console.log(`Auto SELL for ${coin}: selling ${sellAmount} units @ ${decision.price}`);
            autoTransaction(coin, "sell", sellAmount, decision.price);
          }
        }
      } catch (err) {
        console.error("AI decision error:", err);
        setError(err.message);
      }
    }
  };
  // Include 'holdings' in the dependency so we have the latest values.
  const interval = setInterval(pollAiDecisions, AI_DECISION_POLL_INTERVAL);
  return () => clearInterval(interval);
}, [autoTrading, holdings]);

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
