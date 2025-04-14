"use client";

import { useRef } from "react";
import {
  EnvelopeSimple,
  ArrowRight,
  CurrencyCircleDollar,
  Check,
  User,
  Sparkle,
  Wallet,
  DeviceMobile,
  ImageSquare,
  Plus
} from "phosphor-react";
import { motion, useScroll, useTransform } from "framer-motion";

const steps = [
  {
    icon: <User weight="duotone" className="w-8 h-8" />,
    title: "Login with Email",
    description: "Simply sign in with your email to access your personal crypto wallet.",
    color: "bg-neon-pink",
    delay: 0.1
  },
  {
    icon: <Wallet weight="duotone" className="w-8 h-8" />,
    title: "Wallet Creation",
    description: "A secure wallet is automatically created for you upon first login.",
    color: "bg-neon-purple",
    delay: 0.2
  },
  {
    icon: <Plus weight="duotone" className="w-8 h-8" />,
    title: "Top Up Wallet",
    description: "Add crypto to your wallet for sending to others.",
    color: "bg-neon-blue",
    delay: 0.3
  },
  {
    icon: <EnvelopeSimple weight="duotone" className="w-8 h-8" />,
    title: "Compose a Cryptomail",
    description: "Create your cryptomail with recipient addresses, CC fields, cryptocurrency type, amount, and network.",
    color: "bg-neon-cyan",
    delay: 0.4
  },
  {
    icon: <DeviceMobile weight="duotone" className="w-8 h-8" />,
    title: "Receipt Email",
    description: "Recipients receive elegant notifications in their inbox confirming the crypto transfer details.",
    color: "bg-neon-green",
    delay: 0.5
  }
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  return (
    <section className="py-24 relative overflow-hidden" id="how-it-works" ref={containerRef}>
      {/* Background gradient blobs */}
      <motion.div
        className="absolute top-1/3 -left-24 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl opacity-60"
        style={{ y, opacity }}
      />
      <motion.div
        className="absolute bottom-1/3 -right-24 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl opacity-60"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]), opacity }}
      />

      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Sparkle weight="fill" className="w-4 h-4 text-neon-purple" />
            <span className="text-sm font-medium text-primary">Simple Process</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
            <span className="gradient-text">How EmailPay Works</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Transfer crypto with just an email address, no complicated wallet addresses or complex processes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: step.delay, duration: 0.4 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative group"
            >
              <div className="rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:border-primary/20 transition-all funky-shadow h-full">
                <div className="mb-6 relative">
                  <span className="absolute -left-2 -top-2 w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center font-bold font-display">
                    {index + 1}
                  </span>
                  <div className={`w-16 h-16 ${step.color} rounded-xl flex items-center justify-center text-white`}>
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3 font-heading group-hover:gradient-text transition-all">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>

                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/3 text-muted-foreground">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
