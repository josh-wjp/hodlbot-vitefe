import React, { useEffect, useState } from "react";
import { initNear, login, logout, getAccountId } from "./near-wallet";
import FrontEndDesign from "./FrontEndDesign";
import Footer from "./Footer";
import "./App.css";

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [crypto, setCrypto] = useState(""); // Cryptocurrency input
  const [amount, setAmount] = useState(""); // Amount for buy/sell
  const [loading, setLoading] = useState(false); // Loading state for API requests
  const [balance, setBalance] = useState(100); // Mock NEAR Wallet Balance
  const [cryptoBalances, setCryptoBalances] = useState({}); // Balances for each cryptocurrency
  const [cryptoPrices, setCryptoPrices] = useState({}); // Current prices for each cryptocurrency
  const [transactionHistory, setTransactionHistory] = useState([]); // Transaction history
  const [aggregateUsdValue, setAggregateUsdValue] = useState(0); // Total crypto value in USD
  const [error, setError] = useState(null); // Error state for API polling
  const [tradeDecisions, setTradeDecisions] = useState({});

  const API_BASE_URL = "https://hodlbot-api-bmcmdhccf5hmgahy.eastus2-01.azurewebsites.net";
  const POLLING_INTERVAL = 120000; // 120 seconds

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
      } catch (error) {
        console.error("Error initializing NEAR wallet:", error);
      }
    })();
  }, []);

  // Poll the /coins endpoint every 120 seconds
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

        // Update cryptoPrices state
        const pricesMap = {};
        data.forEach((coin) => {
          pricesMap[coin.id.toUpperCase()] = coin.current_price;
        });
        setCryptoPrices(pricesMap);

      } catch (err) {
        console.error("Error fetching crypto data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch, then poll
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Update total USD value whenever balances or prices change
  useEffect(() => {
    const totalUsdValue = Object.entries(cryptoBalances).reduce((sum, [coin, bal]) => {
      const price = cryptoPrices[coin] || 0;
      return sum + bal * price;
    }, 0);
    setAggregateUsdValue(totalUsdValue);
  }, [cryptoBalances, cryptoPrices]);

  // Handle Buy/Sell Transactions
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
    const coinKey = crypto.toUpperCase();
    const price = cryptoPrices[coinKey];

    if (!price) {
      alert("Unable to fetch price. Try again later.");
      return;
    }

    if (type === "buy" && transactionAmount > balance) {
      alert("Insufficient NEAR balance to complete the transaction.");
      return;
    }

    // Update NEAR balance
    const newBalance = type === "buy"
      ? balance - transactionAmount
      : balance + transactionAmount;
    setBalance(newBalance);

    // Update crypto balances
    setCryptoBalances((prevBalances) => {
      const currentBalance = prevBalances[coinKey] || 0;
      const updatedCryptoBalance =
        type === "buy"
          ? currentBalance + transactionAmount
          : Math.max(0, currentBalance - transactionAmount);

      return { ...prevBalances, [coinKey]: updatedCryptoBalance };
    });

    // Record transaction
    const newTransaction = {
      type,
      amount: transactionAmount,
      date: new Date().toLocaleString(),
      coin: coinKey,
      price,
    };
    setTransactionHistory((prev) => [newTransaction, ...prev]);

    // Reset input fields
    setCrypto("");
    setAmount("");
  };

  // Handle selecting a cryptocurrency
  const handleSelectCrypto = (selectedCrypto) => {
    setCrypto(selectedCrypto);
  };

  return (
    <>
      {/* Move all UI layout into FrontEndDesign, passing necessary props */}
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
        setAmount={setAmount} // We'll need this inside the UI for onChange
        transactionHistory={transactionHistory}
        aggregateUsdValue={aggregateUsdValue}
        cryptoBalances={cryptoBalances}
      />

      {/* Footer remains at the bottom */}
      <Footer />
    </>
  );
};

export default App;
