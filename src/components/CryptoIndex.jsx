import React, { useEffect, useState } from "react";
import "./CryptoIndex.css";

// Define your API URL (ensure it matches your backend)
const API_BASE_URL = "http://localhost:8000";

const CryptoIndex = ({ onSelectCrypto, tradeDecisions }) => {
  const [visibleCount, setVisibleCount] = useState(10); // Number of coins to display initially
  const [cryptoList, setCryptoList] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state for API
  const [error, setError] = useState(null); // Error state for API

  useEffect(() => {
    const fetchCryptoList = async () => {
      try {
        // Fetch coin data from your backend instead of CoinGecko directly.
        const response = await fetch(`${API_BASE_URL}/api/coins`);
        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        setCryptoList(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching cryptocurrency list:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchCryptoList();
  }, []);

  const handleExpand = () => {
    setVisibleCount((prev) => prev + 10); // Show 10 more coins on expand
  };

  return (
    <div className="crypto-index">
      <h2>Top Cryptocurrencies</h2>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {!loading && !error && (
        <ul>
          {cryptoList.slice(0, visibleCount).map((crypto) => {
            // Use the trade_indicator from the backend data (or default to HOLD)
            const tradeDecision = crypto.trade_indicator?.decision || "HOLD";

            let highlightClass = "";
            if (tradeDecision === "BUY") highlightClass = "buy-highlight";
            else if (tradeDecision === "SELL") highlightClass = "sell-highlight";
            else if (tradeDecision === "HOLD") highlightClass = "hold-highlight";

            return (
              <li
                key={crypto.id}
                className={`crypto-item ${highlightClass}`}
                onClick={() => onSelectCrypto(crypto.id)}
              >
                <span>{crypto.name}</span>
                <span>${crypto.current_price.toFixed(2)}</span>
                <span className="trade-decision">{tradeDecision}</span>
              </li>
            );
          })}
        </ul>
      )}
      {!loading && !error && visibleCount < cryptoList.length && (
        <button onClick={handleExpand}>Load More</button>
      )}
    </div>
  );
};

export default CryptoIndex;
