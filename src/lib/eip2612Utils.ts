import { ethers } from "ethers";

// EIP2612 permit typehash
export const PERMIT_TYPEHASH = ethers.keccak256(ethers.toUtf8Bytes(
  "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
));

// Maximum uint256 value used for infinite approvals
export const MAX_UINT256 =
  "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

/**
 * Remove '0x' prefix from a hex string
 */
export function strip0x(v: string): string {
  return v.replace(/^0x/, "");
}

/**
 * Convert a hex string to a Buffer
 */
export function bufferFromHexString(hex: string): Buffer {
  return Buffer.from(strip0x(hex), "hex");
}

/**
 * Convert a Buffer to a hex string with '0x' prefix
 */
export function hexStringFromBuffer(buf: Buffer): string {
  return "0x" + buf.toString("hex");
}

/**
 * EIP712 signature components
 */
export interface EIP712Signature {
  v: number;
  r: string;
  s: string;
}

/**
 * Sign a permit using EIP-712
 * @param owner Token owner address
 * @param spender Address to approve tokens for
 * @param value Number of tokens to approve
 * @param nonce Current nonce of the owner
 * @param deadline Timestamp until which the permit is valid
 * @param domainSeparator EIP-712 domain separator
 * @param privateKey Private key to sign with
 * @returns Signature from wallet
 */
export function signPermit(
  owner: string,
  spender: string,
  value: string | number,
  nonce: number,
  deadline: string,
  domainSeparator: string,
  privateKey: string
): Promise<string> {
  return signEIP712(
    domainSeparator,
    PERMIT_TYPEHASH,
    ["address", "address", "uint256", "uint256", "uint256"],
    [owner, spender, value, nonce, deadline],
    privateKey
  );
}

/**
 * Sign an EIP-712 typed data
 */
async function signEIP712(
  domainSeparator: string,
  typeHash: string,
  types: string[],
  parameters: (string | number)[],
  privateKey: string
): Promise<string> {
  // Create the digest
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

  // Convert the private key to a wallet
  const wallet = new ethers.Wallet(privateKey);

  // Sign the digest
  return wallet.signMessage(ethers.getBytes(digest));
}

/**
 * Create a domain separator for EIP-712
 * @param name Contract name
 * @param version Contract version
 * @param chainId Chain ID
 * @param verifyingContract Contract address
 * @returns Domain separator hash
 */
export function createDomainSeparator(
  name: string,
  version: string,
  chainId: number,
  verifyingContract: string
): string {
  return ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["bytes32", "bytes32", "bytes32", "uint256", "address"],
      [
        ethers.keccak256(ethers.toUtf8Bytes("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")),
        ethers.keccak256(ethers.toUtf8Bytes(name)),
        ethers.keccak256(ethers.toUtf8Bytes(version)),
        chainId,
        verifyingContract
      ]
    )
  );
}

/**
 * Split the signature into v, r, s components
 * @param signature Signature string
 * @returns { v, r, s } components
 */
export function splitSignature(signature: string): { v: number, r: string, s: string } {
  const sig = ethers.Signature.from(signature);
  return {
    v: sig.v || 0,
    r: sig.r,
    s: sig.s
  };
}
