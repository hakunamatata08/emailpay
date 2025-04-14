import { ethers } from "ethers";
import { IProvider } from "@web3auth/base";
import { PYUSDSepoliaAddress } from "./permitUtils";
import { PERMIT_TYPEHASH, createDomainSeparator, strip0x } from "./eip2612Utils";
import { getNonce } from "./tokenUtils";
import { EthereumProvider } from "@/types/web3types";
import { ecsign } from "ethereumjs-util";

// Maximum uint256 value used for infinite approvals
export const MAX_UINT256 =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

// EIP2612 ABI fragment for permit function
const EIP2612PermitABI = [
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
    "inputs": [],
    "name": "version",
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

/**
 * Convert a hex string to a Buffer
 */
function bufferFromHexString(hex: string): Buffer {
  return Buffer.from(strip0x(hex), "hex");
}

/**
 * Convert a Buffer to a hex string with '0x' prefix
 */
function hexStringFromBuffer(buf: Buffer): string {
  return "0x" + buf.toString("hex");
}

/**
 * Sign a message using ECDSA
 */
function ecSign(digest: string, privateKey: string) {
  const { v, r, s } = ecsign(
    bufferFromHexString(digest),
    bufferFromHexString(privateKey)
  );

  return { v, r: hexStringFromBuffer(r), s: hexStringFromBuffer(s) };
}

/**
 * Sign an EIP712 message
 */
function signEIP712(
  domainSeparator: string,
  typeHash: string,
  types: string[],
  parameters: (string | number)[], // Updated type from any to (string | number)[]
  privateKey: string
) {
  const digest = ethers.keccak256(
    "0x1901" +
    strip0x(domainSeparator) +
    strip0x(
      ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes32", ...types],
          [typeHash, ...parameters]
        )
      )
    )
  );

  return ecSign(digest, privateKey);
}

/**
 * Sign a permit using the private key directly
 */
export function signPermitWithPrivateKey(
  owner: string,
  spender: string,
  value: string | number,
  nonce: number,
  deadline: string,
  domainSeparator: string,
  privateKey: string
): { v: number, r: string, s: string } {
  return signEIP712(
    domainSeparator,
    PERMIT_TYPEHASH,
    ["address", "address", "uint256", "uint256", "uint256"],
    [owner, spender, value, nonce, deadline],
    privateKey
  );
}

/**
 * Create a gasless EIP2612 permit transaction
 * @param privateKey User's private key
 * @param ownerAddress User's address
 * @param spenderAddress Spender address (app backend/relayer)
 * @param amount Amount to approve
 * @param tokenAddress Token contract address
 * @param deadline Optional deadline (default: infinite)
 * @returns Permit transaction data
 */
export async function createGaslessPermit(
  privateKey: string,
  ownerAddress: string,
  spenderAddress: string,
  amount: string,
  tokenAddress: string = PYUSDSepoliaAddress,
  deadline: string = MAX_UINT256
): Promise<{
  v: number;
  r: string;
  s: string;
  owner: string;
  spender: string;
  value: string;
  deadline: string;
  nonce: number;
} | Error> {
  try {
    // Initialize the provider
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);

    // Initialize the token contract
    const tokenContract = new ethers.Contract(
      tokenAddress,
      EIP2612PermitABI,
      provider
    );

    // Get chain ID
    const { chainId } = await provider.getNetwork();

    // Get current nonce for the owner
    const nonce = await tokenContract.nonces(ownerAddress);

    // Get decimals of the token
    const decimals = await tokenContract.decimals();
    const amountInUnits = ethers.parseUnits(amount, decimals);

    // Use the hardcoded domain separator instead of calculating it
    const domainSeparator = "0xeb1535de0433e1aef3829afd2ac55ec7cceed66557c581c4273fbf7fc537c14a";

    // Sign the permit using the private key
    const { v, r, s } = signPermitWithPrivateKey(
      ownerAddress,
      spenderAddress,
      amountInUnits.toString(),
      Number(nonce),
      deadline,
      domainSeparator,
      privateKey
    );

    return {
      v,
      r,
      s,
      owner: ownerAddress,
      spender: spenderAddress,
      value: amountInUnits.toString(),
      deadline,
      nonce: Number(nonce)
    };
  } catch (error) {
    console.error('Error creating gasless permit:', error);
    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Execute a permit transaction using the gasless approach
 * @param permitData Permit transaction data
 * @param tokenAddress Token contract address
 * @returns Transaction result
 */
export async function executePermitTransaction(
  permitData: {
    v: number;
    r: string;
    s: string;
    owner: string;
    spender: string;
    value: string;
    deadline: string;
  },
  tokenAddress: string = PYUSDSepoliaAddress
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
    const spenderPrivateKey= process.env.SPENDER_PRIVATE_KEY;
    if (!spenderPrivateKey) {
      throw new Error("Spender private key is not defined");
    }
    const spender = new ethers.Wallet(spenderPrivateKey, provider);

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      EIP2612PermitABI,
      spender
    );
    console.log("permitData.value :",permitData.value)

    // Execute the permit transaction
    const tx = await tokenContract.permit(
      permitData.owner,
      permitData.spender,
      permitData.value,
      permitData.deadline,
      permitData.v,
      permitData.r,
      permitData.s
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    return {
      success: true,
      transactionHash: receipt?.hash || tx.hash
    };
  } catch (error) {
    console.error('Error executing permit transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function executeGaslessTransfer(from: string, to: unknown, amount: string, tokenAddress: string = PYUSDSepoliaAddress) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
    const spenderPrivateKey = process.env.SPENDER_PRIVATE_KEY;
    if (!spenderPrivateKey) {
      throw new Error("Spender private key is not defined");
    }
    const spender = new ethers.Wallet(spenderPrivateKey, provider);

    // Create token contract instance
    const tokenContract = new ethers.Contract(
      tokenAddress,
      EIP2612PermitABI,
      spender
    );

    const tx = await tokenContract.transferFrom(
      from,
      to,
      amount
    );

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    return {
      success: true,
      transactionHash: receipt?.hash || tx.hash
    };
  }
  catch (error) {
    console.error('Error executing gasless transfer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
