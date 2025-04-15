import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { Transaction } from '@/types/transaction';
import { executePermitTransaction, executeGaslessTransfer } from '@/lib/gaslessUtils';

// Get a single transaction by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: transactionId } = await context.params;
    const userAddress = request.nextUrl.searchParams.get('userAddress');

    console.log(`API: GET /api/transactions/${transactionId} - Received request for userAddress`,
      userAddress ? userAddress.substring(0, 10) + '...' : 'null');

    if (!userAddress) {
      console.log(`API: GET /api/transactions/${transactionId} - userAddress parameter missing`);
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      );
    }

    // Validate the transaction ID format
    if (!ObjectId.isValid(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    console.log(`API: GET /api/transactions/${transactionId} - Connected to database`);

    const transaction = await db.collection('transactions').findOne({
      _id: new ObjectId(transactionId),
      userAddress
    });

    if (!transaction) {
      console.log(`API: GET /api/transactions/${transactionId} - Transaction not found or not authorized`);
      return NextResponse.json(
        { error: 'Transaction not found or not authorized to view' },
        { status: 404 }
      );
    }

    console.log(`API: GET /api/transactions/${transactionId} - Successfully retrieved transaction`);
    return NextResponse.json(transaction);
  } catch (error) {
    console.error(`API: Error fetching transaction ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch transaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update a transaction by ID (PATCH method for partial updates)
export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id: transactionId } = await context.params;
    const requestData = await request.json();

    // Validate the transaction ID format
    if (!ObjectId.isValid(transactionId)) {
      return NextResponse.json(
        { error: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Get the existing transaction
    const transaction = await db.collection('transactions').findOne({
      _id: new ObjectId(transactionId)
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Build the update document with fields provided in the request
    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    // Fields that can be updated
    const allowedFields = [
      'toRecipients', 'ccRecipients', 'bccRecipients', 'subject',
      'amount', 'tokenType', 'network', 'message', 'status', 'txHash',
      'isGasless', 'eip2612'
    ];

    for (const field of allowedFields) {
      if (requestData[field] !== undefined) {
        updateData[field] = requestData[field];
      }
    }

    // Handle special fields
    if (requestData.scheduledDate !== undefined) {
      updateData.scheduledDate = new Date(requestData.scheduledDate);
    }

    // Process gasless transaction logic if needed
    if (requestData.status === 'pending' && transaction.status === 'draft' &&
        (transaction.isGasless || requestData.isGasless) &&
        (transaction.eip2612 || requestData.eip2612)) {

      try {
        // Use the eip2612 data from the request or from the existing transaction
        const eip2612Data = requestData.eip2612 || transaction.eip2612;

        // Extract the permit data
        const permitData = {
          v: eip2612Data.v,
          r: eip2612Data.r,
          s: eip2612Data.s,
          owner: eip2612Data.owner || transaction.userAddress,
          spender: eip2612Data.spender || '',
          value: eip2612Data.value || requestData.amount || transaction.amount,
          deadline: eip2612Data.deadline
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
            console.error('No recipient address found for gasless transaction');
          }
        } else {
          // Permit execution failed
          updateData.status = 'failed';
          console.error('Permit execution failed');
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
        { error: 'Failed to update transaction' },
        { status: 500 }
      );
    }

    // Fetch the updated transaction
    const updatedTransaction = await db.collection('transactions').findOne({
      _id: new ObjectId(transactionId)
    });

    // Send email notification if status changed to 'completed'
    if (updatedTransaction.status === 'completed' && transaction.status !== 'completed') {
      try {
        const { sendTransactionEmail } = await import('@/lib/emailUtils');
        await sendTransactionEmail(updatedTransaction);
      } catch (emailError) {
        console.error('Error sending transaction completion email:', emailError);
        // Continue with the response even if email sending fails
      }
    }

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error(`API: Error updating transaction ${params.id}:`, error);
    return NextResponse.json(
      { error: 'Failed to update transaction', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
