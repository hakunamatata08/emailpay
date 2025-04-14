import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";

// Import our custom fonts
import "@fontsource-variable/space-grotesk";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";

export const metadata: Metadata = {
  title: "EmailPay | Pay like an email. Fast. Simple. Borderless.",
  description: "EmailPay - Send money as easily as sending an email. Fast, simple, and borderless payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <ClientBody>
        {children}
      </ClientBody>
    </html>
  );
}
