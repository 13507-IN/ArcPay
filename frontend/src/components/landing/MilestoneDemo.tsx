"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { ArrowRight, Check, RotateCcw, Sparkles, ShieldCheck, Swords } from "lucide-react";
import { dojoSfx } from "../../lib/dojoSfx";

type Stage = "Funded" | "Submitted" | "Released";

const order: Stage[] = ["Funded", "Submitted", "Released"];

const meta: Record<
  Stage,
  { label: string; act: string; action: string; note: string; progress: string }
> = {
  Funded: {
    label: "Stake Locked",
    act: "Act I · Escrow Seal",
    action: "Deliver Proof Scroll",
    note: "2,400.00 USDC is sealed inside the Arc Smart Contract Vault before battle begins.",
    progress: "33%",
  },
  Submitted: {
    label: "Scroll Audited",
    act: "Act II · AI Oracle Trial",
    action: "Strike & Release USDC",
    note: "AI Oracle inspected live repo, test suite & security leaks — Grade A+ (98%). Safe to release.",
    progress: "68%",
  },
  Released: {
    label: "Victory · Paid",
    act: "Act III · 0.8s Finality",
    action: "Victory! Settled in 0.8s",
    note: "Final blow landed. Native USDC transferred directly to the Ronin's wallet under 1 second.",
    progress: "100%",
  },
};

export function MilestoneDemo() {
  const [stage, setStage] = useState<Stage>("Funded");
  const activeIndex = order.indexOf(stage);

  const advance = () => {
    if (stage === "Funded") {
      dojoSfx.playSlash();
      setStage("Submitted");
    } else if (stage === "Submitted") {
      dojoSfx.playGong(true);
      setStage("Released");
      try {
        confetti({
          particleCount: 70,
          spread: 55,
          origin: { y: 0.55 },
          colors: ["#E11D48", "#F59E0B", "#10B981"],
        });
      } catch {}
    }
  };

  return (
    <div data-ui className="w-full rounded-2xl bg-[#0D0914]/95 border border-amber-500/25 p-5 sm:p-7 text-[#F6EFE0]">
      {/* Matchup Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400">
            {meta[stage].act}
          </p>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F6EFE0]">
            Duel #24: Website Redesign
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {stage === "Submitted" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40 animate-pulse">
              <Sparkles className="h-3 w-3 text-emerald-400" />
              AI Rank S: 98%
            </span>
          )}
          {stage === "Released" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-300 border border-emerald-500/40">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              Victory Cleared
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
              stage === "Released"
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                : stage === "Submitted"
                ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                : "bg-rose-500/15 border-rose-500/40 text-rose-300"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {meta[stage].label}
          </span>
        </div>
      </div>

      {/* Bounty Vault & Deadline */}
      <div className="mt-6 flex items-end justify-between gap-4 rounded-2xl bg-[#161022] border border-amber-500/20 p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#A99BB8]">
            Bounty Vault Locked
          </p>
          <p className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-amber-300 tabular-nums">
            2,400.00{" "}
            <span className="text-sm font-semibold text-amber-500/80">USDC</span>
          </p>
        </div>
        <div className="text-right text-xs text-[#A99BB8]">
          <p className="uppercase tracking-wider font-semibold">Scroll Deadline</p>
          <p className="mt-1 font-mono font-bold text-[#F6EFE0]">Mar 14</p>
        </div>
      </div>

      {/* Challengers */}
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-[#130D1D] border border-white/10 px-3.5 py-2.5">
          <dt className="text-[#A99BB8] uppercase tracking-wider font-semibold">
            Patron (Client)
          </dt>
          <dd className="mt-0.5 font-mono font-semibold text-[#F6EFE0] tabular-nums">
            0x7a3f…c21b
          </dd>
        </div>
        <div className="rounded-xl bg-[#130D1D] border border-white/10 px-3.5 py-2.5 text-right">
          <dt className="text-[#A99BB8] uppercase tracking-wider font-semibold">
            Ronin (Builder)
          </dt>
          <dd className="mt-0.5 font-mono font-semibold text-amber-200 tabular-nums">
            0x4c9d…8e04
          </dd>
        </div>
      </dl>

      {/* Combat / Escrow Clash Bar */}
      <div className="mt-6 space-y-3">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#1B1328] border border-amber-500/20 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-400 transition-all duration-500"
            style={{ width: meta[stage].progress }}
          />
        </div>

        <div className="flex items-start justify-between gap-2">
          {order.map((step, i) => {
            const done = i <= activeIndex;
            return (
              <div key={step} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
                    done
                      ? "bg-gradient-to-br from-rose-600 to-amber-600 border-amber-400 text-white shadow-glow"
                      : "bg-[#1B1328] border-white/15 text-[#A99BB8]"
                  }`}
                >
                  {done ? (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  )}
                </div>
                <span
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    done ? "text-amber-200" : "text-[#A99BB8]"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-5 min-h-[40px] text-xs sm:text-sm leading-relaxed text-[#C7BBD4]" aria-live="polite">
        {meta[stage].note}
      </p>

      <button
        type="button"
        onClick={advance}
        disabled={stage === "Released"}
        className="katana-btn mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-glow transition hover:brightness-110 active:scale-[0.98] disabled:cursor-default disabled:from-emerald-700 disabled:to-emerald-600 disabled:shadow-glow-emerald"
      >
        {stage === "Released" ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Swords className="h-4 w-4" aria-hidden="true" />
        )}
        {meta[stage].action}
        {stage !== "Released" ? (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => {
          dojoSfx.playSlash();
          setStage("Funded");
        }}
        className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#A99BB8] transition hover:text-amber-200"
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        Replay Duel Simulation
      </button>
    </div>
  );
}
