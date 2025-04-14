"use client";

import Link from "next/link";
import {
  EnvelopeSimple,
  TwitterLogo,
  InstagramLogo,
  LinkedinLogo,
  GithubLogo,
  GlobeHemisphereWest
} from "phosphor-react";

export default function Footer() {
  return (
    <footer className="relative pt-16 pb-10 border-t border-violet-100/20 dark:border-violet-900/20 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl opacity-30" />
      <div className="absolute -top-48 right-0 w-96 h-96 bg-neon-blue/5 rounded-full blur-3xl opacity-30" />

      <div className="container relative">
        <div className="mb-16">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="relative w-8 h-8 neon-glow">
                <div className="absolute inset-0 bg-gradient-to-br from-neon-pink to-neon-purple rounded-lg"></div>
                <EnvelopeSimple weight="fill" className="relative text-white w-8 h-8 p-1.5" />
              </div>
              <span className="font-display text-xl font-bold gradient-text">EmailPay</span>
            </Link>
            <p className="text-muted-foreground mb-6 max-w-md">
              Send crypto as easily as sending an email. Fast, simple, and borderless payments for everyone.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-muted-foreground hover:text-neon-purple hover:border-neon-purple/30 transition-all">
                <TwitterLogo weight="fill" className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-muted-foreground hover:text-neon-pink hover:border-neon-pink/30 transition-all">
                <InstagramLogo weight="fill" className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-muted-foreground hover:text-neon-blue hover:border-neon-blue/30 transition-all">
                <LinkedinLogo weight="fill" className="w-5 h-5" />
              </Link>
              <Link href="#" className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center text-muted-foreground hover:text-neon-cyan hover:border-neon-cyan/30 transition-all">
                <GithubLogo weight="fill" className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-violet-100/10 dark:border-violet-900/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground flex items-center">
            <GlobeHemisphereWest className="mr-2 h-4 w-4" />
            Available worldwide without restrictions
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} EmailPay. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
