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
          walletUrl: "https://testnet.mynearwallet.com", // Ensure this is correct for testnet
        }),
      ],
    });

    if (walletSelector.isSignedIn()) {
      wallet = await walletSelector.wallet();
      console.log("Wallet initialized successfully:", wallet);
      const accounts = await wallet.getAccounts();
      console.log("Accounts fetched from wallet:", accounts);
      return true;
    }

    console.log("Wallet not signed in.");
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
export const getAccountId = async () => {
  if (!wallet) {
    console.error("Wallet is not initialized");
    return "";
  }

  try {
    const accounts = await wallet.getAccounts(); // Ensure this is awaited
    console.log("Accounts from wallet:", accounts);

    if (accounts && accounts.length > 0) {
      const accountId = accounts[0].accountId;

      // Validate account ID
      if (/^[a-z0-9._-]+\.testnet$/.test(accountId)) {
        return accountId;
      } else {
        console.error("Invalid NEAR account ID received:", accountId);
        return "";
      }
    }

    console.error("No accounts found in the wallet.");
    return "";
  } catch (error) {
    console.error("Error fetching accounts from wallet:", error);
    return "";
  }
};
