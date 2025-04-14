import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { Transaction } from '@/types/transaction';

export async function GET(request: NextRequest) {
  try {
    const userAddress = request.nextUrl.searchParams.get('userAddress');
    const query = request.nextUrl.searchParams.get('query');
    const status = request.nextUrl.searchParams.get('status') as Transaction['status'] | null;

    console.log('API: GET /api/transactions/search - Received request for userAddress',
      userAddress ? userAddress.substring(0, 10) + '...' : 'null',
      'query:', query || 'none',
      'status:', status || 'all');

    if (!userAddress) {
      console.log('API: GET /api/transactions/search - userAddress parameter missing');
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    console.log('API: GET /api/transactions/search - Connected to database');

    // Build the search query
    const searchCriteria: Record<string, unknown> = { userAddress };

    // Add status filter if provided
    if (status) {
      searchCriteria.status = status;
    }

    // Add text search if query provided
    if (query && query.trim() !== '') {
      // We'll search in subject, message, and recipient emails/names
      const searchQuery = query.trim();

      searchCriteria.$or = [
        { subject: { $regex: searchQuery, $options: 'i' } },
        { message: { $regex: searchQuery, $options: 'i' } },
        { 'toRecipients.email': { $regex: searchQuery, $options: 'i' } },
        { 'toRecipients.name': { $regex: searchQuery, $options: 'i' } },
        { 'ccRecipients.email': { $regex: searchQuery, $options: 'i' } },
        { 'ccRecipients.name': { $regex: searchQuery, $options: 'i' } },
        { 'bccRecipients.email': { $regex: searchQuery, $options: 'i' } },
        { 'bccRecipients.name': { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const transactions = await db.collection('transactions')
      .find(searchCriteria)
      .sort({ createdAt: -1 }) // Sort by creation date, newest first
      .limit(50) // Limit to 50 results
      .toArray();

    console.log(`API: GET /api/transactions/search - Found ${transactions.length} transactions for query`);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('API: Error searching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to search transactions', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
