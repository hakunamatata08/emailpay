/**
 * Utility functions for wallet operations
 */

// Constants for Web3Auth configuration
// These should be moved to environment variables in a production environment
const WEB3AUTH_VERIFIER = 'emailpay_test_demo'; // Your verifier name from Web3Auth dashboard
const WEB3AUTH_NETWORK = 'sapphire_devnet'; // For production, use 'sapphire_mainnet'
const WEB3AUTH_CLIENT_ID = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || 'BIk218ZjrYYRX4OGd9Q8SsmpHaIMSz6Uqwo7ZX8BnqScP4VQFmi8D7UFeY4RhUV8GUYoSDSo-_38cdHE78QGlbY';

/**
 * Calls the Web3Auth wallet pregeneration API to get a wallet address for a user
 * @param email Email address to generate wallet for
 * @returns The generated wallet address or null if an error occurred
 */
export async function pregenerateWallet(email: string): Promise<string | null> {
  try {
    // Construct the API URL with query parameters
    const url = new URL('https://lookup.web3auth.io/lookup');
    url.searchParams.append('verifier', WEB3AUTH_VERIFIER);
    url.searchParams.append('verifierId', email);
    url.searchParams.append('web3AuthNetwork', WEB3AUTH_NETWORK);
    url.searchParams.append('clientId', WEB3AUTH_CLIENT_ID);

    // Call the API
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    // Parse the response
    if (!response.ok) {
      console.error('Failed to call wallet pregeneration API:', await response.text());
      return null;
    }

    const data = await response.json();

    if (data.success && data.data.walletAddress) {
      return data.data.walletAddress;
    } else {
      console.error('No wallet address returned from API:', data);
      return null;
    }
  } catch (error) {
    console.error('Error calling wallet pregeneration API:', error);
    return null;
  }
}
