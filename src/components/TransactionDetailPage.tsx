"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/types/transaction";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EnvelopeSimple,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  CurrencyEth,
  User,
  Copy,
  LinkSimple,
} from "phosphor-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

interface TransactionDetailPageProps {
  id: string;
}

export default function TransactionDetailPage({ id }: TransactionDetailPageProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, getAddress } = useWeb3Auth();
  const { toast } = useToast();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading_transaction, setIsLoading_transaction] = useState<boolean>(true);

  // Fetch transaction details
  useEffect(() => {
    const fetchTransaction = async () => {
      if (!isAuthenticated || isLoading) return;

      try {
        setIsLoading_transaction(true);
        const address = await getAddress();

        if (!address) {
          toast({
            title: "Authentication error",
            description: "Could not retrieve your wallet address. Please try again or reconnect your wallet.",
            variant: "destructive",
          });
          router.push("/transactions");
          return;
        }

        const response = await fetch(`/api/transactions/${id}?userAddress=${address}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch transaction");
        }

        const data = await response.json();
        setTransaction(data);
      } catch (error) {
        console.error("Error fetching transaction:", error);
        toast({
          title: "Failed to load transaction",
          description: error instanceof Error ? error.message : "Could not load the transaction details. Please try again.",
          variant: "destructive",
        });
        router.push("/transactions");
      } finally {
        setIsLoading_transaction(false);
      }
    };

    if (isAuthenticated && !isLoading) {
      fetchTransaction();
    } else if (!isLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [id, isAuthenticated, isLoading, router, getAddress, toast]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Handle copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: "Copied!",
          description: `${label} has been copied to clipboard.`,
        });
      },
      () => {
        toast({
          title: "Copy failed",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  // Get status icon
  const getStatusIcon = (status: Transaction["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-500" />;
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
      default:
        return "Unknown";
    }
  };

  // If still loading auth state or not authenticated, show loading spinner
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
        className="max-w-3xl mx-auto"
      >
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push("/transactions")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Transactions
          </Button>
          <h1 className="text-4xl font-bold gradient-text">Transaction Details</h1>
        </div>

        {isLoading_transaction ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center">
              <div className="animate-spin h-12 w-12 border-4 border-neon-purple border-t-transparent rounded-full mb-4"></div>
              <p className="text-muted-foreground">Loading transaction details...</p>
            </div>
          </div>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Transaction Header Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">
                  <div className="flex items-center justify-between">
                    <span>{transaction.subject}</span>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted">
                      {getStatusIcon(transaction.status)}
                      <span>{getStatusLabel(transaction.status)}</span>
                    </div>
                  </div>
                </CardTitle>
                <CardDescription>
                  <div className="flex flex-col gap-1 mt-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Created on {formatDate(transaction.createdAt.toString())}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Last updated on {formatDate(transaction.updatedAt.toString())}
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Payment Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground">Amount</span>
                  <div className="text-xl font-semibold flex items-center gap-2">
                    {transaction.amount} <span className="text-sm text-muted-foreground">{transaction.tokenType}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-muted-foreground">Network</span>
                  <div className="flex items-center gap-2">
                    <CurrencyEth className="h-4 w-4 text-blue-400" />
                    {transaction.network}
                  </div>
                </div>
                {transaction.txHash && (
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-muted-foreground">Transaction Hash</span>
                    <div className="flex items-center gap-2">
                      <div className="max-w-[200px] truncate">{transaction.txHash}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(transaction.txHash!, "Transaction hash")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {transaction.network.toLowerCase().includes("sepolia") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <Link href={`https://sepolia.etherscan.io/tx/${transaction.txHash}`} target="_blank" rel="noopener noreferrer">
                            <LinkSimple className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recipients Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recipients</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* To Recipients */}
                <div>
                  <h3 className="font-medium mb-2">To</h3>
                  <div className="space-y-2">
                    {transaction.toRecipients.map((recipient, index) => (
                      <div key={`to-${index}`} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                        {recipient.photo ? (
                          <div
                            className="w-8 h-8 rounded-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${recipient.photo})` }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{recipient.name}</span>
                          <span className="text-xs text-muted-foreground">{recipient.email}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cc Recipients */}
                {transaction.ccRecipients.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Cc</h3>
                    <div className="space-y-2">
                      {transaction.ccRecipients.map((recipient, index) => (
                        <div key={`cc-${index}`} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                          {recipient.photo ? (
                            <div
                              className="w-8 h-8 rounded-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${recipient.photo})` }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{recipient.name}</span>
                            <span className="text-xs text-muted-foreground">{recipient.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bcc Recipients */}
                {transaction.bccRecipients.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Bcc</h3>
                    <div className="space-y-2">
                      {transaction.bccRecipients.map((recipient, index) => (
                        <div key={`bcc-${index}`} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                          {recipient.photo ? (
                            <div
                              className="w-8 h-8 rounded-full bg-cover bg-center"
                              style={{ backgroundImage: `url(${recipient.photo})` }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div className="flex flex-col">
                            <span className="font-medium">{recipient.name}</span>
                            <span className="text-xs text-muted-foreground">{recipient.email}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message Card */}
            {transaction.message && (
              <Card>
                <CardHeader>
                  <CardTitle>Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap p-4 rounded-md bg-muted/50">
                    {transaction.message}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions Card */}
            <Card>
              <CardFooter className="flex justify-between p-6">
                <Button variant="outline" onClick={() => router.push("/transactions")}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Transactions
                </Button>
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition">
                    <EnvelopeSimple className="mr-2 h-4 w-4" />
                    New Transaction
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        ) : (
          <div className="py-20 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-medium mb-2">Transaction not found</h3>
            <p className="text-muted-foreground mb-6">
              The transaction you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/transactions">
              <Button className="bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition">
                Back to Transactions
              </Button>
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
