import { connect, WalletConnection, keyStores } from "near-api-js";

const nearConfig = {
  networkId: "testnet",
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
};

let wallet; // To store the wallet instance

export const initNear = async () => {
  console.log("Initializing NEAR wallet...");
  const near = await connect(nearConfig); // Connect to NEAR
  wallet = new WalletConnection(near); // Initialize wallet connection
  return wallet;
};

export const login = () => {
  console.log("Logging in...");
  if (!wallet) {
    throw new Error("Wallet is not initialized. Call initNear first.");
  }
  wallet.requestSignIn(); // Redirects user to the NEAR Wallet for login
};

export const logout = () => {
  console.log("Logging out...");
  if (!wallet) {
    throw new Error("Wallet is not initialized. Call initNear first.");
  }
  wallet.signOut(); // Logs out the user
  window.location.reload(); // Reloads the page to reflect the logged-out state
};

export const isSignedIn = () => {
  if (!wallet) {
    throw new Error("Wallet is not initialized. Call initNear first.");
  }
  return wallet.isSignedIn(); // Checks if the user is signed in
};

export const getAccountId = () => {
  if (!wallet) {
    throw new Error("Wallet is not initialized. Call initNear first.");
  }
  return wallet.getAccountId(); // Gets the user's NEAR account ID
};
