"use client";

import React from "react";
import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useBalance } from "wagmi";
import { formatUnits } from "viem";
import { Droplets, ExternalLink } from "lucide-react";
import { NetworkSwitcher } from "./NetworkSwitcher";
import { DojoAudioButton } from "./DojoAudioButton";
import { dojoSfx } from "../lib/dojoSfx";

export function Navbar() {
  const { address, isConnected } = useAccount();

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
    <header className="sticky top-0 z-40 w-full border-b border-amber-500/20 bg-[#0A0710]/85 backdrop-blur-xl shadow-lg shadow-black/40">
      <div className="mx-auto flex h-20 max-w-[1480px] w-full items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-20">
        {/* Brand Logo & Chain Tag */}
        <Link href="/" className="flex items-center gap-3 group">
          <span className="flex h-10 w-14 items-center justify-center rounded-xl bg-black border border-amber-500/40 p-1 shadow-glow-gold transition-transform group-hover:scale-105 overflow-hidden">
            <img
              src="/logo.png"
              alt="ArcPay Logo"
              className="h-full w-full object-contain"
            />
          </span>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-display text-lg font-bold tracking-wider text-[#F6EFE0] uppercase">
                ArcPay
              </span>
              <div className="hidden sm:inline-block">
                <NetworkSwitcher variant="dark" />
              </div>
            </div>
            <p className="text-xs font-medium text-[#A99BB8]">
              Shadow Dojo Vault <span aria-hidden="true">·</span> Chain 5042002
            </p>
          </div>
        </Link>

        {/* Center / Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <DojoAudioButton />

          <a
            href="https://faucet.circle.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get Testnet USDC from Circle's faucet"
            className={`flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold uppercase tracking-wider transition-all ${
              isZeroBalance && isConnected
                ? "border-amber-400 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 shadow-glow-gold"
                : "border-amber-500/25 bg-[#161022] text-[#A99BB8] hover:bg-amber-500/15 hover:text-amber-200 hover:border-amber-500/45"
            }`}
          >
            <Droplets className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">
              {isZeroBalance && isConnected ? "Get USDC" : "Faucet"}
            </span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>

          <a
            href="https://explorer.testnet.arc.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden min-h-9 items-center gap-1.5 rounded-full border border-amber-500/25 bg-[#161022] px-3.5 text-xs font-semibold uppercase tracking-wider text-[#A99BB8] transition-all hover:bg-amber-500/15 hover:text-amber-200 hover:border-amber-500/45 sm:flex"
          >
            <span>Arc Explorer</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </div>

        {/* Right Section: Balance & Connect Wallet */}
        <div className="flex items-center space-x-3">
          {isConnected && (
            <div className="hidden sm:flex items-center space-x-2 rounded-full bg-[#161022] border border-amber-500/30 px-3.5 py-1.5 text-xs font-semibold">
              <span className="text-[#A99BB8] uppercase tracking-wider">Vault:</span>
              <span className="font-mono font-bold tabular-nums text-amber-300">
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
                      onClick={() => {
                        dojoSfx.playSlash();
                        openConnectModal();
                      }}
                      className="katana-btn min-h-9 whitespace-nowrap rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white shadow-glow transition-all hover:brightness-110 active:scale-[0.98]"
                    >
                      Enter Arena
                    </button>
                  ) : !chain || chain.unsupported ? (
                    <button
                      type="button"
                      onClick={openChainModal}
                      className="min-h-9 whitespace-nowrap rounded-full bg-amber-600 px-4 text-xs sm:text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-amber-500 shadow-glow-gold"
                    >
                      Switch Arena
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        dojoSfx.playSlash();
                        openAccountModal();
                      }}
                      title={account.address}
                      aria-label={`Connected wallet ${account.address}. Open wallet menu.`}
                      className="min-h-9 max-w-44 truncate rounded-full border border-amber-500/40 bg-[#1B1328] px-4 text-xs sm:text-sm font-semibold font-mono text-amber-200 shadow-sm transition-all hover:bg-amber-500/20 hover:border-amber-400"
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
        <div className="border-t border-amber-500/15 bg-[#120D1B]/90 px-4 py-2 text-right text-xs text-[#A99BB8] sm:hidden">
          Vault Balance:{" "}
          <span className="font-mono font-bold tabular-nums text-amber-300">
            {isBalanceLoading ? "..." : formattedBalance} USDC
          </span>
        </div>
      )}
    </header>
  );
}
