"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  EnvelopeSimple,
  List,
  X,
  Lightning,
  Globe,
  SignOut,
  User,
  AddressBook,
  Copy,
  Key, // Add Key icon for private key button
  Warning
} from "phosphor-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/ui/notification-bell";

export default function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { login, logout, isAuthenticated, isLoading, getUserInfo, web3auth, getPrivateKey } = useWeb3Auth();
  const [userInfo, setUserInfo] = useState<{ email?: string; profileImage?: string; name?: string }>({});
  const [walletAddress, setWalletAddress] = useState("");
  const [redirecting, setRedirecting] = useState(false);
  // Add private key state
  const [isPrivateKeyOpen, setIsPrivateKeyOpen] = useState(false);
  const [privateKey, setPrivateKey] = useState("");
  const [fetchingPrivateKey, setFetchingPrivateKey] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (isAuthenticated) {
        try {
          const info = await getUserInfo();
          setUserInfo(info);

          // Get wallet address if web3auth is available
          if (web3auth && web3auth.provider) {
            try {
              const accounts = await web3auth.provider.request({ method: "eth_accounts" });
              if (accounts && accounts.length > 0) {
                setWalletAddress(accounts[0]);
              }
            } catch (error) {
              console.error("Error getting wallet address:", error);
            }
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }
    };

    fetchUserData();
  }, [isAuthenticated, getUserInfo, web3auth]);

  const handleAuthClick = async () => {
    if (isLoading || redirecting) return;

    if (isAuthenticated) {
      try {
        await logout();
        router.push("/");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    } else {
      setRedirecting(true);
      try {
        await login();
        router.push("/dashboard");
      } catch (error) {
        console.error("Error logging in:", error);
        setRedirecting(false);
      }
    }
  };

  // Function to format wallet address
  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
  };

  // Function to copy wallet address to clipboard
  const copyToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress)
        .then(() => {
          toast({
            title: "Address copied!",
            description: "Wallet address copied to clipboard",
            duration: 2000,
          });
        })
        .catch((error) => {
          console.error("Error copying to clipboard:", error);
          toast({
            title: "Copy failed",
            description: "Failed to copy address to clipboard",
            variant: "destructive",
            duration: 2000,
          });
        });
    }
  };

  // Add function to handle showing private key
  const handleShowPrivateKey = async () => {
    try {
      setFetchingPrivateKey(true);
      const key = await getPrivateKey();
      setPrivateKey(key);
      setIsPrivateKeyOpen(true);
    } catch (error) {
      console.error("Error fetching private key:", error);
      toast({
        title: "Error",
        description: "Could not retrieve your private key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFetchingPrivateKey(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-lg border-b border-violet-100/20 dark:border-violet-900/20">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-8 h-8 neon-glow">
            <div className="absolute inset-0 bg-gradient-to-br from-neon-pink to-neon-purple rounded-lg"></div>
            <EnvelopeSimple weight="fill" className="relative text-white w-8 h-8 p-1.5" />
          </div>
          <span className="font-display text-xl font-bold gradient-text">EmailPay</span>
        </Link>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />

          {isAuthenticated && <NotificationBell />}

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userInfo.profileImage} alt={userInfo.name || "User"} />
                      <AvatarFallback className="bg-gradient-to-r from-neon-purple to-neon-blue">
                        <User className="h-4 w-4 text-white" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{userInfo.name || "User"}</div>
                    <div className="text-xs text-muted-foreground truncate">{userInfo.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">Wallet Address</div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground font-mono">{formatAddress(walletAddress)}</div>
                      <button
                        onClick={copyToClipboard}
                        className="p-1 hover:bg-accent rounded-full transition-colors"
                        aria-label="Copy wallet address to clipboard"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard" className="px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-accent rounded-sm cursor-pointer">
                    <EnvelopeSimple className="h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link href="/contacts" className="px-2 py-1.5 text-sm flex items-center gap-2 hover:bg-accent rounded-sm cursor-pointer">
                    <AddressBook className="h-4 w-4" />
                    <span>My Contacts</span>
                  </Link>
                  <DropdownMenuItem className="cursor-pointer" onClick={handleShowPrivateKey}>
                    <Key className="mr-2 h-4 w-4 text-amber-500" />
                    <span>Show Private Key</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleAuthClick} className="cursor-pointer">
                    <SignOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button
              className="bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition"
              onClick={handleAuthClick}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : "Sign In"}
            </Button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && <NotificationBell />}
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X weight="bold" className="w-6 h-6" />
            ) : (
              <List weight="bold" className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-16 left-0 right-0 bg-background border-b border-violet-100/20 dark:border-violet-900/20 p-4 md:hidden z-50"
            >
              <nav className="flex flex-col space-y-4 py-4">
                {isAuthenticated && (
                  <>
                    <div className="flex items-center space-x-4 p-2 border rounded-md">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={userInfo.profileImage} alt={userInfo.name || "User"} />
                        <AvatarFallback className="bg-gradient-to-r from-neon-purple to-neon-blue">
                          <User className="h-5 w-5 text-white" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{userInfo.name || "User"}</span>
                        <span className="text-xs text-muted-foreground truncate">{userInfo.email}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground font-mono truncate">{formatAddress(walletAddress)}</span>
                          <button
                            onClick={copyToClipboard}
                            className="p-0.5 hover:bg-accent rounded-full transition-colors"
                            aria-label="Copy wallet address to clipboard"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <EnvelopeSimple className="h-5 w-5" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/contacts"
                      className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <AddressBook className="h-5 w-5" />
                      <span>My Contacts</span>
                    </Link>
                    <button
                      onClick={handleShowPrivateKey}
                      className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 transition-colors w-full text-left"
                    >
                      <Key className="h-5 w-5 text-amber-500" />
                      <span>Show Private Key</span>
                    </button>
                  </>
                )}
                <div className="pt-4">
                  <Button
                    className="w-full bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition"
                    onClick={handleAuthClick}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="inline-flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </span>
                    ) : isAuthenticated ? "Sign Out" : "Sign In"}
                  </Button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Private Key Dialog */}
      <Dialog open={isPrivateKeyOpen} onOpenChange={setIsPrivateKeyOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Your Private Key</DialogTitle>
            <DialogDescription>
              This is your private key. Never share it with anyone. Anyone with access to this key has complete control over your funds.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Private Key</span>
              {fetchingPrivateKey ? (
                <div className="p-4 bg-muted rounded-md flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-neon-purple border-t-transparent rounded-full mr-2"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="p-3 bg-muted rounded-md break-all text-sm font-mono overflow-auto max-h-[150px]">
                  {privateKey}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center p-3 bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-md">
              <Warning className="h-5 w-5 mr-2 flex-shrink-0" />
              <span className="text-sm">Warning: Never share your private key with anyone or enter it on any website.</span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPrivateKeyOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
