"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { CaretLeft, CaretRight, Briefcase, Sparkle } from "phosphor-react";

// Define the use cases based on the content provided
const useCases = [
  {
    id: 1,
    icon: "💼",
    title: "Crypto Payouts",
    subtitle: "Instant, Global Payroll",
    description: "Pay freelancers, employees & gig workers with no wallet setup needed – just an email. Faster & cheaper than bank transfers.",
    example: "A Web3 startup wants to pay its global team. Instead of dealing with slow wires or crypto onboarding, they just send PYUSD to emails instantly.",
    tagline: "Skip bank delays. Pay with an email.",
    color: "bg-neon-purple"
  },
  {
    id: 2,
    icon: "🎁",
    title: "Gift Cards",
    subtitle: "The Future of Digital Gifting",
    description: "Send PYUSD as a gift instead of traditional cards. Perfect for birthdays, holidays & rewards with instant delivery, no middlemen.",
    example: "Your friend's birthday? Instead of a gift card, you email them PYUSD – fast, simple, and valuable!",
    tagline: "Forget gift cards. Send real money instead.",
    color: "bg-neon-pink"
  },
  {
    id: 3,
    icon: "🤝",
    title: "Peer-to-Peer Transfers",
    subtitle: "Pay Anyone, Anywhere",
    description: "Pay back friends & family in seconds with no bank details or crypto wallets needed. Perfect for splitting bills, rent, or meals.",
    example: "You owe a friend for dinner. Instead of dealing with apps or cash, you just email them PYUSD – done in seconds!",
    tagline: "Venmo, but global & borderless.",
    color: "bg-neon-blue"
  },
  {
    id: 4,
    icon: "🚀",
    title: "Crypto Onboarding",
    subtitle: "Easy Entry for New Users",
    description: "First-time crypto users can receive PYUSD easily with no complicated wallet setup needed. They can hold, spend, or withdraw anytime.",
    example: "Your friend is new to crypto. Instead of explaining wallets & exchanges, you send them PYUSD to their email. They claim it effortlessly!",
    tagline: "No wallet? No problem. Start with an email.",
    color: "bg-neon-cyan"
  },
  {
    id: 5,
    icon: "🛒",
    title: "E-commerce Payments",
    subtitle: "Sell & Accept PYUSD",
    description: "Merchants can accept PYUSD via email with no payment gateway setup required. Instant, low-fee transactions.",
    example: "A small online shop wants to accept crypto but doesn't want the hassle of a crypto payment processor. With EmailPay, customers just send PYUSD to the shop's email – simple & direct.",
    tagline: "Your email = your payment gateway.",
    color: "bg-neon-green"
  },
  {
    id: 6,
    icon: "❤️",
    title: "Fundraising & Donations",
    subtitle: "Support Made Simple",
    description: "Accept crypto donations easily with no need for complex crypto wallets. Perfect for charities & crowdfunding.",
    example: "A non-profit wants to accept crypto donations but doesn't want users to struggle with wallets. With EmailPay, anyone can donate PYUSD just by entering an email.",
    tagline: "Fundraising made simple – no wallet required.",
    color: "bg-neon-yellow"
  }
];

export default function UseCases() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  // Set up automatic carousel
  useEffect(() => {
    // Clear previous interval if any
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up a new interval
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % useCases.length);
    }, 5000);

    // Clean up on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle manual navigation
  const handlePrev = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setDirection(-1);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + useCases.length) % useCases.length);

    // Restart the auto-rotation
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % useCases.length);
    }, 5000);
  };

  const handleNext = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setDirection(1);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % useCases.length);

    // Restart the auto-rotation
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prevIndex) => (prevIndex + 1) % useCases.length);
    }, 5000);
  };

  const currentUseCase = useCases[currentIndex];

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0
    })
  };

  return (
    <section className="py-24 relative overflow-hidden" id="use-cases" ref={containerRef}>
      {/* Background gradient blobs */}
      <motion.div
        className="absolute top-1/3 -right-24 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl opacity-60"
        style={{ y, opacity }}
      />
      <motion.div
        className="absolute bottom-1/3 -left-24 w-96 h-96 bg-neon-blue/10 rounded-full blur-3xl opacity-60"
        style={{ y: useTransform(scrollYProgress, [0, 1], [-50, 50]), opacity }}
      />

      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="mb-6 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Briefcase weight="fill" className="w-4 h-4 text-neon-purple" />
            <span className="text-sm font-medium text-primary">Real-World Applications</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-heading">
            <span className="gradient-text">Use Cases</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Turn any email into a wallet. No hassle, just instant PYUSD transfers!
          </p>
        </div>

        <div className="relative mt-12 py-6">
          {/* Carousel navigation */}
          <div className="flex justify-between items-center max-w-4xl mx-auto mb-8">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/20 transition-all"
              aria-label="Previous use case"
            >
              <CaretLeft className="w-6 h-6" />
            </button>

            <div className="flex gap-2">
              {useCases.map((useCase, index) => (
                <button
                  key={useCase.id}
                  onClick={() => {
                    if (intervalRef.current) {
                      clearInterval(intervalRef.current);
                    }
                    setDirection(index > currentIndex ? 1 : -1);
                    setCurrentIndex(index);

                    // Restart the auto-rotation
                    intervalRef.current = setInterval(() => {
                      setDirection(1);
                      setCurrentIndex((prevIndex) => (prevIndex + 1) % useCases.length);
                    }, 5000);
                  }}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentIndex ? 'bg-primary scale-125' : 'bg-foreground/20'
                  }`}
                  aria-label={`Go to use case ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/20 transition-all"
              aria-label="Next use case"
            >
              <CaretRight className="w-6 h-6" />
            </button>
          </div>

          {/* Carousel content */}
          <div className="overflow-hidden rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/20 transition-all funky-shadow">
            <AnimatePresence custom={direction} initial={false} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="p-8 md:p-12"
              >
                <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <div className={`w-16 h-16 ${currentUseCase.color} rounded-xl flex items-center justify-center text-white text-3xl mb-6`}>
                      {currentUseCase.icon}
                    </div>
                    <h3 className="text-2xl font-bold mb-2 gradient-text font-heading">
                      {currentUseCase.title}
                    </h3>
                    <p className="text-xl mb-4 text-primary">{currentUseCase.subtitle}</p>
                    <p className="text-muted-foreground mb-6">{currentUseCase.description}</p>
                    <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 mb-6">
                      <p className="text-sm font-medium text-muted-foreground">{currentUseCase.example}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center">
                    <div className="relative w-full max-w-md">
                      <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/20 via-neon-pink/20 to-neon-blue/20 rounded-xl blur-2xl opacity-70"></div>
                      <div className="relative rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-8 text-center">
                        <div className="mb-4 flex justify-center">
                          <span className="inline-block rounded-full p-3 bg-primary/10">
                            <Sparkle weight="fill" className="w-10 h-10 text-primary" />
                          </span>
                        </div>
                        <h4 className="text-xl font-semibold mb-4 gradient-text">Key Benefit</h4>
                        <p className="text-2xl font-heading font-bold">"{currentUseCase.tagline}"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="text-center mt-10">
          <p className="text-xl font-heading font-semibold gradient-text">
            No wallet? No problem. Start sending PYUSD today!
          </p>
        </div>
      </div>
    </section>
  );
}
