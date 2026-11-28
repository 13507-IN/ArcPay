"use client";

import React, { useState } from "react";
import { Sparkles, ExternalLink, X } from "lucide-react";
import { dojoSfx } from "../lib/dojoSfx";

interface NetworkSwitcherProps {
  variant?: "light" | "dark";
}

export function NetworkSwitcher({ variant: _variant = "dark" }: NetworkSwitcherProps) {
  const [showMainnetModal, setShowMainnetModal] = useState(false);

  return (
    <>
      <div className="inline-flex items-center rounded-full p-0.5 text-xs font-medium bg-[#111114] border border-[#27272F] text-[#F4F1EA]">
        <button
          type="button"
          onClick={() => dojoSfx.playSlash()}
          className="flex items-center gap-1.5 rounded-full bg-[#C8925A] px-2.5 py-1 text-xs font-bold text-[#09090B]"
          title="Currently active on Circle Arc Testnet"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#09090B]" />
          <span>Testnet</span>
        </button>

        <button
          type="button"
          onClick={() => {
            dojoSfx.playSlash();
            setShowMainnetModal(true);
          }}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-[#8F8E94] hover:text-[#F4F1EA] transition-colors"
          title="Arc Mainnet is staged and launching soon"
        >
          <span>Mainnet</span>
          <span className="rounded-full bg-[#1C1C22] border border-[#27272F] px-1.5 py-0.2 text-[10px] font-semibold uppercase text-[#C8925A]">
            Soon
          </span>
        </button>
      </div>

      {showMainnetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowMainnetModal(false)}
        >
          <div
            className="relative w-full max-w-md dojo-card p-6 sm:p-7 text-[#F4F1EA]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowMainnetModal(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full text-[#8F8E94] hover:bg-[#1C1C22] hover:text-[#F4F1EA] transition-colors"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#C8925A]/15 border border-[#C8925A]/40 text-[#C8925A]">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold tracking-wide text-[#F4F1EA]">
                  Arc Mainnet
                </h3>
                <p className="text-xs font-semibold text-[#C8925A] mt-0.5 uppercase tracking-wider">
                  Staged · Launching Soon
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5 text-sm text-[#8F8E94] leading-relaxed">
              <p>
                ArcPay is architected for{" "}
                <strong className="text-[#F4F1EA]">
                  Circle&rsquo;s Arc Layer-1 Mainnet
                </strong>{" "}
                (Chain ID: 5042, native 18-decimal USDC gas).
              </p>
              <div className="rounded-xl bg-[#09090B] p-4 border border-[#27272F] space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#F4F1EA]">
                  <span className="text-[#8F8E94]">Active Network:</span>
                  <span className="font-semibold text-[#C8925A]">
                    Arc Testnet (5042002)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#F4F1EA]">
                  <span className="text-[#8F8E94]">Mainnet Status:</span>
                  <span className="font-semibold text-[#F4F1EA]">
                    Staged (Chain 5042)
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#F4F1EA]">
                  <span className="text-[#8F8E94]">Settlement Coin:</span>
                  <span className="font-semibold text-[#C8925A]">
                    Native USDC (18 decimals)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
              <a
                href="https://faucet.circle.com"
                target="_blank"
                rel="noopener noreferrer"
                className="katana-btn inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[#09090B] transition-colors"
              >
                Get Testnet USDC
                <ExternalLink className="h-3 w-3" />
              </a>
              <button
                type="button"
                onClick={() => setShowMainnetModal(false)}
                className="inline-flex items-center justify-center rounded-full border border-[#27272F] bg-[#18181D] px-4 py-2.5 text-xs font-semibold text-[#F4F1EA] hover:border-[#C8925A]/50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
