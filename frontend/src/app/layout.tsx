import type { Metadata } from "next";
import { Instrument_Sans, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const bodyFont = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700", "800"],
});

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
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="bg-[#FAF8FE] text-ink font-body antialiased selection:bg-lav-200 selection:text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
