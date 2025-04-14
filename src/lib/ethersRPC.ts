import { ethers } from "ethers";
import { IProvider } from "@web3auth/base";

// Define provider types to avoid any
/* eslint-disable @typescript-eslint/no-explicit-any */
type EthereumProvider = {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  removeListener?: (event: string, callback: (...args: any[]) => void) => void;
  [key: string]: any;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Get the chain ID from the provider
 * @param provider - Web3Auth provider
 * @returns The chain ID
 */
const getChainId = async (provider: IProvider): Promise<string | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    // Get the connected Chain's ID
    const networkDetails = await ethersProvider.getNetwork();
    return networkDetails.chainId.toString();
  } catch (error) {
    return error as Error;
  }
};

/**
 * Get the user's Ethereum address
 * @param provider - Web3Auth provider
 * @returns The user's Ethereum address
 */
const getAccounts = async (provider: IProvider): Promise<string | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = await signer.getAddress();

    return address;
  } catch (error) {
    return error as Error;
  }
};

/**
 * Get the user's balance in ETH
 * @param provider - Web3Auth provider
 * @returns The user's balance in ETH
 */
const getBalance = async (provider: IProvider): Promise<string | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = await signer.getAddress();

    // Get user's balance in ether
    const balance = ethers.formatEther(
      await ethersProvider.getBalance(address) // Balance is in wei
    );

    return balance;
  } catch (error) {
    return error as Error;
  }
};

/**
 * Send a transaction to another address
 * @param provider - Web3Auth provider
 * @param destination - The destination address
 * @param amount - The amount to send in ETH
 * @returns The transaction receipt
 */
const sendTransaction = async (
  provider: IProvider,
  destination: string,
  amount: string
): Promise<ethers.TransactionReceipt | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    const signer = await ethersProvider.getSigner();

    const amountInWei = ethers.parseEther(amount);
    const fees = await ethersProvider.getFeeData();

    // Submit transaction to the blockchain
    const tx = await signer.sendTransaction({
      to: destination,
      value: amountInWei,
      maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
      maxFeePerGas: fees.maxFeePerGas,
    });

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    return receipt;
  } catch (error) {
    return error as Error;
  }
};

/**
 * Sign a message using the user's private key
 * @param provider - Web3Auth provider
 * @param message - The message to sign
 * @returns The signed message
 */
const signMessage = async (
  provider: IProvider,
  message: string
): Promise<string | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    const signer = await ethersProvider.getSigner();

    // Sign the message
    const signedMessage = await signer.signMessage(message);

    return signedMessage;
  } catch (error) {
    return error as Error;
  }
};

// Create a named export object
const ethersRPC = {
  getChainId,
  getAccounts,
  getBalance,
  sendTransaction,
  signMessage,
};

export default ethersRPC;
