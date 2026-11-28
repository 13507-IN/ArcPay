import type { Metadata } from "next";
import { Cinzel, Rajdhani, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const bodyFont = Rajdhani({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const displayFont = Cinzel({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["600", "700", "800"],
});

const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "ArcPay — Shadow Dojo Milestone Escrow & Instant USDC Settlement",
  description:
    "Disciplined milestone escrow, AI Deliverable Oracle, and Open Bounty Board built natively on Circle Arc Layer-1 Testnet.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} dark`}
    >
      <body className="bg-[#09090B] text-[#F4F1EA] font-body antialiased selection:bg-[#C8925A]/30 selection:text-[#F4F1EA]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
