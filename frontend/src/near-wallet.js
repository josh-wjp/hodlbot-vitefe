import { connect, WalletConnection, keyStores } from "near-api-js";

const nearConfig = {
  networkId: "testnet",
  keyStore: new keyStores.BrowserLocalStorageKeyStore(),
  nodeUrl: "https://rpc.testnet.near.org",
  walletUrl: "https://wallet.testnet.near.org",
  helperUrl: "https://helper.testnet.near.org",
  explorerUrl: "https://explorer.testnet.near.org",
};

let near;
let wallet;

export async function initNear() {
  try {
    near = await connect(nearConfig);
    wallet = new WalletConnection(near, "hodlbot");
    return wallet;
  } catch (error) {
    console.error("Failed to initialize NEAR wallet:", error);
    throw error;
  }
}

export function login(contractName = "stillviperwjp.testnet") {
  wallet.requestSignIn(
    contractName,
    "HodlBot Trading",
    window.location.href,
    window.location.href
  );
}

export function logout() {
  wallet.signOut();
  window.location.reload();
}

export function isSignedIn() {
  return wallet.isSignedIn();
}

export function getAccountId() {
  return wallet.isSignedIn() ? wallet.getAccountId() : null;
}

export async function getBalance() {
  if (!wallet || !wallet.isSignedIn()) {
    throw new Error("Wallet is not signed in");
  }
  try {
    const account = wallet.account();
    const balance = await account.getAccountBalance();
    return balance;
  } catch (error) {
    console.error("Failed to fetch account balance:", error);
    throw error;
  }
}
