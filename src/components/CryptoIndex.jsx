import React, { useEffect, useState } from "react";
import "./CryptoIndex.css"; // Ensure styles are applied

const CryptoIndex = ({ onSelectCrypto, tradeDecisions }) => {
  const [visibleCount, setVisibleCount] = useState(10); // Number of coins to display initially
  const [cryptoList, setCryptoList] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state for API
  const [error, setError] = useState(null); // Error state for API

  useEffect(() => {
    const fetchCryptoList = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100");
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
            const tradeDecision = tradeDecisions[crypto.id.toUpperCase()] || "HOLD"; // Default to HOLD

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
