import { ethers } from "ethers";
import { IProvider } from "@web3auth/base";
import { PERMIT_TYPEHASH, MAX_UINT256, createDomainSeparator } from "./eip2612Utils";
import { getNonce } from "./tokenUtils";
import { EthereumProvider } from "@/types/web3types";

// Token constants
export const PYUSDSepoliaAddress = "0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9";
export const PYUSDTokenName = "PYUSD";
export const PYUSDTokenVersion = "1";

// EIP2612 ABI fragment for getting token information
const EIP2612InfoABI = [
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
  }
];

/**
 * Create a permit signature for a token transfer
 * @param provider Web3Auth provider
 * @param owner Token owner address
 * @param spender Address that will spend tokens (relayer)
 * @param value Amount to approve
 * @param tokenAddress Token contract address
 * @returns Object containing signature and deadline
 */
export async function createPermitSignature(
  provider: IProvider,
  owner: string,
  spender: string,
  value: string,
  tokenAddress: string = PYUSDSepoliaAddress
): Promise<{ signature: string, deadline: string } | Error> {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider as unknown as EthereumProvider);
    const signer = await ethersProvider.getSigner();

    // Initialize the token contract
    const tokenContract = new ethers.Contract(
      tokenAddress,
      EIP2612InfoABI,
      ethersProvider
    );

    // Get chain ID
    const { chainId } = await ethersProvider.getNetwork();

    // Check if token implementation supports name() and version()
    let tokenName = PYUSDTokenName;
    let tokenVersion = PYUSDTokenVersion;

    try {
      tokenName = await tokenContract.name();
      // Not all EIP2612 implementations have version()
      try {
        tokenVersion = await tokenContract.version();
      } catch (error) {
        console.log('Token does not implement version(), using default', tokenVersion);
      }
    } catch (error) {
      console.error('Error getting token name/version, using defaults:', error);
    }

    // Get current nonce for the owner
    const nonceResult = await getNonce(provider, owner, tokenAddress);
    if (nonceResult instanceof Error) {
      return nonceResult;
    }

    const nonce = nonceResult;

    // Set deadline to 1 hour from now (in seconds since unix epoch)
    const deadline = Math.floor(Date.now() / 1000 + 60 * 60).toString();

    // Create domain separator
    const domainSeparator = createDomainSeparator(
      tokenName,
      tokenVersion,
      Number(chainId),
      tokenAddress
    );

    // Prepare the digest for signing
    const digest = ethers.keccak256(
      "0x1901" +
      ethers.stripZerosLeft(domainSeparator) +
      ethers.stripZerosLeft(
        ethers.keccak256(
          ethers.AbiCoder.defaultAbiCoder().encode(
            ["bytes32", "address", "address", "uint256", "uint256", "uint256"],
            [PERMIT_TYPEHASH, owner, spender, value, nonce, deadline]
          )
        )
      )
    );

    // Sign the digest
    const signature = await signer.signMessage(ethers.getBytes(digest));

    return {
      signature,
      deadline
    };
  } catch (error) {
    console.error('Error creating permit signature:', error);
    return error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Get infinite approval deadline value
 * @returns Maximum uint256 value
 */
export function getInfiniteDeadline(): string {
  return MAX_UINT256;
}
