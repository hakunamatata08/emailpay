"use client";

import { Button } from "@/components/ui/button";
import {
  Lightning,
  Globe,
  ShieldCheck,
  Rocket,
  EnvelopeSimple,
  CurrencyCircleDollar,
  Clock,
  UserCircle
} from "phosphor-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useWeb3Auth } from "@/providers/Web3AuthProvider";

const features = [
  {
    icon: <EnvelopeSimple weight="duotone" className="w-10 h-10" />,
    title: "Email-Based Transfers",
    description: "Send crypto to anyone with just their email. No account required for recipients.",
    color: "bg-neon-pink text-white",
    delay: 0.1
  },
  {
    icon: <CurrencyCircleDollar weight="duotone" className="w-10 h-10" />,
    title: "Multiple Currencies",
    description: "Support for all major currencies.",
    color: "bg-neon-purple text-white",
    delay: 0.2
  },
  {
    icon: <Clock weight="duotone" className="w-10 h-10" />,
    title: "Instant Transfers",
    description: "Crypto arrives in seconds, not days. Real-time notifications for sender and recipient.",
    color: "bg-neon-blue text-white",
    delay: 0.3
  },
  {
    icon: <ShieldCheck weight="duotone" className="w-10 h-10" />,
    title: "Blockchain Security",
    description: "End-to-end encryption and blockchain-based protection for every transaction.",
    color: "bg-neon-cyan text-white",
    delay: 0.4
  },
  {
    icon: <Globe weight="duotone" className="w-10 h-10" />,
    title: "Global Reach",
    description: "Send crypto to anyone globally with no hidden fees or complicated processes.",
    color: "bg-neon-green text-foreground",
    delay: 0.5
  },
  {
    icon: <UserCircle weight="duotone" className="w-10 h-10" />,
    title: "User-Friendly Interface",
    description: "Intuitive design that makes sending crypto as easy as composing an email.",
    color: "bg-neon-yellow text-foreground",
    delay: 0.6
  }
];

export default function Features() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useWeb3Auth();

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

  return (
    <section className="py-24 relative overflow-hidden" id="features">
      {/* Background gradient blobs */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: "0.5s" }} />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDelay: "1.5s" }} />

      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Lightning weight="fill" className="w-4 h-4 text-neon-purple" />
            <span className="text-sm font-medium text-primary">Why EmailPay</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
            <span className="gradient-text">Revolutionary Features</span> <br />
            for Modern Crypto Transfers
          </h2>
          <p className="text-xl text-muted-foreground">
            A new way to send crypto globally without the complexity of traditional blockchain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: feature.delay, duration: 0.4 }}
              viewport={{ once: true }}
              className="relative rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:border-primary/20 transition-all funky-shadow"
            >
              <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full ${feature.color} flex items-center justify-center neon-glow`}>
                {feature.icon}
              </div>
              <div className="pt-10">
                <h3 className="text-xl font-semibold mb-3 font-heading">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center mt-16">
          <Button
            size="lg"
            className="bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:opacity-90 transition-opacity"
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
                <Rocket className="mr-2 h-5 w-5" /> Get Started Now
              </>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}
