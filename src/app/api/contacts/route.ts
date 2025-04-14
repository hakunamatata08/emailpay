import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { CreateContactRequest, UpdateContactRequest } from '@/types/contact';

// Create a new contact
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json() as CreateContactRequest;
    const { userAddress, name, email, photo } = requestData;

    // Basic validation
    if (!userAddress || !name || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress, name, and email are required' },
        { status: 400 }
      );
    }

    // Check if photo is empty string and convert to null
    const processedPhoto = photo && photo.trim() !== '' ? photo : null;

    // Check if photo exceeds max size (5MB)
    if (processedPhoto && Buffer.from(processedPhoto.split(',')[1] || '', 'base64').length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Photo exceeds maximum size of 5MB' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const now = new Date();
    const result = await db.collection('contacts').insertOne({
      userAddress,
      name,
      email,
      photo: processedPhoto,
      createdAt: now,
      updatedAt: now
    });

    return NextResponse.json({
      _id: result.insertedId,
      userAddress,
      name,
      email,
      photo: processedPhoto,
      createdAt: now,
      updatedAt: now
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}

// Get all contacts for a user
export async function GET(request: NextRequest) {
  try {
    const userAddress = request.nextUrl.searchParams.get('userAddress');
    console.log('API: GET /api/contacts - Received request for userAddress', userAddress ? userAddress.substring(0, 10) + '...' : 'null');

    if (!userAddress) {
      console.log('API: GET /api/contacts - userAddress parameter missing');
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();
    console.log('API: GET /api/contacts - Connected to database');

    const contacts = await db.collection('contacts')
      .find({ userAddress })
      .sort({ name: 1 })
      .toArray();

    console.log(`API: GET /api/contacts - Found ${contacts.length} contacts for user`);

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('API: Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Update an existing contact
export async function PUT(request: NextRequest) {
  try {
    const requestData = await request.json() as UpdateContactRequest;
    const { userAddress, contactId, name, email, photo } = requestData;

    // Basic validation
    if (!userAddress || !contactId) {
      return NextResponse.json(
        { error: 'Missing required fields: userAddress and contactId are required' },
        { status: 400 }
      );
    }

    // Check if at least one field to update is provided
    if (!name && !email && photo === undefined) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }

    // Process photo - convert empty string to null
    const processedPhoto = photo !== undefined ? (photo && photo.trim() !== '' ? photo : null) : undefined;

    // Check if photo exceeds max size (5MB)
    if (processedPhoto && Buffer.from(processedPhoto.split(',')[1] || '', 'base64').length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Photo exceeds maximum size of 5MB' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Build the update document with only the fields that were provided
    const updateData: Record<string, string | Date | null> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (processedPhoto !== undefined) updateData.photo = processedPhoto;

    const result = await db.collection('contacts').updateOne(
      { _id: new ObjectId(contactId), userAddress },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Contact not found or not authorized to update' },
        { status: 404 }
      );
    }

    // Fetch the updated contact
    const updatedContact = await db.collection('contacts').findOne({
      _id: new ObjectId(contactId),
      userAddress
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// Delete a contact
export async function DELETE(request: NextRequest) {
  try {
    const userAddress = request.nextUrl.searchParams.get('userAddress');
    const contactId = request.nextUrl.searchParams.get('contactId');

    if (!userAddress || !contactId) {
      return NextResponse.json(
        { error: 'userAddress and contactId are required' },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection('contacts').deleteOne({
      _id: new ObjectId(contactId),
      userAddress
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Contact not found or not authorized to delete' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
