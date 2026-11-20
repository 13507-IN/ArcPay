import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "ArcPay — Global Milestone Escrow & Instant USDC Payroll on Circle Arc",
  description:
    "Enterprise milestone escrow & instant freelance payroll protocol built on Circle's Arc Layer-1 Testnet with sub-second Malachite BFT finality and native 18-decimal USDC.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0F19] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
