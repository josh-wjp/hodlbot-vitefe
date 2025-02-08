import React, { useEffect, useState } from "react";
import {
  initNear,
  login,
  logout,
  isSignedIn,
  getAccountId,
  getBalance,
} from "./near-wallet";
import "./App.css";

const App = () => {
  const [walletConnected, setWalletConnected] = useState(false);
  const [accountId, setAccountId] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const wallet = await initNear();
        if (wallet.isSignedIn()) {
          setWalletConnected(true);
          setAccountId(wallet.getAccountId());
          const userBalance = await getBalance();
          setBalance(userBalance);
        }
      } catch (error) {
        console.error("Error initializing NEAR wallet:", error);
      }
    })();
  }, []);

  return (
    <div className="app">
      <h1>HodlBot AI Trading</h1>

      {!walletConnected ? (
        <button
          onClick={() => login("stillviperwjp.testnet")}
          className="login-button"
        >
          Connect NEAR Wallet
        </button>
      ) : (
        <div>
          <p>Welcome, {accountId}!</p>
          <p>Balance: {balance ? `${balance.available} yoctoNEAR` : "Loading..."}</p>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
