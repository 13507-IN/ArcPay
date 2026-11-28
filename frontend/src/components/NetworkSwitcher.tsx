"use client";

import React, { useState } from "react";
import { Sparkles, ExternalLink, X } from "lucide-react";
import { dojoSfx } from "../lib/dojoSfx";

interface NetworkSwitcherProps {
  variant?: "light" | "dark";
}

export function NetworkSwitcher({ variant = "dark" }: NetworkSwitcherProps) {
  const [showMainnetModal, setShowMainnetModal] = useState(false);

  return (
    <>
      {/* Shadow Dojo Network Selector Pill */}
      <div
        className={`inline-flex items-center rounded-full p-0.5 text-xs font-medium backdrop-blur-md transition-all border ${
          variant === "dark" || variant === "light"
            ? "bg-[#120D1B]/90 border-amber-500/30 text-[#F6EFE0] shadow-inner shadow-black/50"
            : ""
        }`}
      >
        <button
          type="button"
          onClick={() => dojoSfx.playSlash()}
          className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-rose-700 to-rose-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm"
          title="Currently battling on Circle Arc Testnet Arena"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span>Testnet</span>
        </button>

        <button
          type="button"
          onClick={() => {
            dojoSfx.playSlash();
            setShowMainnetModal(true);
          }}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-[#A99BB8] hover:text-amber-200 hover:bg-amber-500/10 transition-all"
          title="Arc Mainnet Arena is staged and launching soon"
        >
          <span>Mainnet</span>
          <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.2 text-[10px] font-bold tracking-wider text-amber-300 uppercase">
            Soon
          </span>
        </button>
      </div>

      {/* Mainnet Dojo Info Modal */}
      {showMainnetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setShowMainnetModal(false)}
        >
          <div
            className="relative w-full max-w-md dojo-card p-6 sm:p-7 text-[#F6EFE0] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowMainnetModal(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#A99BB8] hover:bg-amber-500/15 hover:text-amber-200 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-400 shadow-glow-gold">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold tracking-wide text-[#F6EFE0]">
                  Arc Mainnet Arena
                </h3>
                <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Staged &amp; Launching Soon
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 text-sm text-[#B8ABC9] leading-relaxed">
              <p>
                ArcPay is fully forged for{" "}
                <strong className="text-[#F6EFE0]">
                  Circle&rsquo;s Arc Layer-1 Mainnet
                </strong>{" "}
                (Chain ID: 5042, native 18-decimal USDC gas).
              </p>
              <div className="rounded-2xl bg-[#0A0710]/90 p-4 border border-amber-500/20 space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#F6EFE0]">
                  <span className="text-[#A99BB8]">Active Arena:</span>
                  <span className="font-semibold flex items-center gap-1.5 text-emerald-400">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Arc Testnet (Chain 5042002)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#F6EFE0]">
                  <span className="text-[#A99BB8]">Mainnet Status:</span>
                  <span className="font-semibold text-amber-300">
                    Contract Staged (Chain 5042)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#F6EFE0]">
                  <span className="text-[#A99BB8]">Gas &amp; Vault Coin:</span>
                  <span className="font-semibold text-rose-400">
                    Native USDC (18 decimals)
                  </span>
                </div>
              </div>
              <p className="text-xs text-[#A99BB8]">
                Train in Arc Testnet first — claim free USDC from Circle&rsquo;s
                faucet to test milestone locks, AI code audits, and &lt;1s
                strikes.
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="katana-btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-glow transition-all hover:brightness-110 active:scale-95"
              >
                Refill Testnet USDC
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setShowMainnetModal(false)}
                className="inline-flex items-center justify-center rounded-full border border-amber-500/30 bg-[#1B1328] px-4 py-2.5 text-xs font-semibold text-[#F6EFE0] hover:bg-amber-500/15 transition-colors"
              >
                Return to Dojo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
