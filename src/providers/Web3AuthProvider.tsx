"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, IProvider, WALLET_ADAPTERS, UX_MODE } from "@web3auth/base";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import ethersRPC from "@/lib/ethersRPC";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { AuthAdapter } from "@web3auth/auth-adapter";

// User info interface
interface UserInfo {
  email?: string;
  name?: string;
  profileImage?: string;
  verifier?: string;
  verifierId?: string;
  typeOfLogin?: string;
  aggregateVerifier?: string;
  dappShare?: string;
  idToken?: string;
  oAuthIdToken?: string;
  oAuthAccessToken?: string;
}

// Create context
interface Web3AuthContextType {
  web3auth: Web3Auth | null;
  provider: IProvider | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  getUserInfo: () => Promise<UserInfo>;
  getAddress: () => Promise<string>;
  getPrivateKey: () => Promise<string>; // Add the getPrivateKey function
}

const Web3AuthContext = createContext<Web3AuthContextType>({
  web3auth: null,
  provider: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  getUserInfo: async () => ({}),
  getAddress: async () => "",
  getPrivateKey: async () => "", // Add default implementation
});

// Constants
// Use environment variable instead of hardcoded client ID
const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID || ""; // Get from https://dashboard.web3auth.io

// Provider component
export const Web3AuthProvider = ({ children }: { children: ReactNode }) => {
  const [web3auth, setWeb3auth] = useState<Web3AuthNoModal | null>(null);
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // Configure Web3Auth
        const privateKeyProvider = new EthereumPrivateKeyProvider({
          config: {
            chainConfig: {
              chainNamespace: CHAIN_NAMESPACES.EIP155,
              chainId: "0xaa36a7", // Ethereum mainnet
              rpcTarget: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
              displayName: "Ethereum Sepolia Testnet",
              blockExplorer: "https://sepolia.etherscan.io",
              ticker: "ETH",
              tickerName: "Ethereum",
              logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
            },
          },
        });

        const web3auth = new Web3AuthNoModal({
          clientId,
          useCoreKitKey: true,
          privateKeyProvider,
          web3AuthNetwork: "sapphire_devnet", // "sapphire_mainnet" for production
          uiConfig: {
            theme: "dark",
            loginMethodsOrder: ["google"],
            appLogo: "/logo.svg", // Your app logo
          },
        });

        const authAdapter = new AuthAdapter({
          loginSettings: {
            mfaLevel: "optional",
          },
          adapterSettings: {
            uxMode: UX_MODE.REDIRECT,
            mfaSettings: {
              deviceShareFactor: {
                enable: true,
                priority: 1,
                mandatory: true,
              },
              backUpShareFactor: {
                enable: true,
                priority: 2,
                mandatory: false,
              },
              socialBackupFactor: {
                enable: true,
                priority: 3,
                mandatory: false,
              },
              passwordFactor: {
                enable: true,
                priority: 4,
                mandatory: true,
              },
            },
            loginConfig: {
              google: {
                verifier: "emailpay_test_demo",
                typeOfLogin: "google",
                clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID, //use your app client id you got from google
              },
            },
          },
        });
        web3auth.configureAdapter(authAdapter);
        setWeb3auth(web3auth);

        await web3auth.init();

        setProvider(web3auth.provider);

        if (web3auth.connected) {
          setIsAuthenticated(true);
        }

      } catch (error) {
        console.error("Error initializing Web3Auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }
    const web3authProvider = await web3auth.connectTo(WALLET_ADAPTERS.AUTH, {
      loginProvider: "google",
    });
    setProvider(web3authProvider);
    setIsAuthenticated(true);
  };


  // Logout function
  const logout = async () => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return;
    }
    try {
      await web3auth.logout();
      setProvider(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Get user info
  const getUserInfo = async (): Promise<UserInfo> => {
    if (!web3auth) {
      console.error("Web3Auth not initialized");
      return {};
    }
    try {
      const user = await web3auth.getUserInfo();
      return user as UserInfo;
    } catch (error) {
      console.error("Error getting user info:", error);
      return {};
    }
  };

  // Get wallet address using ethersRPC utility
  const getAddress = async (): Promise<string> => {
    if (!provider) {
      console.error("Provider not initialized");
      return "";
    }
    try {
      const address = await ethersRPC.getAccounts(provider);
      if (address instanceof Error) {
        console.error("Error getting address:", address.message);
        return "";
      }
      return address;
    } catch (error) {
      console.error("Error getting address:", error);
      return "";
    }
  };

  // Get private key function
  const getPrivateKey = async (): Promise<string> => {
    if (!provider) {
      console.error("Provider not initialized");
      return "";
    }
    try {
      const privateKey = await provider.request({
        method: "eth_private_key",
      });
      return privateKey as string;
    } catch (error) {
      console.error("Error getting private key:", error);
      return "";
    }
  };

  const value = {
    web3auth,
    provider,
    isLoading,
    isAuthenticated,
    login,
    logout,
    getUserInfo,
    getAddress,
    getPrivateKey, // Add the function to the context value
  };

  return <Web3AuthContext.Provider value={value}>{children}</Web3AuthContext.Provider>;
};

// Hook to use the Web3Auth context
export const useWeb3Auth = () => useContext(Web3AuthContext);
