"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Notepad, PaperPlaneRight, Check, Warning } from "phosphor-react";

export default function Cta() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      return;
    }

    // Simulate API call
    setStatus("success");
  };

  return (
    <section className="py-24 relative overflow-hidden" id="cta">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/5 to-neon-blue/5"></div>
      <div className="absolute -top-24 left-1/3 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl opacity-60 animate-pulse" />
      <div className="absolute -bottom-48 right-1/3 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Decorative floating elements */}
      <motion.div
        className="absolute top-12 left-12 md:left-24 w-12 h-12 rounded-lg bg-neon-pink/20 backdrop-blur-md border border-neon-pink/30"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        className="absolute bottom-12 right-12 md:right-24 w-16 h-16 rounded-full bg-neon-purple/20 backdrop-blur-md border border-neon-purple/30"
        animate={{
          y: [0, 30, 0],
          rotate: [0, -10, 0]
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      <div className="container relative">
        <div className="max-w-4xl mx-auto bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-12 funky-shadow neon-glow">
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
                  <span className="gradient-text">Ready to transform</span><br />
                  how you send crypto?
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Join our waitlist and be the first to experience EmailPay when we launch.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      className="h-14 pl-12 text-lg border-2 border-white/10 bg-white/5 backdrop-blur-sm focus:border-primary"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (status !== "idle") setStatus("idle");
                      }}
                    />
                    <Notepad className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />

                    {status === "success" && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-neon-green">
                        <Check weight="bold" className="w-5 h-5" />
                      </div>
                    )}

                    {status === "error" && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-destructive">
                        <Warning weight="bold" className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full md:w-auto bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition-opacity h-14 px-8 text-lg"
                  >
                    Join Waitlist
                    <PaperPlaneRight className="ml-2 h-5 w-5" />
                  </Button>

                  {status === "success" && (
                    <p className="text-sm text-neon-green flex items-center gap-1">
                      <Check weight="bold" className="w-4 h-4" />
                      You've been added to our waitlist!
                    </p>
                  )}

                  {status === "error" && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <Warning weight="bold" className="w-4 h-4" />
                      Please enter a valid email address.
                    </p>
                  )}
                </form>
              </motion.div>
            </div>

            <motion.div
              className="flex-shrink-0 w-52 h-52"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <div className="w-full h-full rounded-full bg-gradient-to-br from-neon-pink via-neon-purple to-neon-blue p-1">
                <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Launching on</p>
                    <p className="text-4xl font-bold gradient-text font-display">Ethereum</p>
                    <p className="text-sm text-muted-foreground mt-1">Mainnet in 30 days</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
