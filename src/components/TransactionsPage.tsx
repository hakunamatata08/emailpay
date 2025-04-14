"use client";

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Transaction, Recipient } from "@/types/transaction";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  EnvelopeSimple,
  Clock,
  CheckCircle,
  XCircle,
  Spinner,
  MagnifyingGlass,
  CaretDown,
  User,
  FileText,
  PaperPlaneTilt,
  X,
  CurrencyEth,
  Warning,
  GasPump,
  Wallet,
  CurrencyCircleDollar,
  FilePlus,
  ShieldCheck
} from "phosphor-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import Link from "next/link";
import { getTokenBalance, PYUSDSepoliaAddress } from "@/lib/tokenUtils";
import { createGaslessPermit } from "@/lib/gaslessUtils";
import { Contact } from "@/types/contact";

// Define interfaces for recipient chips (same as in Dashboard)
interface RecipientChip {
  name: string;
  email: string;
  photo?: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, getAddress, provider, getPrivateKey, getUserInfo } = useWeb3Auth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<Transaction["status"] | "all">("all");

  // States for the crypto mail modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosingViaButton, setIsClosingViaButton] = useState(false);
  const [selectedDraftTransaction, setSelectedDraftTransaction] = useState<Transaction | null>(null);
  const [toRecipients, setToRecipients] = useState<RecipientChip[]>([]);
  const [ccRecipients, setCcRecipients] = useState<RecipientChip[]>([]);
  const [bccRecipients, setBccRecipients] = useState<RecipientChip[]>([]);
  const [toInputValue, setToInputValue] = useState("");
  const [ccInputValue, setCcInputValue] = useState("");
  const [bccInputValue, setBccInputValue] = useState("");
  const [subject, setSubject] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [selectedToken, setSelectedToken] = useState("PYUSD");
  const [selectedNetwork, setSelectedNetwork] = useState("Ethereum Sepolia");
  const [amountError, setAmountError] = useState("");
  const [tokenBalance, setTokenBalance] = useState("0");
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useGasless, setUseGasless] = useState(true);
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);
  const [activeSuggestionField, setActiveSuggestionField] = useState<'to' | 'cc' | 'bcc' | null>(null);
  const [suggestions, setSuggestions] = useState<Contact[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const toSuggestionBoxRef = useRef<HTMLDivElement>(null);
  const ccSuggestionBoxRef = useRef<HTMLDivElement>(null);
  const bccSuggestionBoxRef = useRef<HTMLDivElement>(null);

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

  // Handle email input changes
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

  // Select a contact
  const selectContact = (contact: Contact) => {
    if (activeSuggestionField) {
      addRecipientChip(activeSuggestionField, contact);
    }
  };

  // Function to search contacts
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

  // Modified handler for dialog open state changes
  const handleDialogOpenChange = (open: boolean) => {
    // If trying to open the dialog, allow it
    if (open === true) {
      setIsModalOpen(true);
      return;
    }

    // If closing and it's via the close button, allow it
    if (open === false && isClosingViaButton) {
      setIsClosingViaButton(false);
      setIsModalOpen(false);
      return;
    }

    // If closing by clicking outside, prevent it
    // Do nothing to keep the dialog open
  };

  // Function to handle explicit close button clicks
  const handleCloseButtonClick = () => {
    setIsClosingViaButton(true);
    setIsModalOpen(false);
  };

  // Fetch transactions when component mounts
  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && !isAuthenticated) {
        router.push("/");
      } else if (isAuthenticated) {
        await fetchTransactions();
      }
    };

    checkAuth();
  }, [isLoading, isAuthenticated, router, statusFilter]);

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setIsLoadingTransactions(true);
      const address = await getAddress();

      if (!address) {
        toast({
          title: "Authentication error",
          description: "Could not retrieve your wallet address. Please try again or reconnect your wallet.",
          variant: "destructive",
        });
        return;
      }

      // Build the API URL with parameters
      let url = `/api/transactions?userAddress=${address}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transactions");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast({
        title: "Failed to load transactions",
        description: error instanceof Error ? error.message : "Could not load your transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Handle search
  const handleSearch = async () => {
    try {
      setIsLoadingTransactions(true);
      const address = await getAddress();

      if (!address) {
        toast({
          title: "Authentication error",
          description: "Could not retrieve your wallet address. Please try again or reconnect your wallet.",
          variant: "destructive",
        });
        return;
      }

      // Build the search URL with parameters
      let url = `/api/transactions/search?userAddress=${address}&query=${encodeURIComponent(searchQuery)}`;
      if (statusFilter !== "all") {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to search transactions");
      }

      const data = await response.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error searching transactions:", error);
      toast({
        title: "Search failed",
        description: error instanceof Error ? error.message : "Could not search transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Function to reset form fields
  const resetForm = () => {
    setToRecipients([]);
    setCcRecipients([]);
    setBccRecipients([]);
    setToInputValue("");
    setCcInputValue("");
    setBccInputValue("");
    setSubject("");
    setAmount("");
    setMessage("");
    setSelectedToken("PYUSD");
    setSelectedNetwork("Ethereum Sepolia");
    setUseGasless(true);
    setSelectedDraftTransaction(null);
  };

  // Function to load a draft transaction when "Send" is clicked
  const loadDraftTransaction = async (transaction: Transaction) => {
    try {
      setIsLoadingTransactions(true);

      // Set selected draft
      setSelectedDraftTransaction(transaction);

      // Convert recipients to RecipientChip format
      const mapRecipientsToChips = (recipients: Recipient[]): RecipientChip[] => {
        return recipients.map(r => ({
          name: r.name,
          email: r.email,
          photo: r.photo
        }));
      };

      // Populate form with transaction data
      setToRecipients(mapRecipientsToChips(transaction.toRecipients));
      setCcRecipients(mapRecipientsToChips(transaction.ccRecipients || []));
      setBccRecipients(mapRecipientsToChips(transaction.bccRecipients || []));
      setSubject(transaction.subject);
      setAmount(transaction.amount);
      setMessage(transaction.message || "");
      setSelectedToken(transaction.tokenType);
      setSelectedNetwork(transaction.network);

      // Fetch token balance for validation
      if (provider) {
        setLoadingBalance(true);
        try {
          const balance = await getTokenBalance(provider);
          if (typeof balance === 'string') {
            setTokenBalance(balance);
          } else {
            setTokenBalance("0");
          }
        } catch (error) {
          console.error("Error fetching token balance:", error);
          setTokenBalance("0");
        } finally {
          setLoadingBalance(false);
        }
      }

      // Open the modal
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading draft transaction:", error);
      toast({
        title: "Error",
        description: "Failed to load draft transaction details.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Effect to validate amount when amount or validateAmount changes
  useEffect(() => {
    if (amount) {
      validateAmount(amount);
    }
  }, [amount, validateAmount]);

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

  // Function to send crypto transaction (adapted from Dashboard)
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
            setIsSubmitting(false);
            return;
          }

          // Continue with regular transaction
          setUseGasless(false);
        }
      }

      // If this is updating a draft, use the draft's ID and PATCH method
      let response;
      if (selectedDraftTransaction && selectedDraftTransaction._id) {
        response = await fetch(`/api/transactions/${selectedDraftTransaction._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...transactionData,
            status: 'pending'  // Update status from draft to pending
          }),
        });
      } else {
        // Otherwise, create a new transaction
        response = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      const transaction = await response.json();

      // Show success toast
      toast({
        title: "Transaction Created",
        description: "Your transaction has been submitted successfully and is now being processed.",
      });

      console.log("Transaction created:", transaction);

      // Close the dialog
      setIsModalOpen(false);

      // Reset form
      resetForm();

      // Refresh transactions list
      await fetchTransactions();
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status icon
  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "draft":
        return <FileText className="h-5 w-5 text-blue-500" />;
      default:
        return null;
    }
  };

  // Get status label
  const getStatusLabel = (status: Transaction["status"]) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      case "draft":
        return "Draft";
      default:
        return "Unknown";
    }
  };

  // Handle sending a draft transaction
  const handleSendDraft = async (transactionId: string) => {
    try {
      setIsLoadingTransactions(true);
      const address = await getAddress();

      if (!address) {
        toast({
          title: "Authentication error",
          description: "Could not retrieve your wallet address. Please try again or reconnect your wallet.",
          variant: "destructive",
        });
        return;
      }

      // Fetch the draft transaction details
      const response = await fetch(`/api/transactions/${transactionId}?userAddress=${address}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch transaction details");
      }

      const transaction = await response.json();

      // Load the transaction into the modal form
      await loadDraftTransaction(transaction);

    } catch (error) {
      console.error("Error preparing draft transaction:", error);
      toast({
        title: "Failed to prepare transaction",
        description: error instanceof Error ? error.message : "Could not prepare your transaction for sending. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // If still loading auth state or not authenticated, don't show dashboard yet
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin h-12 w-12 border-4 border-neon-purple border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Modified render to include the modal
  return (
    <div className="min-h-[80vh] container py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto"
      >
        <div className="bg-card border border-border rounded-xl p-8 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold gradient-text">My Transactions</h1>
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 min-w-[140px]">
                  {statusFilter === "all" ? "All Statuses" : getStatusLabel(statusFilter)}
                  <CaretDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                  All Statuses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
                  <Clock className="mr-2 h-4 w-4 text-yellow-500" /> Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("completed")}>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("failed")}>
                  <XCircle className="mr-2 h-4 w-4 text-red-500" /> Failed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                  <FileText className="mr-2 h-4 w-4 text-blue-500" /> Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleSearch}>
              <MagnifyingGlass className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>

          {/* Transactions Table */}
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center">
                <div className="animate-spin h-12 w-12 border-4 border-neon-purple border-t-transparent rounded-full mb-4"></div>
                <p className="text-muted-foreground">Loading transactions...</p>
              </div>
            </div>
          ) : transactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Recipients</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction._id?.toString()}>
                      <TableCell className="font-medium">
                        {formatDate(transaction.createdAt.toString())}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center">
                            {transaction.toRecipients.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">To:</span>
                                <div className="flex items-center">
                                  {transaction.toRecipients[0].name}
                                  {transaction.toRecipients.length > 1 && (
                                    <span className="text-xs ml-1 text-muted-foreground">
                                      +{transaction.toRecipients.length - 1} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          {transaction.ccRecipients.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>Cc:</span>
                              <span>{transaction.ccRecipients.length} recipients</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{transaction.subject}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{transaction.amount}</span>
                          <span className="text-xs text-muted-foreground">{transaction.tokenType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(transaction.status)}
                          <span>{getStatusLabel(transaction.status)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {transaction.status === "draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1 text-blue-500 hover:text-blue-600 hover:bg-blue-50 border-blue-200"
                              onClick={() => handleSendDraft(transaction._id?.toString() || "")}
                            >
                              <PaperPlaneTilt className="h-4 w-4" />
                              Send
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/transactions/${transaction._id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 text-center">
              <EnvelopeSimple className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-6">
                You haven't made any transactions yet or none match your search criteria.
              </p>
              <Link href="/dashboard">
                <Button className="bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition">
                  Send Your First Transaction
                </Button>
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {/* Compose Cryptomail Modal */}
      <Dialog open={isModalOpen} onOpenChange={handleDialogOpenChange} modal={true}>
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
    </div>
  );
}
