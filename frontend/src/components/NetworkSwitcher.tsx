"use client";

import React, { useState } from "react";
import { Sparkles, Check, ExternalLink, X, AlertCircle } from "lucide-react";

interface NetworkSwitcherProps {
  variant?: "light" | "dark";
}

export function NetworkSwitcher({ variant = "light" }: NetworkSwitcherProps) {
  const [showMainnetModal, setShowMainnetModal] = useState(false);

  const isDark = variant === "dark";

  return (
    <>
      {/* Network Segmented Pill */}
      <div
        className={`inline-flex items-center rounded-full p-0.5 text-xs font-medium backdrop-blur-md transition-all ${
          isDark
            ? "bg-slate-900/70 border border-white/15 text-white/90 shadow-inner"
            : "bg-lav-100/80 border border-lav-200/80 text-ink shadow-sm"
        }`}
      >
        {/* Testnet Active Button */}
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-all ${
            isDark
              ? "bg-rose-600/90 text-white shadow-sm"
              : "bg-white text-lav-700 shadow-sm"
          }`}
          title="Currently active on Circle Arc Testnet"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Testnet</span>
        </button>

        {/* Mainnet (Coming Soon) Button */}
        <button
          type="button"
          onClick={() => setShowMainnetModal(true)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
            isDark
              ? "text-rose-200/70 hover:text-white hover:bg-white/10"
              : "text-ink-soft hover:text-ink hover:bg-white/60"
          }`}
          title="Arc Mainnet is staged and launching soon"
        >
          <span>Mainnet</span>
          <span
            className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold tracking-wide ${
              isDark
                ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                : "bg-amber-100 text-amber-700 border border-amber-200"
            }`}
          >
            Soon
          </span>
        </button>
      </div>

      {/* Mainnet Info Modal */}
      {showMainnetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowMainnetModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-lav-200 text-ink animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowMainnetModal(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-lav-100 hover:text-ink transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-inner">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold tracking-tight text-ink">
                  Arc Mainnet Support
                </h3>
                <p className="text-xs font-medium text-amber-600 flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Staged &amp; Launching Soon
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="mt-5 space-y-3.5 text-sm text-ink-soft leading-relaxed">
              <p>
                ArcPay is fully architected for <strong>Circle&rsquo;s Arc Layer-1 Mainnet</strong> (Chain ID: 5042, native 18-decimal USDC gas).
              </p>
              <div className="rounded-2xl bg-lav-50 p-4 border border-lav-200/70 space-y-2 text-xs">
                <div className="flex items-center justify-between text-ink">
                  <span className="text-ink-soft">Current Network:</span>
                  <span className="font-semibold flex items-center gap-1.5 text-emerald-600">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    Arc Testnet (Chain 5042002)
                  </span>
                </div>
                <div className="flex items-center justify-between text-ink">
                  <span className="text-ink-soft">Mainnet Status:</span>
                  <span className="font-semibold text-amber-700">
                    Contract Staged (Chain 5042)
                  </span>
                </div>
                <div className="flex items-center justify-between text-ink">
                  <span className="text-ink-soft">Gas Token:</span>
                  <span className="font-semibold text-lav-700">
                    Native USDC (18 decimals)
                  </span>
                </div>
              </div>
              <p className="text-xs text-ink-soft">
                We are actively testing on Arc Testnet so anyone can fund milestones and experience sub-second payouts for free using Circle&rsquo;s faucet.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-lav-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-lav-700 active:scale-95"
              >
                Get Free Testnet USDC
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setShowMainnetModal(false)}
                className="inline-flex items-center justify-center rounded-full border border-lav-200 bg-white px-4 py-2.5 text-xs font-semibold text-ink hover:bg-lav-50 transition-colors"
              >
                Continue on Testnet
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
