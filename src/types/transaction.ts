import { ObjectId } from 'mongodb';

export interface Recipient {
  name: string;
  email: string;
  photo?: string;
  address?: string; // Added for storing recipient wallet address
}

// Interface for EIP2612 permit data
export interface EIP2612PermitData {
  v: number;
  r: string;
  s: string;
  deadline: string;
  nonce: number;
  owner?: string; // Added owner field
  spender?: string; // Added spender field
  value?: string; // Added value field
}

export interface Transaction {
  _id?: string; // Changed from ObjectId to string
  userAddress: string; // The sender's wallet address
  toRecipients: {
    name?: string;
    email: string;
    address: string;
  }[]; // Updated structure for toRecipients
  ccRecipients?: {
    name?: string;
    email: string;
    address: string;
  }[]; // Updated structure for ccRecipients
  bccRecipients?: {
    name?: string;
    email: string;
    address: string;
  }[]; // Updated structure for bccRecipients
  subject: string;
  amount: string; // store as string to maintain precision, convert to number when needed
  tokenType: string; // e.g., "PYUSD"
  network: string; // e.g., "Ethereum Sepolia"
  message?: string; // Made message optional
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'draft'; // Updated status options
  txHash?: string; // transaction hash once submitted to blockchain
  createdAt: string; // Changed from Date to string
  updatedAt: string;
  isGasless?: boolean; // Flag to indicate if this is a gasless transaction
  eip2612?: {
    [key: string]: any; // Updated structure for eip2612
  };
}

export interface CreateTransactionRequest {
  userAddress: string;
  toRecipients: Recipient[];
  ccRecipients?: Recipient[];
  bccRecipients?: Recipient[];
  subject: string;
  amount: string;
  tokenType: string;
  network: string;
  message: string;
  status?: 'pending' | 'completed' | 'failed' | 'scheduled' | 'draft';
  scheduledDate?: string; // ISO string format for the date
  isGasless?: boolean; // Flag to indicate if this is a gasless transaction
  permitSignature?: string; // Original EIP2612 permit signature
  permitDeadline?: string; // Deadline timestamp for the permit
  eip2612?: EIP2612PermitData; // New EIP2612 data
}

export interface UpdateTransactionRequest {
  userAddress: string;
  transactionId: string;
  toRecipients?: Recipient[];
  ccRecipients?: Recipient[];
  bccRecipients?: Recipient[];
  subject?: string;
  amount?: string;
  tokenType?: string;
  network?: string;
  message?: string;
  status?: 'pending' | 'completed' | 'failed' | 'scheduled' | 'draft';
  txHash?: string;
  scheduledDate?: Date;
  isGasless?: boolean; // Flag to indicate if this is a gasless transaction
  permitSignature?: string; // Original EIP2612 permit signature
  permitDeadline?: string; // Deadline timestamp for the permit
  eip2612?: EIP2612PermitData; // New EIP2612 data
}

export interface DeleteTransactionRequest {
  userAddress: string;
  transactionId: string;
}

export interface GetTransactionsRequest {
  userAddress: string;
  status?: 'pending' | 'completed' | 'failed' | 'scheduled' | 'draft';
}

// Interface for EIP2612 permit parameters
export interface PermitParams {
  owner: string;
  spender: string;
  value: string;
  nonce: number;
  deadline: string;
  signature?: string; // The signature can be added later
}

// Interface for gasless transaction request
export interface GaslessTransactionRequest {
  sender: string; // Token owner
  recipient: string; // Recipient address
  amount: string; // Amount to transfer
  permitSignature: string; // Signature for the permit
  deadline: string; // Timestamp until which the permit is valid
  tokenAddress?: string; // Optional token address (defaults to PYUSD)
}
