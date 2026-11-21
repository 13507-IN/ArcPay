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
    <header className="w-full border-b border-slate-800 bg-[#0B0F19]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Chain Tag */}
        <Link href="/" className="flex items-center gap-3">
          <Coins aria-hidden="true" className="h-6 w-6 text-blue-400" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-white">
                ArcPay
              </span>
              <span className="hidden text-sm text-slate-300 sm:inline">
                Arc Testnet
              </span>
            </div>
            <p className="text-xs text-slate-300">
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
            className={`flex min-h-10 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors sm:px-3 ${
              isZeroBalance && isConnected
                ? "border-amber-500/50 bg-amber-950/40 text-amber-200 hover:bg-amber-950/70"
                : "border-slate-700 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Droplets className="h-3.5 w-3.5 text-blue-400" />
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
            className="hidden min-h-10 items-center gap-1.5 rounded-md border border-slate-700 px-3 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 sm:flex"
          >
            <span>Arc Explorer</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>

        {/* Right Section: Balance & Connect Wallet */}
        <div className="flex items-center space-x-3">
          {isConnected && (
            <div className="hidden sm:flex items-center space-x-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs">
              <span className="text-slate-400">Native USDC:</span>
              <span className="font-mono font-semibold tabular-nums text-white">
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
              const ready =
                mounted && authenticationStatus !== "loading";

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
                      className="min-h-10 whitespace-nowrap rounded-md bg-blue-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                    >
                      Connect
                    </button>
                  ) : !chain || chain.unsupported ? (
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="min-h-10 whitespace-nowrap rounded-md bg-amber-700 px-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                    >
                      Switch network
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openAccountModal}
                      title={account.address}
                      aria-label={`Connected wallet ${account.address}. Open wallet menu.`}
                      className="min-h-10 max-w-36 truncate rounded-md border border-slate-700 px-3 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-800"
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
        <div className="border-t border-slate-800 px-4 py-2 text-right text-xs text-slate-300 sm:hidden">
          Native USDC:{" "}
          <span className="font-mono font-semibold tabular-nums text-white">
            {isBalanceLoading ? "..." : formattedBalance} USDC
          </span>
        </div>
      )}
    </header>
  );
}
