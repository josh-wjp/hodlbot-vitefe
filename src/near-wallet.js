import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";

const CONTRACT_ID = "stillviperwjp.testnet"; // Your deployed contract ID

let walletSelector;
let wallet;

// Initialize the NEAR Wallet Selector
export const initNear = async () => {
  try {
    console.log("Initializing NEAR Wallet Selector...");
    walletSelector = await setupWalletSelector({
      network: "testnet", // Use "mainnet" for production
      modules: [
        setupMyNearWallet({
          walletUrl: "https://testnet.mynearwallet.com",
          redirectUrl: window.location.origin, // Redirect back to the current site
        }),
      ],
    });
    console.log("Wallet Selector State:", walletSelector.store.getState()); // Debug log

    if (walletSelector.isSignedIn()) {
      wallet = await walletSelector.wallet();
      console.log("Wallet is signed in:", wallet.getAccounts());
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error initializing Wallet Selector:", error);
    throw error;
  }
};

// Show the wallet connection modal
export const login = async () => {
  if (!walletSelector) {
    throw new Error("Wallet Selector is not initialized");
  }

  try {
    const modal = setupModal(walletSelector, {
      contractId: CONTRACT_ID,
    });
    modal.show();
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Log out of the wallet
export const logout = async () => {
  if (!wallet) {
    throw new Error("Wallet is not initialized");
  }

  try {
    await wallet.signOut();
    window.location.reload(); // Reload the app after logout
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

// Get the account ID of the connected wallet
export const getAccountId = () => {
  if (!wallet) {
    throw new Error("Wallet is not initialized");
  }
  const accounts = wallet.getAccounts();
  console.log("Wallet Accounts:", accounts); // Debug log
  return accounts.length > 0 ? accounts[0].accountId : null;
};
