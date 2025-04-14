"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { EnvelopeSimple, ArrowRight, Check } from "phosphor-react";
import { useRouter } from "next/navigation";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";

export default function Hero() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useWeb3Auth();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    },
  };

  const handleGetStartedClick = async () => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.push("/dashboard");
    } else {
      try {
        await login();
        router.push("/dashboard");
      } catch (error) {
        console.error("Error logging in:", error);
      }
    }
  };

  const scrollToHowItWorks = () => {
    const howItWorksSection = document.getElementById("how-it-works");
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  };

  return (
    <section className="relative overflow-hidden pt-16 md:pt-20 lg:pt-28">
      {/* Background gradient blobs */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-neon-purple/20 rounded-full blur-3xl opacity-60 animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container relative">
        <motion.div
          className="flex flex-col items-center text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main heading */}
          <motion.h1
            className="font-display font-bold mb-6 max-w-4xl"
            variants={itemVariants}
          >
            <span className="gradient-text">Pay like an email.</span>
            <br />
            <span>Fast. Simple. Borderless.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl"
            variants={itemVariants}
          >
            Transfer crypto as easily as you send emails. No complex blockchain addresses, just an email address.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 mb-16"
            variants={itemVariants}
          >
            <Button
              size="lg"
              className="bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition-opacity h-14 px-6 text-lg"
              onClick={handleGetStartedClick}
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
              ) : (
                <>
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="gradient-border h-14 px-6 text-lg"
              onClick={scrollToHowItWorks}
            >
              See How It Works
            </Button>
          </motion.div>

          {/* App Preview */}
          <motion.div
            className="relative w-full max-w-5xl mx-auto funky-shadow rounded-2xl neon-glow"
            variants={itemVariants}
          >
            <div className="overflow-hidden rounded-2xl border-2 border-foreground/10 dark:border-white/20 bg-gradient-to-br from-foreground/5 to-foreground/10 dark:from-white/5 dark:to-white/10 backdrop-blur-sm p-6 md:p-8">
              {/* Email Interface Header */}
              <div className="flex gap-4 items-center mb-6">
                <div className="bg-neon-purple/30 rounded-full p-2">
                  <EnvelopeSimple weight="duotone" className="w-8 h-8 text-neon-purple" />
                </div>
                <div className="flex-1">
                  <div className="h-5 bg-foreground/10 rounded-full w-48 mb-2"></div>
                  <div className="h-3 bg-foreground/5 rounded-full w-32"></div>
                </div>
                <div className="hidden md:flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-neon-pink/40 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white/70 dark:bg-white/70 rounded-sm"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-neon-blue/40 flex items-center justify-center">
                    <div className="w-3 h-3 bg-white/70 dark:bg-white/70 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Crypto Email Compose UI */}
              <div className="relative">
                <div className="p-5 rounded-xl bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 backdrop-blur-sm shadow-glow">
                  {/* Email Form Fields */}
                  <div className="space-y-6">
                    {/* Recipient */}
                    <div className="flex gap-3 items-center">
                      <div className="w-16 text-sm text-foreground/70 dark:text-white/60 font-medium">To</div>
                      <div className="h-9 flex-1 rounded-md bg-foreground/5 dark:bg-white/10 flex items-center px-3">
                        <div className="h-5 w-full bg-foreground/10 dark:bg-white/5 rounded-full animate-pulse"></div>
                      </div>
                    </div>

                    {/* CC Line */}
                    <div className="flex gap-3 items-center opacity-70">
                      <div className="w-16 text-sm text-foreground/70 dark:text-white/60 font-medium">Cc</div>
                      <div className="h-9 flex-1 rounded-md bg-foreground/5 dark:bg-white/10 flex items-center px-3">
                        <div className="h-5 w-1/3 bg-foreground/10 dark:bg-white/5 rounded-full"></div>
                      </div>
                    </div>

                    {/* Bcc Line */}
                    <div className="flex gap-3 items-center opacity-70">
                      <div className="w-16 text-sm text-foreground/70 dark:text-white/60 font-medium">Bcc</div>
                      <div className="h-9 flex-1 rounded-md bg-foreground/5 dark:bg-white/10 flex items-center px-3">
                        <div className="h-5 w-1/4 bg-foreground/10 dark:bg-white/5 rounded-full"></div>
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="flex gap-3 items-center">
                      <div className="w-16 text-sm text-foreground/70 dark:text-white/60 font-medium">Subject</div>
                      <div className="h-9 flex-1 rounded-md bg-foreground/5 dark:bg-white/10 flex items-center px-3">
                        <div className="h-5 w-4/5 bg-foreground/10 dark:bg-white/5 rounded-full"></div>
                      </div>
                    </div>

                    {/* Amount - Key Feature */}
                    <div className="flex gap-3 items-center">
                      <div className="w-16 text-sm text-foreground/70 dark:text-white/60 font-medium">Amount</div>
                      <div className="flex flex-1 gap-2">
                        <div className="h-9 w-32 rounded-md bg-foreground/5 dark:bg-white/10 flex items-center px-3">
                          <span className="text-sm text-foreground/80 dark:text-white/80 font-mono">0.5</span>
                        </div>

                        {/* Currency Selector */}
                        <div className="h-9 rounded-md bg-gradient-to-r from-neon-purple/20 to-neon-purple/10 border border-neon-purple/30 flex items-center px-3 gap-2">
                          <span className="text-sm font-medium text-foreground/90 dark:text-white/80">ETH</span>
                          <div className="w-4 h-4 rounded-full bg-foreground/5 dark:bg-white/10 flex items-center justify-center">
                            <div className="w-2 h-2 border-t-2 border-r-2 border-foreground/60 dark:border-white/60 transform rotate-45 -translate-y-px"></div>
                          </div>
                        </div>

                        {/* Network Selector */}
                        <div className="h-9 rounded-md bg-foreground/5 dark:bg-white/10 flex items-center px-3 gap-2">
                          <span className="text-sm font-medium text-foreground/90 dark:text-white/80">Ethereum</span>
                          <div className="w-4 h-4 rounded-full bg-foreground/5 dark:bg-white/10 flex items-center justify-center">
                            <div className="w-2 h-2 border-t-2 border-r-2 border-foreground/60 dark:border-white/60 transform rotate-45 -translate-y-px"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="flex justify-end">
                      <div className="bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 rounded-md px-3 py-1.5 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-neon-green/60"></div>
                        <span className="text-xs text-foreground/70 dark:text-white/70">Available: <span className="font-medium text-foreground dark:text-white">238.14 ETH</span></span>
                      </div>
                    </div>

                    {/* Message Area */}
                    <div className="h-24 w-full rounded-md bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10 p-3">
                      <div className="h-3 bg-foreground/10 dark:bg-white/10 rounded-full w-2/3 mb-2"></div>
                      <div className="h-3 bg-foreground/10 dark:bg-white/10 rounded-full w-3/4 mb-2"></div>
                      <div className="h-3 bg-foreground/10 dark:bg-white/10 rounded-full w-1/2"></div>
                    </div>

                    {/* Gasless Option */}
                    <div className="flex items-center justify-between p-3 rounded-md bg-foreground/5 dark:bg-white/5 border border-foreground/10 dark:border-white/10">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                          <div className="w-4 h-4 text-amber-400">💎</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground/90 dark:text-white/90">Gasless Transactions</div>
                          <div className="text-xs text-foreground/60 dark:text-white/60">Send without paying gas fees</div>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <div className="w-10 h-5 rounded-full bg-neon-purple/50 relative p-0.5">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-glow"></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <div className="h-10 px-4 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 flex items-center gap-2 shadow-glow">
                          <div className="w-4 h-4 text-white">✉️</div>
                          <span className="text-sm font-medium text-white">Send</span>
                        </div>

                        <div className="h-10 px-4 rounded-md bg-gray-600/50 dark:bg-gray-600/50 flex items-center gap-2">
                          <div className="w-4 h-4 text-white/80">📄</div>
                          <span className="text-sm font-medium text-foreground/80 dark:text-white/80">Save as Draft</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 text-green-400">⚡</div>
                        <span className="text-xs text-green-400">No gas required</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={itemVariants}
          >
            {['Trusted', 'Secure', 'Fast', 'Global'].map((text, index) => (
              <div key={index} className="text-center">
                <motion.div
                  className="h-12 w-12 mx-auto mb-3 bg-gradient-to-br from-neon-pink to-neon-purple rounded-lg flex items-center justify-center"
                  initial={{ opacity: 0.2, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.5,
                    duration: 0.3,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.5 + 0.2,
                      duration: 0.3,
                      type: "spring",
                      stiffness: 300
                    }}
                  >
                    <Check weight="bold" className="h-6 w-6 text-white" />
                  </motion.div>
                </motion.div>
                <p className="text-sm font-medium">{text}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
