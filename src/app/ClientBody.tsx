"use client";

import { useEffect } from "react";
import { Web3AuthProvider } from "@/providers/Web3AuthProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { Toaster } from "@/components/ui/toaster";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  return (
    <body className="antialiased" suppressHydrationWarning>
      <Web3AuthProvider>
        <NotificationProvider>
          {children}
          <Toaster />
        </NotificationProvider>
      </Web3AuthProvider>
    </body>
  );
}
