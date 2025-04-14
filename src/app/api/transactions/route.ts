import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import {
  CreateTransactionRequest,
  UpdateTransactionRequest,
  Transaction,
  Recipient
} from '@/types/transaction';
import { pregenerateWallet } from '@/lib/walletUtils';
import { executePermitTransaction, executeGaslessTransfer } from '@/lib/gaslessUtils';
import { sendTransactionEmail } from '@/lib/emailUtils';
import { IProvider } from '@web3auth/base';

// EIP2612 permit data interface
interface EIP2612PermitData {
  v: number;
  r: string;
  s: string;
  deadline: string;
  nonce: number;
  owner?: string;
  spender?: string;
  value?: string;
}

// Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json() as CreateTransactionRequest & {
      status?: 'pending' | 'scheduled' | 'draft',
      scheduledDate?: string,  // ISO string for scheduled transactions
      isGasless?: boolean,
      eip2612?: EIP2612PermitData // Only EIP2612 data for gasless transactions
    };
    const {
      userAddress,
      toRecipients,
      ccRecipients = [],
      bccRecipients = [],
      subject,
      amount,
      tokenType,
      network,
      message,
      status: requestedStatus,
      scheduledDate,
      isGasless,
      eip2612  // Only use EIP2612 data
    } = requestData;

    // Basic validation
    if (!userAddress || !toRecipients || toRecipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress and toRecipients are required' },
        { status: 400 }
      );
    }

    // For non-draft transactions, subject and amount are required
    if (requestedStatus !== 'draft' && (!subject || !amount || !tokenType || !network)) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, amount, tokenType, and network are required' },
        { status: 400 }
      );
    }

    // Validate amount (should be a valid number) for non-draft transactions
    if (requestedStatus !== 'draft' && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // For gasless transactions, validate EIP2612 data is provided
    if (isGasless && !eip2612) {
      return NextResponse.json(
        { error: 'For gasless transactions, EIP2612 data is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const now = new Date();

    // Generate wallet addresses only for toRecipients
    const processedToRecipients: Recipient[] = await Promise.all(
      toRecipients.map(async (recipient: Recipient) => {
        if (!recipient.address && recipient.email) {
          const walletAddress = await pregenerateWallet(recipient.email);
          if (walletAddress) {
            return { ...recipient, address: walletAddress };
          }
        }
        return recipient;
      })
    );

    // Create the transaction object with the updated recipients
    const transaction: Omit<Transaction, '_id'> = {
      userAddress,
      toRecipients: processedToRecipients,
      ccRecipients,  // Use original ccRecipients (no address generation)
      bccRecipients, // Use original bccRecipients (no address generation)
      subject: subject || '',  // Empty string for drafts without subject
      amount: amount || '0',   // '0' for drafts without amount
      tokenType: tokenType || 'PYUSD', // Changed from 'PyUSD' to 'PYUSD'
      network: network || 'Ethereum Sepolia',
      message: message || '',
      status: requestedStatus || 'pending', // Use requested status or default to pending
      createdAt: now,
      updatedAt: now
    };

    // Add gasless transaction data if provided
    if (isGasless) {
      transaction.isGasless = true;

      // Store EIP2612 data if provided
      if (eip2612) {
        transaction.eip2612 = eip2612;
      }
    }

    // If it's a scheduled transaction, add the scheduledDate
    if (requestedStatus === 'scheduled' && scheduledDate) {
      transaction.scheduledDate = new Date(scheduledDate);
    }

    const result = await db.collection('transactions').insertOne(transaction);

    // Execute permit transaction if EIP2612 data is available
    if (isGasless && eip2612 && transaction.eip2612) {
      try {
        const permitData = {
          v: transaction.eip2612.v,
          r: transaction.eip2612.r,
          s: transaction.eip2612.s,
          owner: transaction.eip2612.owner || userAddress,
          spender: transaction.eip2612.spender || '',
          value: transaction.eip2612.value || amount,
          deadline: transaction.eip2612.deadline
        };

        const permitResult = await executePermitTransaction(permitData);

        // Update transaction with permit result if successful
        if (permitResult.success && permitResult.transactionHash) {
          await db.collection('transactions').updateOne(
            { _id: result.insertedId },
            { $set: {
                'eip2612.transactionHash': permitResult.transactionHash,
                'eip2612.executed': true,
                'updatedAt': new Date()
              }
            }
          );
          const transferResult = await executeGaslessTransfer(
            permitData.owner,
            processedToRecipients[0].address,
            permitData.value,
          );
          if (transferResult.success) {
            await db.collection('transactions').updateOne(
              { _id: result.insertedId },
              { $set: {
                  txHash: transferResult.transactionHash,
                  status: 'completed',
                  updatedAt: new Date()
                }
              }
            );
          }
        }
      } catch (error) {
        console.error('Error executing permit transaction:', error);
        // Continue with the response even if permit execution fails
      }
    }

    // Retrieve the completed transaction with the inserted ID
    const completedTransaction: Transaction = {
      _id: result.insertedId,
      ...transaction
    };

    // Get the final transaction from the database to ensure we have the latest status
    const finalTransaction = await db.collection('transactions').findOne({
      _id: result.insertedId
    }) as Transaction;

    // Only send email notification if transaction status is 'completed'
    if (finalTransaction.status === 'completed') {
      try {
        await sendTransactionEmail(finalTransaction);
      } catch (emailError) {
        console.error('Error sending transaction email notification:', emailError);
        // Continue with the response even if email sending fails
      }
    }

    return NextResponse.json({
      _id: result.insertedId,
      ...transaction
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Get all transactions for a user
export async function GET(request: NextRequest) {
  try {
    const userAddress = request.nextUrl.searchParams.get('userAddress');
    const status = request.nextUrl.searchParams.get('status') as Transaction['status'] | null;
    const id = request.nextUrl.searchParams.get('id');

    console.log('API: GET /api/transactions - Received request for userAddress',
      userAddress ? userAddress.substring(0, 10) + '...' : 'null',
      'status:', status || 'all');

    if (!userAddress) {
      console.log('API: GET /api/transactions - userAddress parameter missing');
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    console.log('API: GET /api/transactions - Connected to database');

    // If an ID is provided, fetch that specific transaction
    if (id) {
      try {
        const transaction = await db.collection("transactions").findOne({
          _id: new ObjectId(id),
        });

        if (!transaction) {
          return NextResponse.json(
            { error: "Transaction not found" },
            { status: 404 }
          );
        }

        // Convert ObjectId to string for proper serialization
        return NextResponse.json({
          ...transaction,
          _id: transaction._id.toString(),
        });
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid transaction ID" },
          { status: 400 }
        );
      }
    }

    // Build the query with filters
    const query: Record<string, unknown> = { userAddress };

    // Add status filter if provided
    if (status && status !== "all") {
      query.status = status;
    }

    const transactions = await db.collection('transactions')
      .find(query)
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .toArray();

    console.log(`API: GET /api/transactions - Found ${transactions.length} transactions for user`);

    // Convert ObjectId to string for proper serialization
    const formattedTransactions = transactions.map(tx => ({
      ...tx,
      _id: tx._id.toString()
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error('API: Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update an existing transaction
export async function PUT(request: NextRequest) {
  try {
    const requestData = await request.json() as UpdateTransactionRequest & {
      scheduledDate?: string, // ISO string for scheduled transactions
      isGasless?: boolean,
      eip2612?: EIP2612PermitData, // Add EIP2612 data
      provider?: IProvider  // For processing gasless transactions
    };
    const {
      userAddress,
      transactionId,
      toRecipients,
      ccRecipients,
      bccRecipients,
      subject,
      amount,
      tokenType,
      network,
      message,
      status,
      txHash,
      scheduledDate,
      isGasless,
      eip2612, // Add EIP2612 data
      provider
    } = requestData;

    // Basic validation
    if (!userAddress || !transactionId) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress and transactionId are required' },
        { status: 400 }
      );
    }

    // Check if at least one field to update is provided
    if (!toRecipients && ccRecipients === undefined && bccRecipients === undefined &&
        !subject && !amount && !tokenType && !network && !message && !status && !txHash) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    // Validate amount if provided
    if (amount !== undefined && (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the existing transaction to check if it's gasless
    const existingTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(transactionId),
      userAddress
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found or not authorized to update' },
        { status: 404 }
      );
    }

    // Build the update document with only the fields that were provided
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (toRecipients !== undefined) updateData.toRecipients = toRecipients;
    if (ccRecipients !== undefined) updateData.ccRecipients = ccRecipients;
    if (bccRecipients !== undefined) updateData.bccRecipients = bccRecipients;
    if (subject !== undefined) updateData.subject = subject;
    if (amount !== undefined) updateData.amount = amount;
    if (tokenType !== undefined) updateData.tokenType = tokenType;
    if (network !== undefined) updateData.network = network;
    if (message !== undefined) updateData.message = message;
    if (status !== undefined) updateData.status = status;
    if (txHash !== undefined) updateData.txHash = txHash;

    // Add gasless transaction data if provided
    if (isGasless !== undefined) updateData.isGasless = isGasless;
    if (eip2612 !== undefined) updateData.eip2612 = eip2612;

    // Add scheduledDate if provided
    if (scheduledDate !== undefined) {
      updateData.scheduledDate = new Date(scheduledDate);
    }

    // If status is changing to 'scheduled' and no scheduledDate is provided, set a default (24h from now)
    if (status === 'scheduled' && scheduledDate === undefined && !('scheduledDate' in updateData)) {
      updateData.scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    }

    // Process gasless transaction if status is changing to 'completed' and it's a gasless transaction
    if (status === 'completed' && (existingTransaction.isGasless || isGasless) && provider) {
      try {
        // Use the current or updated data
        const currentTransaction = {
          ...existingTransaction,
          ...updateData
        };

        // Execute the gasless transfer
        if (currentTransaction.toRecipients && currentTransaction.toRecipients.length > 0) {
          const recipient = currentTransaction.toRecipients[0];
          if (recipient.address) {
            // Check if it's a gasless transaction with valid EIP2612 data
            if (!currentTransaction.isGasless || !currentTransaction.eip2612) {
              return NextResponse.json(
                { error: 'This is not a valid gasless transaction. EIP2612 data is required.' },
                { status: 400 }
              );
            }

            // Process gasless transaction using EIP2612 data
            if (currentTransaction.eip2612) {
              // Extract the permit data
              const permitData = {
                v: currentTransaction.eip2612.v,
                r: currentTransaction.eip2612.r,
                s: currentTransaction.eip2612.s,
                owner: currentTransaction.eip2612.owner || userAddress,
                spender: currentTransaction.eip2612.spender || '',
                value: currentTransaction.eip2612.value || amount,
                deadline: currentTransaction.eip2612.deadline
              };

              // Execute the permit transaction
              const permitResult = await executePermitTransaction(permitData);

              // If permit was successful, execute the transfer
              if (permitResult.success && permitResult.transactionHash) {
                // Update the transaction with permit result
                await db.collection('transactions').updateOne(
                  { _id: new ObjectId(transactionId) },
                  { $set: {
                      'eip2612.transactionHash': permitResult.transactionHash,
                      'eip2612.executed': true,
                      'updatedAt': new Date()
                    }
                  }
                );

                // Find recipient address
                const recipientAddress = currentTransaction.toRecipients &&
                  currentTransaction.toRecipients.length > 0 &&
                  currentTransaction.toRecipients[0].address;

                if (recipientAddress) {
                  // Execute the gasless transfer
                  const transferResult = await executeGaslessTransfer(
                    permitData.owner,
                    recipientAddress,
                    permitData.value
                  );

                  if (transferResult.success) {
                    // Update transaction with successful transfer
                    updateData.txHash = transferResult.transactionHash;
                    updateData.status = 'completed';
                  } else {
                    // Handle failed transfer
                    updateData.status = 'failed';
                  }
                } else {
                  // No recipient address found
                  updateData.status = 'failed';
                }
              } else {
                // Permit execution failed
                updateData.status = 'failed';
              }
            } else {
              return NextResponse.json(
                { error: 'No valid EIP2612 data found for this transaction' },
                { status: 400 }
              );
            }
          }
        }
      } catch (error) {
        console.error('Error executing gasless transaction:', error);
        updateData.status = 'failed';
      }
    }

    const result = await db.collection('transactions').updateOne(
      { _id: new ObjectId(transactionId), userAddress },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Transaction not found or not authorized to update' },
        { status: 404 }
      );
    }

    // Fetch the updated transaction
    const updatedTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(transactionId),
      userAddress
    }) as Transaction;

    // Send email notification only if the final status is 'completed'
    if (updatedTransaction.status === 'completed' && existingTransaction.status !== 'completed') {
      try {
        await sendTransactionEmail(updatedTransaction);
      } catch (emailError) {
        console.error('Error sending transaction completion email notification:', emailError);
        // Continue with the response even if email sending fails
      }
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// Delete a transaction
export async function DELETE(request: NextRequest) {
  try {
    const userAddress = request.nextUrl.searchParams.get('userAddress');
    const transactionId = request.nextUrl.searchParams.get('transactionId');

    if (!userAddress || !transactionId) {
      return NextResponse.json(
        { error: 'userAddress and transactionId are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('transactions').deleteOne({
      _id: new ObjectId(transactionId),
      userAddress
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Transaction not found or not authorized to delete' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
}

// API endpoint to execute a gasless transfer for a specific transaction
export async function PATCH(request: NextRequest) {
  try {
    const requestData = await request.json();
    const { transactionId } = requestData;

    if (!transactionId) {
      return NextResponse.json(
        { error: 'transactionId is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the transaction
    const transaction = await db.collection('transactions').findOne({
      _id: new ObjectId(transactionId)
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Build the update document with only the fields that were provided
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    // Copy all provided fields from requestData to updateData
    const fieldsToUpdate = [
      'toRecipients', 'ccRecipients', 'bccRecipients', 'subject',
      'amount', 'tokenType', 'network', 'message', 'status', 'txHash',
      'isGasless', 'eip2612'
    ];

    for (const field of fieldsToUpdate) {
      if (requestData[field] !== undefined) {
        updateData[field] = requestData[field];
      }
    }

    // Add scheduledDate if provided
    if (requestData.scheduledDate !== undefined) {
      updateData.scheduledDate = new Date(requestData.scheduledDate);
    }

    // Process gasless transaction if enabled and needed
    if (requestData.isGasless && requestData.eip2612) {
      try {
        // Extract the permit data
        const permitData = {
          v: requestData.eip2612.v,
          r: requestData.eip2612.r,
          s: requestData.eip2612.s,
          owner: requestData.eip2612.owner || transaction.userAddress,
          spender: requestData.eip2612.spender || '',
          value: requestData.eip2612.value || requestData.amount || transaction.amount,
          deadline: requestData.eip2612.deadline
        };

        // Execute the permit transaction
        const permitResult = await executePermitTransaction(permitData);

        // If permit was successful, execute the transfer
        if (permitResult.success && permitResult.transactionHash) {
          // Update the transaction with permit result
          await db.collection('transactions').updateOne(
            { _id: new ObjectId(transactionId) },
            { $set: {
                'eip2612.transactionHash': permitResult.transactionHash,
                'eip2612.executed': true,
                'updatedAt': new Date()
              }
            }
          );

          // Find recipient address
          const recipientAddress = transaction.toRecipients &&
            transaction.toRecipients.length > 0 &&
            transaction.toRecipients[0].address;

          if (recipientAddress) {
            // Execute the gasless transfer
            const transferResult = await executeGaslessTransfer(
              permitData.owner,
              recipientAddress,
              permitData.value
            );

            if (transferResult.success) {
              // Update transaction with successful transfer
              updateData.txHash = transferResult.transactionHash;
              updateData.status = 'completed';
            } else {
              // Handle failed transfer
              updateData.status = 'failed';
            }
          } else {
            // No recipient address found
            updateData.status = 'failed';
          }
        } else {
          // Permit execution failed
          updateData.status = 'failed';
        }
      } catch (error) {
        console.error('Error executing permit transaction:', error);
        updateData.status = 'failed';
      }
    }

    // Update the transaction in database
    const result = await db.collection('transactions').updateOne(
      { _id: new ObjectId(transactionId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Transaction not found or not authorized to update' },
        { status: 404 }
      );
    }

    // Fetch the updated transaction
    const updatedTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(transactionId)
    }) as Transaction;

    // Send email notification only if the final status is now 'completed'
    if (updatedTransaction.status === 'completed' && transaction.status !== 'completed') {
      try {
        await sendTransactionEmail(updatedTransaction);
      } catch (emailError) {
        console.error('Error sending transaction completion email notification:', emailError);
        // Continue with the response even if email sending fails
      }
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
