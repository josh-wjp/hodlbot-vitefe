import React, { useEffect, useState } from "react";

function TradeInfo() {
  const [price, setPrice] = useState(null);
  const [tradeDecision, setTradeDecision] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const bitcoinPrice = await fetchPrice("bitcoin");
      const decision = await fetchTradeDecision("bitcoin");
      setPrice(bitcoinPrice);
      setTradeDecision(decision);
    }
    fetchData();
  }, []);

  if (!price || !tradeDecision) return <p>Loading trade data...</p>;

  return (
    <div>
      <h2>Bitcoin Trade Info</h2>
      <p>Price: ${price}</p>
      <p>Decision: {tradeDecision.action}</p>
    </div>
  );
}

async function fetchPrice(coinId) {
  try {
    const response = await fetch(`https://hodlbot-api-bmcmdhccf5hmgahy.eastus2-01.azurewebsites.net${coinId}`);
    if (!response.ok) throw new Error("Failed to fetch price");
    const data = await response.json();
    return data[coinId].usd;
  } catch (error) {
    console.error("Error fetching price:", error);
    return null;
  }
}

async function fetchTradeDecision(coinId) {
  try {
    const response = await fetch(`https://hodlbot-api-bmcmdhccf5hmgahy.eastus2-01.azurewebsites.net/trade/${coinId}`);
    if (!response.ok) throw new Error("Failed to fetch trade decision");
    return await response.json();
  } catch (error) {
    console.error("Error fetching trade decision:", error);
    return null;
  }
}

export default TradeInfo;
