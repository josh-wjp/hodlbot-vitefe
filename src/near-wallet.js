import { setupWalletSelector } from "@near-wallet-selector/core";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupModal } from "@near-wallet-selector/modal-ui";

const nearConfig = {
  networkId: "testnet", // Change to "mainnet" for production
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
};

let walletSelector;
let wallet;

export const initNear = async () => {
  try {
    console.log("Initializing NEAR Wallet Selector...");
    walletSelector = await setupWalletSelector({
      network: "testnet", // Use "mainnet" for production
      modules: [
        setupMyNearWallet({
          walletUrl: "https://app.mynearwallet.com",
        }),
      ],
    });

    const isSignedIn = walletSelector.isSignedIn();
    if (isSignedIn) {
      wallet = await walletSelector.wallet();
    }
    return isSignedIn;
  } catch (error) {
    console.error("Error initializing Wallet Selector:", error);
    throw error;
  }
};

export const login = async () => {
  if (!walletSelector) {
    throw new Error("Wallet Selector is not initialized");
  }

  try {
    const modal = setupModal(walletSelector, {
      contractId: "stillviperwjp.testnet", // contract ID
    });
    modal.show();
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = async () => {
  if (!walletSelector) {
    throw new Error("Wallet Selector is not initialized");
  }

  try {
    const wallet = await walletSelector.wallet();
    await wallet.signOut();
    window.location.reload();
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

export const getAccountId = () => {
  if (!wallet) {
    throw new Error("Wallet is not initialized");
  }
  return wallet.getAccounts()[0].accountId;
};
