import { MongoClient } from 'mongodb';

// Use hardcoded value instead of environment variable
const uri = process.env.MONGODB_URI;
const options = {};

if (!uri) {
  console.error('MongoDB URI not defined');
  throw new Error('MongoDB URI is missing');
}

console.log('MongoDB: Initializing connection with URI prefix:', uri.split('@')[0].substring(0, 20) + '...');

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect()
      .then(client => {
        console.log('MongoDB: Successfully connected to database');
        return client;
      })
      .catch(err => {
        console.error('MongoDB: Failed to connect to database', err);
        throw err;
      });
  } else {
    console.log('MongoDB: Using existing connection from global variable');
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect()
    .then(client => {
      console.log('MongoDB: Successfully connected to database');
      return client;
    })
    .catch(err => {
      console.error('MongoDB: Failed to connect to database', err);
      throw err;
    });
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
