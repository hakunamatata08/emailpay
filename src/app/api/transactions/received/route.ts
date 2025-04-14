import { NextRequest, NextResponse } from "next/server";
import clientPromise from '@/lib/mongodb';
import { ObjectId } from "mongodb";

/**
 * API endpoint to fetch transactions where the user is a recipient
 * GET /api/transactions/received?recipientAddress=0x123...
 */
export async function GET(request: NextRequest) {
  // Get the recipient address from the query params
  const searchParams = request.nextUrl.searchParams;
  const recipientAddress = searchParams.get("recipientAddress");
  const status = searchParams.get("status");

  // Validate inputs
  if (!recipientAddress) {
    return NextResponse.json(
      { error: "Recipient address is required" },
      { status: 400 }
    );
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    // Build the query
    const query: any = {
      "toRecipients.address": recipientAddress
    };

    // Add status filter if provided
    if (status && status !== "all") {
      query.status = status;
    }

    // Find transactions where the user is a recipient
    const transactions = await db
      .collection("transactions")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Convert ObjectId to string for proper serialization
    const formattedTransactions = transactions.map(tx => ({
      ...tx,
      _id: tx._id.toString()
    }));

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error("Error fetching received transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch received transactions" },
      { status: 500 }
    );
  }
}
