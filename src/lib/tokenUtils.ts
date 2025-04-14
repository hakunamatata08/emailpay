import { ethers } from "ethers";
import { IProvider } from "@web3auth/base";
import { createDomainSeparator, splitSignature } from "./eip2612Utils";
import { EthereumProvider } from "@/types/web3types";

// ERC20 token ABI - only include the functions we need
const ERC20StandardABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Extended ABI to include EIP2612 permit function and nonces
const EIP2612ABI = [
  ...ERC20StandardABI,
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "deadline",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "v",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "r",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "s",
        "type": "bytes32"
      }
    ],
    "name": "permit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "nonces",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "sender",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// PYUSD token address on Ethereum Sepolia
export const PYUSDSepoliaAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";

/**
 * Get the token balance for a user
 * @param provider - Web3Auth provider
 * @param tokenAddress - The address of the ERC20 token
 * @returns The token balance formatted with proper decimals
 */
export const getTokenBalance = async (
  provider: IProvider,
  tokenAddress: string = PYUSDSepoliaAddress
): Promise<string | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    const signer = await ethersProvider.getSigner();

    // Get user's Ethereum public address
    const address = await signer.getAddress();

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20StandardABI,
      ethersProvider
    );

    // Get token decimals
    const decimals = await tokenContract.decimals();

    // Get token balance
    const balance = await tokenContract.balanceOf(address);

    // Format balance with proper decimals
    const formattedBalance = ethers.formatUnits(balance, decimals);

    return formattedBalance;
  } catch (error) {
    console.error("Error getting token balance:", error);
    return error as Error;
  }
};

/**
 * Execute an EIP2612 permit to allow gasless transactions
 * @param provider - Web3Auth provider
 * @param owner - Token owner address
 * @param spender - Address that will spend the tokens
 * @param value - Amount to approve
 * @param deadline - Timestamp until which the permit is valid
 * @param signature - Signature generated off-chain
 * @param tokenAddress - The address of the ERC20 token
 * @returns Transaction hash if successful
 */
export const executePermit = async (
  provider: IProvider,
  owner: string,
  spender: string,
  value: string,
  deadline: string,
  signature: string,
  tokenAddress: string = PYUSDSepoliaAddress
): Promise<string | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    const signer = await ethersProvider.getSigner();

    // Create token contract instance with EIP2612 ABI
    const tokenContract = new ethers.Contract(
      tokenAddress,
      EIP2612ABI,
      signer
    );

    // Split the signature into v, r, s components
    const { v, r, s } = splitSignature(signature);

    // Execute the permit function
    const tx = await tokenContract.permit(
      owner,
      spender,
      ethers.parseUnits(value, await tokenContract.decimals()),
      deadline,
      v,
      r,
      s
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    return receipt.hash;
  } catch (error) {
    console.error("Error executing permit:", error);
    return error as Error;
  }
};

/**
 * Execute a gasless transfer using EIP2612 permit
 * @param provider - Web3Auth provider
 * @param sender - Token owner address
 * @param recipient - Recipient address
 * @param amount - Amount to transfer
 * @param permitSignatureOrEip2612 - Either a permit signature string or an EIP2612 permit object
 * @param deadline - Timestamp until which the permit is valid (not required if EIP2612 object is provided)
 * @param tokenAddress - The address of the ERC20 token
 * @returns Transaction hash if successful
 */
export const executeGaslessTransfer = async (
  provider: IProvider,
  sender: string,
  recipient: string,
  amount: string,
  permitSignatureOrEip2612: string | {
    v: number;
    r: string;
    s: string;
    deadline: string;
    nonce: number;
    owner?: string;
    spender?: string;
    value?: string;
  },
  deadline?: string,
  tokenAddress: string = PYUSDSepoliaAddress
): Promise<string | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    const signer = await ethersProvider.getSigner();
    const spender = await signer.getAddress();

    // Create token contract instance with EIP2612 ABI
    const tokenContract = new ethers.Contract(
      tokenAddress,
      EIP2612ABI,
      signer
    );

    let permitResult;

    // Check if we have an EIP2612 object or a permit signature
    if (typeof permitSignatureOrEip2612 === 'string') {
      // We have a signature string, use the old method
      if (!deadline) {
        return new Error('Deadline is required when providing a permit signature string');
      }

      permitResult = await executePermit(
        provider,
        sender,
        spender,
        amount,
        deadline,
        permitSignatureOrEip2612,
        tokenAddress
      );

      if (permitResult instanceof Error) {
        return permitResult;
      }
    } else {
      // We have an EIP2612 object, use it directly
      const eip2612 = permitSignatureOrEip2612;

      // Execute the permit function
      const tx = await tokenContract.permit(
        eip2612.owner || sender,
        eip2612.spender || spender,
        eip2612.value || ethers.parseUnits(amount, await tokenContract.decimals()),
        eip2612.deadline,
        eip2612.v,
        eip2612.r,
        eip2612.s
      );

      // Wait for the transaction to be mined
      await tx.wait();
    }

    // Now execute the transferFrom
    const decimals = await tokenContract.decimals();
    const parsedAmount = ethers.parseUnits(amount, decimals);

    const tx = await tokenContract.transferFrom(
      sender,
      recipient,
      parsedAmount
    );

    const receipt = await tx.wait();
    return receipt.hash;
  } catch (error) {
    console.error("Error executing gasless transfer:", error);
    return error as Error;
  }
};

/**
 * Get the current nonce for a user's address (required for EIP2612 permit)
 * @param provider - Web3Auth provider
 * @param ownerAddress - Token owner address
 * @param tokenAddress - The address of the ERC20 token
 * @returns The current nonce
 */
export const getNonce = async (
  provider: IProvider,
  ownerAddress: string,
  tokenAddress: string = PYUSDSepoliaAddress
): Promise<number | Error> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);

    // Create token contract instance with EIP2612 ABI
    const tokenContract = new ethers.Contract(
      tokenAddress,
      EIP2612ABI,
      ethersProvider
    );

    // Get the current nonce
    const nonce = await tokenContract.nonces(ownerAddress);

    return Number(nonce);
  } catch (error) {
    console.error("Error getting nonce:", error);
    return error as Error;
  }
};
