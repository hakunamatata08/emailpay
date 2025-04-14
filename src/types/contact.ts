import { ObjectId } from 'mongodb';

export interface Contact {
  _id?: ObjectId;
  userAddress: string; // wallet address of the user who is logged in
  name: string;
  email: string;
  photo?: string; // base64URL, max 5MB in size
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactRequest {
  userAddress: string;
  name: string;
  email: string;
  photo?: string;
}

export interface UpdateContactRequest {
  userAddress: string;
  contactId: string;
  name?: string;
  email?: string;
  photo?: string;
}

export interface DeleteContactRequest {
  userAddress: string;
  contactId: string;
}

export interface GetContactsRequest {
  userAddress: string;
}
