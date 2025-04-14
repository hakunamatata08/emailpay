/**
 * TypeScript definitions for Ethereum provider types
 * These will help avoid ESLint errors related to 'any' types
 */

/**
 * Type for ethereum provider method parameters
 */
export type ProviderMethodParams = unknown[] | Record<string, unknown>;

/**
 * Type for ethereum provider request arguments
 */
export interface ProviderRequestArgs {
  method: string;
  params?: ProviderMethodParams;
}

/**
 * Type for ethereum provider
 */
export interface EthereumProvider {
  request: (args: ProviderRequestArgs) => Promise<unknown>;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  [key: string]: unknown;
}
