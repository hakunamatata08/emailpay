"use client";

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EnvelopeSimple,
  PaperPlaneTilt,
  CurrencyEth,
  User,
  X,
  Paperclip,
  ImageSquare,
  SmileySticker,
  Clock,
  DotsThreeOutline,
  TrashSimple,
  AddressBook,
  CaretDown,
  CurrencyCircleDollar,
  Wallet,
  Warning,
  GasPump,
  ListBullets,
  FilePlus,
  ShieldCheck // Add this new icon for gasless transactions
} from "phosphor-react";
import { Button } from "@/components/ui/button";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getTokenBalance, PYUSDSepoliaAddress } from "@/lib/tokenUtils";
import { Contact } from "@/types/contact"; // Import contact type
import { Recipient } from "@/types/transaction"; // Import the Recipient type
import { createPermitSignature } from "@/lib/permitUtils"; // Import permit signature function
import { Switch } from "@/components/ui/switch"; // Import switch component for UI
import { createGaslessPermit } from "@/lib/gaslessUtils"; // Import our new gasless permit function

// Define interfaces for recipient chips
interface RecipientChip {
  name: string;
  email: string;
  photo?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading, getUserInfo, getAddress, provider, getPrivateKey } = useWeb3Auth();
  const { toast } = useToast();
  const [userName, setUserName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isClosingViaButton, setIsClosingViaButton] = useState(false);

  // Modified handler for dialog open state changes
  const handleDialogOpenChange = (open: boolean) => {
    // If trying to open the dialog, allow it
    if (open === true) {
      setIsOpen(true);
      return;
    }

    // If closing and it's via the close button, allow it
    if (open === false && isClosingViaButton) {
      setIsClosingViaButton(false);
      setIsOpen(false);
      return;
    }

    // If closing by clicking outside, prevent it
    // Do nothing to keep the dialog open
  };

  // Function to handle explicit close button clicks
  const handleCloseButtonClick = () => {
    setIsClosingViaButton(true);
    setIsOpen(false);
  };

  // Other states
  const [isTopupOpen, setIsTopupOpen] = useState(false); // New state for topup dialog
  const [toRecipients, setToRecipients] = useState<RecipientChip[]>([]);
  const [ccRecipients, setCcRecipients] = useState<RecipientChip[]>([]);
  const [bccRecipients, setBccRecipients] = useState<RecipientChip[]>([]);

  // New states for input values
  const [toInputValue, setToInputValue] = useState("");
  const [ccInputValue, setCcInputValue] = useState("");
  const [bccInputValue, setBccInputValue] = useState("");

  const [subject, setSubject] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState(""); // New state for message
  const [selectedToken, setSelectedToken] = useState("PYUSD");
  const [selectedNetwork, setSelectedNetwork] = useState("Ethereum Sepolia");
  const [isLoading_topup, setIsLoading_topup] = useState(false); // Loading state for topup
  const [walletAddress, setWalletAddress] = useState(""); // For storing wallet address
  const [tokenBalance, setTokenBalance] = useState("0"); // For storing token balance
  const [loadingBalance, setLoadingBalance] = useState(false); // Loading state for balance
  const [amountError, setAmountError] = useState(""); // New state for amount error
  const [activeSuggestionField, setActiveSuggestionField] = useState<'to' | 'cc' | 'bcc' | null>(null);
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const toSuggestionBoxRef = useRef<HTMLDivElement>(null);
  const ccSuggestionBoxRef = useRef<HTMLDivElement>(null);
  const bccSuggestionBoxRef = useRef<HTMLDivElement>(null);

  // Add a new state for enabling/disabling gasless transactions
  const [useGasless, setUseGasless] = useState(true);

  // Add a new state for form submission loading
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && !isAuthenticated) {
        router.push("/");
      } else if (isAuthenticated) {
        try {
          const info = await getUserInfo();
          if (info.name) {
            // Extract first name
            const firstName = info.name.split(" ")[0];
            setUserName(firstName);
          }
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }
    };

    checkAuth();
  }, [isLoading, isAuthenticated, router, getUserInfo]);

  // Check for query parameters and auto-open the modal with contact pre-filled
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const recipient = searchParams.get('recipient');
      const name = searchParams.get('name');

      if (recipient && name) {
        // Clear the URL parameters after reading them (for a cleaner UX)
        router.replace('/dashboard', { scroll: false });

        // Add the recipient to the toRecipients array (replacing any existing ones)
        setToRecipients([{
          name: name,
          email: recipient,
          // Without photo, it will use the default avatar
        }]);

        // Open the modal
        setIsOpen(true);

        // Show a toast notification
        toast({
          title: "Recipient Added",
          description: `${name} (${recipient}) has been added as a recipient.`,
          variant: "default",
        });
      }
    }
  }, [isAuthenticated, isLoading, searchParams, router, toast]);

  // Add validation function for amount using useCallback
  const validateAmount = useCallback((value: string) => {
    if (!value) {
      setAmountError("");
      return;
    }

    const numAmount = parseFloat(value);
    const numBalance = parseFloat(tokenBalance);

    // Only one recipient in the 'To' field will receive tokens
    const recipientCount = toRecipients.length > 0 ? 1 : 0;

    // If there are no recipients, check only the single amount
    if (recipientCount === 0) {
      if (numAmount > numBalance) {
        setAmountError(`Amount exceeds available balance (${numBalance.toFixed(2)} ${selectedToken})`);
      } else {
        setAmountError("");
      }
      return;
    }

    // Check if amount exceeds balance (always just for 1 recipient)
    if (numAmount > numBalance) {
      setAmountError(`Amount exceeds available balance (${numBalance.toFixed(2)} ${selectedToken})`);
    } else {
      setAmountError("");
    }
  }, [tokenBalance, selectedToken, toRecipients]);

  // Modify the amount change handler to include validation
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    validateAmount(value);
  };

  // Add function to handle PYUSD topup
  const handleTopupPYUSD = async () => {
    try {
      setIsLoading_topup(true);
      // Get user's wallet address
      const address = await getAddress();
      if (!address) {
        throw new Error("Could not retrieve wallet address");
      }

      // Make POST request to Paxos API
      const response = await fetch("https://api.sandbox.paxos.com/v2/treasury/faucet/transfers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: "PYUSD",
          network: "ETHEREUM",
          address: address
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to topup PYUSD");
      }

      const data = await response.json();

      // Show success toast
      toast({
        title: "PYUSD Topup Requested",
        description: "Your PYUSD topup has been successfully requested. It may take a few minutes to appear in your wallet.",
      });

      // Close dialog
      setIsTopupOpen(false);
    } catch (error) {
      console.error("Error in PYUSD topup:", error);
      // Show error toast
      toast({
        title: "Topup Failed",
        description: error instanceof Error ? error.message : "Failed to topup PYUSD. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading_topup(false);
    }
  };

  // Fetch wallet address when component loads
  useEffect(() => {
    const fetchWalletAddress = async () => {
      if (isAuthenticated && !isLoading) {
        try {
          const address = await getAddress();
          setWalletAddress(address);
        } catch (error) {
          console.error("Error fetching wallet address:", error);
        }
      }
    };

    fetchWalletAddress();
  }, [isAuthenticated, isLoading, getAddress]);

  // New effect to fetch token balance when the transaction modal opens
  useEffect(() => {
    const fetchTokenBalance = async () => {
      if (isAuthenticated && !isLoading && isOpen && provider) {
        try {
          setLoadingBalance(true);
          const balance = await getTokenBalance(provider);
          if (typeof balance === 'string') {
            setTokenBalance(balance);
          } else {
            console.error("Error fetching token balance:", balance);
            setTokenBalance("0");
          }
        } catch (error) {
          console.error("Error fetching token balance:", error);
          setTokenBalance("0");
        } finally {
          setLoadingBalance(false);
        }
      }
    };

    fetchTokenBalance();
  }, [isAuthenticated, isLoading, isOpen, provider]);

  // Separate effect to validate amount whenever amount or validateAmount changes
  useEffect(() => {
    if (amount) {
      validateAmount(amount);
    }
  }, [amount, validateAmount]);

  // Function to add a recipient chip
  const addRecipientChip = (field: 'to' | 'cc' | 'bcc', contact: Contact | null = null) => {
    let email = '';
    let name = '';
    let photo = undefined;

    if (contact) {
      // If a contact is provided, use its details
      email = contact.email;
      name = contact.name;
      photo = contact.photo;
    } else {
      // Otherwise use the current input value
      const inputValue = field === 'to' ? toInputValue : field === 'cc' ? ccInputValue : bccInputValue;

      // Simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputValue)) return;

      email = inputValue;
      name = inputValue.split('@')[0]; // Use part before @ as name if no contact
    }

    const newChip: RecipientChip = { name, email, photo };

    if (field === 'to') {
      // For 'to' field, replace existing recipients instead of adding
      setToRecipients([newChip]);
      setToInputValue("");
    } else if (field === 'cc') {
      setCcRecipients(prev => [...prev, newChip]);
      setCcInputValue("");
    } else if (field === 'bcc') {
      setBccRecipients(prev => [...prev, newChip]);
      setBccInputValue("");
    }

    // Clear suggestions after adding
    setSuggestions([]);
    setActiveSuggestionField(null);
  };

  // Function to remove a recipient chip
  const removeRecipientChip = (field: 'to' | 'cc' | 'bcc', index: number) => {
    if (field === 'to') {
      setToRecipients(prev => prev.filter((_, i) => i !== index));
    } else if (field === 'cc') {
      setCcRecipients(prev => prev.filter((_, i) => i !== index));
    } else if (field === 'bcc') {
      setBccRecipients(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handle key press in recipient fields (for comma and enter)
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, field: 'to' | 'cc' | 'bcc') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addRecipientChip(field);
    }
  };

  // Update handleEmailInputChange to use new input value states
  const handleEmailInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'to' | 'cc' | 'bcc') => {
    const value = e.target.value;

    // Update the appropriate state based on field
    if (field === 'to') {
      setToInputValue(value);
    } else if (field === 'cc') {
      setCcInputValue(value);
    } else if (field === 'bcc') {
      setBccInputValue(value);
    }

    // Search for contacts
    searchContacts(value, field);
  };

  // Update selectContact to add chip
  const selectContact = (contact: Contact) => {
    if (activeSuggestionField) {
      addRecipientChip(activeSuggestionField, contact);
    }
  };

  // Update handleSendCrypto to use EIP2612 flow
  const handleSendCrypto = async () => {
    try {
      // Set submitting state to true to show loading spinner
      setIsSubmitting(true);

      // Validate inputs
      if (toRecipients.length === 0) {
        toast({
          title: "Missing recipient",
          description: "Please add a recipient in the To field.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!subject) {
        toast({
          title: "Missing subject",
          description: "Please add a subject for your transaction.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid positive amount.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      if (amountError) {
        toast({
          title: "Amount error",
          description: amountError,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get user's wallet address
      const address = await getAddress();

      if (!address) {
        toast({
          title: "Authentication error",
          description: "Could not retrieve your wallet address. Please try again or reconnect your wallet.",
          variant: "destructive",
        });
        return;
      }

      // Create the base transaction data
      const mapRecipients = (recipients: RecipientChip[]): Recipient[] => {
        return recipients.map(r => ({
          name: r.name,
          email: r.email,
          photo: r.photo
        }));
      };

      let transactionData = {
        userAddress: address,
        toRecipients: mapRecipients(toRecipients),
        ccRecipients: mapRecipients(ccRecipients),
        bccRecipients: mapRecipients(bccRecipients),
        subject,
        amount,
        tokenType: selectedToken,
        network: selectedNetwork,
        message
      };

      // Add gasless transaction data if gasless is enabled
      if (useGasless) {
        // Show loading toast
        toast({
          title: "Setting up free transaction",
          description: "Preparing your transaction to be sent without fees...",
        });

        try {
          // For demo purposes, use a placeholder spender address
          // In a real implementation, you would use your relayer/backend address
          const spenderAddress = process.env.NEXT_PUBLIC_SPENDER_ADDRESS; // Replace with your actual backend address
          if (!spenderAddress) {
            throw new Error("Spender address is not defined");
          }
          // Get private key for EIP2612 direct signing
          const privateKey = await getPrivateKey();

          if (!privateKey) {
            throw new Error("Could not retrieve private key for transaction signing");
          }

          // Create gasless permit using private key
          const permitResult = await createGaslessPermit(
            privateKey,
            address,
            spenderAddress,
            amount,
            selectedToken === "PYUSD" ? PYUSDSepoliaAddress : undefined
          );

          if (permitResult instanceof Error) {
            throw permitResult;
          }

          // Add EIP2612 data to the transaction
          transactionData = {
            ...transactionData,
            isGasless: true,
            eip2612: permitResult
          };

          toast({
            title: "Ready to send",
            description: "Your free transaction is ready to be sent without any gas fees.",
          });
        } catch (error) {
          console.error("Error creating permit signature:", error);
          toast({
            title: "Error creating free transaction",
            description: error instanceof Error ? error.message : "Failed to set up free transaction.",
            variant: "destructive",
          });

          // Ask the user if they want to continue with a regular transaction
          if (!confirm("Failed to create free transaction. Would you like to continue with a regular transaction instead?")) {
            return;
          }

          // Continue with regular transaction
          setUseGasless(false);
        }
      }

      // API call to create transaction
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const transaction = await response.json();

      // Show success toast
      toast({
        title: "Transaction Created",
        description: "Your transaction has been submitted successfully and is now completed.",
      });

      console.log("Transaction created:", transaction);

      // Close the dialog
      setIsOpen(false);

      // Reset form
      setToRecipients([]);
      setCcRecipients([]);
      setBccRecipients([]);
      setToInputValue("");
      setCcInputValue("");
      setBccInputValue("");
      setSubject("");
      setAmount("");
      setMessage(""); // Reset message
      setSelectedToken("PYUSD");
      setSelectedNetwork("Ethereum Sepolia");
      setUseGasless(true); // Reset to default
    } catch (error) {
      console.error("Error sending transaction:", error);
      toast({
        title: "Transaction Failed",
        description: error instanceof Error ? error.message : "Failed to create transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset submitting state regardless of success or failure
      setIsSubmitting(false);
    }
  };

  // Handle Add to Draft
  const handleAddToDraft = async () => {
    try {
      // Set submitting state to true to show loading spinner
      setIsSubmitting(true);

      if (toRecipients.length === 0 && ccRecipients.length === 0 && bccRecipients.length === 0) {
        toast({
          title: "Missing recipients",
          description: "Please add at least one recipient.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get user's wallet address
      const address = await getAddress();

      if (!address) {
        toast({
          title: "Authentication error",
          description: "Could not retrieve your wallet address. Please try again or reconnect your wallet.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Convert recipient chips to the format expected by the API
      const mapRecipients = (recipients: RecipientChip[]): Recipient[] => {
        return recipients.map(r => ({
          name: r.name,
          email: r.email,
          photo: r.photo
        }));
      };

      // Prepare data for API call with draft flag
      const transactionData = {
        userAddress: address,
        toRecipients: mapRecipients(toRecipients),
        ccRecipients: mapRecipients(ccRecipients),
        bccRecipients: mapRecipients(bccRecipients),
        subject,
        amount: amount || "0", // Allow empty amount in draft
        tokenType: selectedToken,
        network: selectedNetwork,
        message,
        status: "draft" // Set status to draft
      };

      // API call to create draft transaction
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save draft');
      }

      const transaction = await response.json();

      // Show success toast
      toast({
        title: "Draft Saved",
        description: "Your transaction has been saved as a draft.",
      });

      console.log("Draft transaction created:", transaction);

      // Close the dialog
      setIsOpen(false);

      // Reset form
      setToRecipients([]);
      setCcRecipients([]);
      setBccRecipients([]);
      setToInputValue("");
      setCcInputValue("");
      setBccInputValue("");
      setSubject("");
      setAmount("");
      setMessage(""); // Reset message
      setSelectedToken("PYUSD");
      setSelectedNetwork("Ethereum Sepolia");
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Draft Saving Failed",
        description: error instanceof Error ? error.message : "Failed to save draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  };

  // Add function to search contacts
  const searchContacts = async (query: string, field: 'to' | 'cc' | 'bcc') => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setActiveSuggestionField(null);
      return;
    }

    try {
      setIsLoadingSuggestions(true);
      setActiveSuggestionField(field);

      const address = await getAddress();
      const response = await fetch(`/api/contacts/search?userAddress=${address}&query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }

      const contacts = await response.json();
      setSuggestions(contacts);
    } catch (error) {
      console.error('Error searching contacts:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const isOutsideToSuggestions = toSuggestionBoxRef.current && !toSuggestionBoxRef.current.contains(e.target as Node);
      const isOutsideCcSuggestions = ccSuggestionBoxRef.current && !ccSuggestionBoxRef.current.contains(e.target as Node);
      const isOutsideBccSuggestions = bccSuggestionBoxRef.current && !bccSuggestionBoxRef.current.contains(e.target as Node);

      if (isOutsideToSuggestions && isOutsideCcSuggestions && isOutsideBccSuggestions) {
        setSuggestions([]);
        setActiveSuggestionField(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // If still loading auth state or not authenticated, don't show dashboard yet
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin h-12 w-12 border-4 border-neon-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto"
      >
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg backdrop-blur-sm">
          <h1 className="text-4xl font-bold mb-2 gradient-text">
            Welcome back, {userName || "User"}!
          </h1>
          <p className="text-muted-foreground mb-8">
            Your gateway to simple crypto payments via email. Send crypto to anyone with just their email address.
          </p>

          <div className="flex flex-col md:flex-row gap-6 mb-12">
            <div className="flex-1 rounded-lg bg-gradient-to-br from-violet-500/10 to-pink-500/10 p-6 border border-violet-500/20 backdrop-blur-md">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-neon-purple to-neon-blue flex items-center justify-center mb-4">
                <PaperPlaneTilt weight="fill" className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Easy Transfers</h3>
              <p className="text-muted-foreground">
                Send cryptocurrency to anyone using just their email address - no complicated wallet addresses needed.
              </p>
            </div>

            <div className="flex-1 rounded-lg bg-gradient-to-br from-blue-500/10 to-teal-500/10 p-6 border border-blue-500/20 backdrop-blur-md">
              <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 flex items-center justify-center mb-4">
                <CurrencyEth weight="fill" className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">Simple & Secure</h3>
              <p className="text-muted-foreground">
                Your funds are secured with Web3Auth technology. Send and receive with confidence.
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Dialog open={isTopupOpen} onOpenChange={setIsTopupOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition">
                  <CurrencyCircleDollar weight="bold" className="mr-2 h-5 w-5" />
                  Topup PYUSD
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Topup PYUSD</DialogTitle>
                  <DialogDescription>
                    Receive test PYUSD tokens to your wallet from the Paxos sandbox faucet.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Wallet Address</span>
                    <div className="p-2 bg-muted rounded-md break-all text-sm">
                      {walletAddress || "Loading wallet address..."}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Token</span>
                    <div className="p-2 bg-muted rounded-md text-sm">PYUSD</div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium">Network</span>
                    <div className="p-2 bg-muted rounded-md text-sm">ETHEREUM</div>
                  </div>
                </div>

                <DialogFooter>
                  <Button onClick={handleTopupPYUSD} disabled={isLoading_topup} className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition">
                    {isLoading_topup ? "Processing..." : "Request PYUSD"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isOpen} onOpenChange={handleDialogOpenChange} modal={true}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition">
                  <EnvelopeSimple weight="bold" className="mr-2 h-5 w-5" />
                  New Cryptomail
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] p-0 sm:rounded-lg fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] bg-background border shadow-lg">
                <DialogTitle className="sr-only">Compose New Cryptomail</DialogTitle>

                {/* Add loading overlay */}
                {isSubmitting && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center">
                    <div className="w-[280px] flex flex-col items-center gap-4 bg-card/70 p-8 rounded-xl shadow-xl border border-border backdrop-blur-sm">
                      <div className="animate-spin h-14 w-14 border-4 border-neon-purple border-t-transparent rounded-full mb-2"></div>
                      <div className="text-center">
                        <h3 className="font-medium text-lg mb-2">Processing Transaction</h3>
                        <p className="text-sm text-muted-foreground">Please wait while we secure your cryptomail...</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-background border-b rounded-t-lg">
                  <div className="flex items-center justify-between p-4">
                    <h2 className="text-lg font-semibold">Compose New Cryptomail</h2>
                    <DialogClose
                      onClick={handleCloseButtonClick}
                      className="rounded-full hover:bg-accent p-2 transition-colors"
                      aria-label="Close dialog"
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Close</span>
                    </DialogClose>
                  </div>
                </div>

                <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(80vh - 60px)" }}>
                  <div className="mb-4 border-b pb-4">
                    <div className="flex items-center relative">
                      <span className="w-20 text-sm text-muted-foreground">To</span>
                      <div className="flex-1 min-h-10 flex flex-wrap items-center gap-1 border-0">
                        {toRecipients.map((recipient, index) => (
                          <div
                            key={`to-${index}`}
                            className="rounded-full bg-accent px-2 py-1 flex items-center gap-1 max-w-[200px]"
                          >
                            {recipient.photo ? (
                              <div
                                className="w-6 h-6 rounded-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${recipient.photo})` }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs text-primary font-medium">
                                  {recipient.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm truncate">{recipient.name}</span>
                            <button
                              type="button"
                              className="h-4 w-4 rounded-full hover:bg-accent-foreground/10 flex items-center justify-center"
                              onClick={() => removeRecipientChip('to', index)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <Input
                          type="email"
                          placeholder={toRecipients.length > 0 ? "Only one recipient allowed" : "Email address"}
                          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 flex-1 min-w-[100px]"
                          value={toInputValue}
                          onChange={(e) => handleEmailInputChange(e, 'to')}
                          onKeyDown={(e) => handleKeyDown(e, 'to')}
                          ref={toInputRef}
                          disabled={toRecipients.length > 0}
                        />
                      </div>
                      {activeSuggestionField === 'to' && suggestions.length > 0 && (
                        <div
                          ref={toSuggestionBoxRef}
                          className="absolute z-10 left-20 top-full w-[calc(100%-5rem)] mt-1 bg-background border rounded-md shadow-lg"
                        >
                          {isLoadingSuggestions ? (
                            <div className="p-2 text-sm text-center text-muted-foreground">Loading...</div>
                          ) : (
                            <ul className="py-1 max-h-60 overflow-auto">
                              {suggestions.map((contact) => (
                                <li
                                  key={contact._id?.toString()}
                                  className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center"
                                  onClick={() => selectContact(contact)}
                                >
                                  {contact.photo ? (
                                    <div
                                      className="w-8 h-8 rounded-full bg-cover bg-center mr-2"
                                      style={{ backgroundImage: `url(${contact.photo})` }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                                      <User className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-medium">{contact.name}</span>
                                    <span className="text-xs text-muted-foreground">{contact.email}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 border-b pb-4">
                    <div className="flex items-center relative">
                      <span className="w-20 text-sm text-muted-foreground">Cc</span>
                      <div className="flex-1 min-h-10 flex flex-wrap items-center gap-1 border-0">
                        {ccRecipients.map((recipient, index) => (
                          <div
                            key={`cc-${index}`}
                            className="rounded-full bg-accent px-2 py-1 flex items-center gap-1 max-w-[200px]"
                          >
                            {recipient.photo ? (
                              <div
                                className="w-6 h-6 rounded-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${recipient.photo})` }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs text-primary font-medium">
                                  {recipient.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm truncate">{recipient.name}</span>
                            <button
                              type="button"
                              className="h-4 w-4 rounded-full hover:bg-accent-foreground/10 flex items-center justify-center"
                              onClick={() => removeRecipientChip('cc', index)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <Input
                          type="email"
                          placeholder={ccRecipients.length > 0 ? "" : "Email address"}
                          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 flex-1 min-w-[100px]"
                          value={ccInputValue}
                          onChange={(e) => handleEmailInputChange(e, 'cc')}
                          onKeyDown={(e) => handleKeyDown(e, 'cc')}
                          ref={ccInputRef}
                        />
                      </div>
                      {activeSuggestionField === 'cc' && suggestions.length > 0 && (
                        <div
                          ref={ccSuggestionBoxRef}
                          className="absolute z-10 left-20 top-full w-[calc(100%-5rem)] mt-1 bg-background border rounded-md shadow-lg"
                        >
                          {isLoadingSuggestions ? (
                            <div className="p-2 text-sm text-center text-muted-foreground">Loading...</div>
                          ) : (
                            <ul className="py-1 max-h-60 overflow-auto">
                              {suggestions.map((contact) => (
                                <li
                                  key={contact._id?.toString()}
                                  className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center"
                                  onClick={() => selectContact(contact)}
                                >
                                  {contact.photo ? (
                                    <div
                                      className="w-8 h-8 rounded-full bg-cover bg-center mr-2"
                                      style={{ backgroundImage: `url(${contact.photo})` }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                                      <User className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-medium">{contact.name}</span>
                                    <span className="text-xs text-muted-foreground">{contact.email}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 border-b pb-4">
                    <div className="flex items-center relative">
                      <span className="w-20 text-sm text-muted-foreground">Bcc</span>
                      <div className="flex-1 min-h-10 flex flex-wrap items-center gap-1 border-0">
                        {bccRecipients.map((recipient, index) => (
                          <div
                            key={`bcc-${index}`}
                            className="rounded-full bg-accent px-2 py-1 flex items-center gap-1 max-w-[200px]"
                          >
                            {recipient.photo ? (
                              <div
                                className="w-6 h-6 rounded-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${recipient.photo})` }}
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs text-primary font-medium">
                                  {recipient.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <span className="text-sm truncate">{recipient.name}</span>
                            <button
                              type="button"
                              className="h-4 w-4 rounded-full hover:bg-accent-foreground/10 flex items-center justify-center"
                              onClick={() => removeRecipientChip('bcc', index)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        <Input
                          type="email"
                          placeholder={bccRecipients.length > 0 ? "" : "Email address"}
                          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 flex-1 min-w-[100px]"
                          value={bccInputValue}
                          onChange={(e) => handleEmailInputChange(e, 'bcc')}
                          onKeyDown={(e) => handleKeyDown(e, 'bcc')}
                          ref={bccInputRef}
                        />
                      </div>
                      {activeSuggestionField === 'bcc' && suggestions.length > 0 && (
                        <div
                          ref={bccSuggestionBoxRef}
                          className="absolute z-10 left-20 top-full w-[calc(100%-5rem)] mt-1 bg-background border rounded-md shadow-lg"
                        >
                          {isLoadingSuggestions ? (
                            <div className="p-2 text-sm text-center text-muted-foreground">Loading...</div>
                          ) : (
                            <ul className="py-1 max-h-60 overflow-auto">
                              {suggestions.map((contact) => (
                                <li
                                  key={contact._id?.toString()}
                                  className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center"
                                  onClick={() => selectContact(contact)}
                                >
                                  {contact.photo ? (
                                    <div
                                      className="w-8 h-8 rounded-full bg-cover bg-center mr-2"
                                      style={{ backgroundImage: `url(${contact.photo})` }}
                                    />
                                  ) : (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                                      <User className="h-4 w-4" />
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="font-medium">{contact.name}</span>
                                    <span className="text-xs text-muted-foreground">{contact.email}</span>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 border-b pb-4">
                    <div className="flex items-center">
                      <span className="w-20 text-sm text-muted-foreground">Subject</span>
                      <div className="flex-1 min-h-10 flex flex-wrap items-center gap-1 border-0">
                        <Input
                          type="text"
                          placeholder="Subject"
                          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 flex-1"
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 border-b pb-4">
                    <div className="flex items-center">
                      <span className="w-20 text-sm text-muted-foreground">Amount</span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 relative">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            className={`border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-10 ${amountError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                            value={amount}
                            onChange={handleAmountChange}
                          />
                        </div>

                        {/* Token Selection */}
                        <div className="relative min-w-[100px]">
                          <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-background cursor-pointer">
                            <span className="text-sm font-medium">{selectedToken}</span>
                            <CaretDown className="h-4 w-4 ml-1 text-muted-foreground" />
                          </div>
                          {/* We're not implementing the dropdown functionality fully since it's just one option */}
                        </div>

                        {/* Network Selection */}
                        <div className="relative min-w-[150px]">
                          <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-background cursor-pointer">
                            <span className="text-sm font-medium">{selectedNetwork}</span>
                            <CaretDown className="h-4 w-4 ml-1 text-muted-foreground" />
                          </div>
                          {/* We're not implementing the dropdown functionality fully since it's just one option */}
                        </div>
                      </div>
                    </div>

                    {/* Improved token balance display */}
                    <div className="ml-20 mt-2 mb-1">
                      <div className="text-xs bg-muted/20 border border-muted/30 text-muted-foreground px-2.5 py-1.5 rounded-md inline-flex items-center">
                        {loadingBalance ? (
                          <span className="flex items-center gap-1.5">
                            <div className="h-3 w-3 border-t-transparent border-2 border-gray-400 rounded-full animate-spin"></div>
                            Loading balance...
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                            Available: <span className="font-medium text-foreground">{parseFloat(tokenBalance).toFixed(2)} {selectedToken}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Error message for amount exceeding balance */}
                    {amountError && (
                      <div className="ml-20 mt-1">
                        <div className="text-xs text-red-500 flex items-center gap-1">
                          <Warning className="h-3.5 w-3.5" />
                          {amountError}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <Textarea
                      placeholder="Write a message..."
                      className="border rounded-md shadow-sm focus-visible:ring-1 focus-visible:ring-primary/50 min-h-[150px] resize-none w-full p-3"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  {/* Gasless Transactions section */}
                  <div className="flex items-center justify-between gap-4 rounded-lg border p-4 mb-6">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">Gasless Transactions</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Send tokens without paying any gas fees. This option saves you money by making transactions completely free.
                      </div>
                    </div>
                    <div>
                      <Switch
                        checked={useGasless}
                        onCheckedChange={setUseGasless}
                        aria-label="Toggle gasless transactions"
                      />
                    </div>
                  </div>

                  <div className="sticky bottom-0 bg-muted/80 backdrop-blur-sm p-4 rounded-md flex flex-wrap items-center gap-3 border-t">
                    <div className="flex flex-wrap gap-2 mr-auto">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
                        onClick={handleSendCrypto}
                        disabled={toRecipients.length === 0 || !amount || amountError !== "" || loadingBalance}
                      >
                        <PaperPlaneTilt weight="bold" className="mr-1.5 h-4 w-4" />
                        Send
                      </Button>
                      <Button
                        className="bg-gray-600 hover:bg-gray-700 text-white flex items-center"
                        onClick={handleAddToDraft}
                        disabled={toRecipients.length === 0 && ccRecipients.length === 0 && bccRecipients.length === 0}
                      >
                        <FilePlus weight="bold" className="mr-1.5 h-4 w-4" />
                        Save as Draft
                      </Button>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <GasPump className="mr-1 h-4 w-4" />
                      {useGasless ? (
                        <span className="text-green-500">No gas required</span>
                      ) : (
                        <span>Estimated gas: {toRecipients.length > 0 && amount ? '0.0001 ETH' : '0 ETH'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Link href="/contacts">
              <Button size="lg" variant="outline" className="border-neon-purple hover:bg-accent transition">
                <AddressBook weight="bold" className="mr-2 h-5 w-5 text-neon-purple" />
                My Contacts
              </Button>
            </Link>

            <Link href="/transactions">
              <Button size="lg" variant="outline" className="border-blue-500 hover:bg-accent transition">
                <ListBullets weight="bold" className="mr-2 h-5 w-5 text-blue-500" />
                Transactions
              </Button>
            </Link>

          </div>
        </div>
      </motion.div>
    </div>
  );
}
