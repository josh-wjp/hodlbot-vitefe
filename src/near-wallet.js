import { connect, WalletConnection, keyStores } from "near-api-js";

const nearConfig = {
  networkId: "testnet",
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  appKeyPrefix: "hodlbot_", // Add a clear appKeyPrefix here
};

let wallet;

export const initNear = async () => {
  console.log("Initializing NEAR wallet...");
  try {
    const near = await connect(nearConfig);
    wallet = new WalletConnection(near, nearConfig.appKeyPrefix);
    return wallet;
  } catch (error) {
    console.error("Error initializing wallet:", error);
    throw error;
  }
};

export const login = () => {
  wallet.requestSignIn(); // Use the wallet instance to log in
};

export const logout = () => {
  wallet.signOut(); // Use the wallet instance to log out
};

export const isSignedIn = () => wallet?.isSignedIn() || false;

export const getAccountId = () => wallet?.getAccountId() || null;
