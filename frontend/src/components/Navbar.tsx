"use client";

import React from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { Coins, Droplets, ExternalLink } from "lucide-react";

export function Navbar() {
  const { address, isConnected } = useAccount();

  // On Arc Testnet, native USDC is 18 decimals and fetched via native balance
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
  });

  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, 18)).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      })
    : "0.00";

  const isZeroBalance = balance?.value === 0n;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-lav-200/60 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Chain Tag */}
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lav-600 text-white shadow-sm transition-transform hover:scale-105">
            <Coins aria-hidden="true" className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-semibold tracking-tight text-ink">
                ArcPay
              </span>
              <span className="hidden rounded-full bg-lav-100 px-2 py-0.5 text-xs font-semibold text-lav-700 sm:inline">
                Arc Testnet
              </span>
            </div>
            <p className="text-xs text-ink-soft">
              Native USDC <span aria-hidden="true">·</span> Chain 5042002
            </p>
          </div>
        </Link>

        {/* Center / Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get Testnet USDC from Circle's faucet"
            className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-all ${
              isZeroBalance && isConnected
                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 shadow-sm"
                : "border-lav-200 bg-white text-ink-soft hover:bg-lav-50 hover:text-ink hover:border-lav-300"
            }`}
          >
            <Droplets className="h-3.5 w-3.5 text-lav-600" />
            <span className="hidden sm:inline">
              {isZeroBalance && isConnected ? "Get Testnet USDC" : "Faucet"}
            </span>
            <span className="sm:hidden">
              {isZeroBalance && isConnected ? "Get USDC" : "Faucet"}
            </span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href="https://explorer.testnet.arc.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-9 items-center gap-1.5 rounded-full border border-lav-200 bg-white px-3.5 text-xs font-medium text-ink-soft transition-all hover:bg-lav-50 hover:text-ink hover:border-lav-300 sm:flex"
          >
            <span>Arc Explorer</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>

        {/* Right Section: Balance & Connect Wallet */}
        <div className="flex items-center space-x-3">
          {isConnected && (
            <div className="hidden sm:flex items-center space-x-2 rounded-full bg-lav-50 border border-lav-200/80 px-3.5 py-1.5 text-xs font-medium">
              <span className="text-ink-soft">Native USDC:</span>
              <span className="font-mono font-semibold tabular-nums text-lav-700">
                {isBalanceLoading ? "..." : formattedBalance} USDC
              </span>
            </div>
          )}

          <ConnectButton.Custom>
            {({
              account,
              chain,
              mounted,
              authenticationStatus,
              openAccountModal,
              openChainModal,
              openConnectModal,
            }) => {
              const ready = mounted && authenticationStatus !== "loading";

              return (
                <div
                  aria-live="polite"
                  className="flex"
                  style={{
                    opacity: ready ? 1 : 0,
                    pointerEvents: ready ? "auto" : "none",
                  }}
                >
                  {!ready || !account ? (
                    <button
                      type="button"
                      onClick={openConnectModal}
                      className="min-h-9 whitespace-nowrap rounded-full bg-lav-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-lav-700 active:scale-[0.98]"
                    >
                      Connect
                    </button>
                  ) : !chain || chain.unsupported ? (
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="min-h-9 whitespace-nowrap rounded-full bg-amber-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-amber-500 shadow-sm"
                    >
                      Switch network
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openAccountModal}
                      title={account.address}
                      aria-label={`Connected wallet ${account.address}. Open wallet menu.`}
                      className="min-h-9 max-w-40 truncate rounded-full border border-lav-200 bg-white px-4 text-sm font-medium text-ink shadow-sm transition-all hover:bg-lav-50 hover:border-lav-300"
                    >
                      {account.displayName}
                    </button>
                  )}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
      {isConnected && (
        <div className="border-t border-lav-100 bg-lav-50/50 px-4 py-2 text-right text-xs text-ink-soft sm:hidden">
          Native USDC:{" "}
          <span className="font-mono font-semibold tabular-nums text-lav-700">
            {isBalanceLoading ? "..." : formattedBalance} USDC
          </span>
        </div>
      )}
    </header>
  );
}
