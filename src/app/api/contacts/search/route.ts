import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const userAddress = request.nextUrl.searchParams.get('userAddress');
    const query = request.nextUrl.searchParams.get('query');

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: 'query parameter is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Use regex to find contacts where name OR email contains the query string (case-insensitive)
    const contacts = await db.collection('contacts')
      .find({
        userAddress,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(10) // Limit results to 10 contacts
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error searching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to search contacts' },
      { status: 500 }
    );
  }
}
