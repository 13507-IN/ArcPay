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
    label: "Locked",
    act: "Act I · Escrow Seal",
    action: "Deliver Proof Scroll",
    note: "2,400.00 USDC is locked inside the on-chain Circle Arc contract before work begins.",
    progress: "33%",
  },
  Submitted: {
    label: "AI Audited",
    act: "Act II · Oracle Trial",
    action: "Approve & Pay USDC",
    note: "AI Oracle inspected live repo, CI tests & security — Grade A+ (98%). Safe to release.",
    progress: "68%",
  },
  Released: {
    label: "Settled",
    act: "Act III · 0.8s Finality",
    action: "Settled in 0.8s",
    note: "Escrow cleared. Native USDC transferred directly to the freelancer wallet under 1 second.",
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
          particleCount: 65,
          spread: 50,
          origin: { y: 0.55 },
          colors: ["#C8925A", "#F4F1EA", "#8F8E94"],
        });
      } catch {}
    }
  };

  return (
    <div data-ui className="w-full rounded-xl bg-[#09090B] border border-[#27272F] p-5 sm:p-7 text-[#F4F1EA]">
      {/* Matchup Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8925A]">
            {meta[stage].act}
          </p>
          <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold tracking-wide text-[#F4F1EA]">
            Milestone #24 · Redesign
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {stage === "Submitted" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C8925A]/15 px-2.5 py-1 text-xs font-bold text-[#C8925A] border border-[#C8925A]/40">
              <Sparkles className="h-3 w-3" />
              AI Audited: 98%
            </span>
          )}
          {stage === "Released" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#C8925A]/15 px-2.5 py-1 text-xs font-bold text-[#C8925A] border border-[#C8925A]/40">
              <ShieldCheck className="h-3 w-3" />
              Verified
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#18181D] border border-[#27272F] px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#F4F1EA]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C8925A]" aria-hidden="true" />
            {meta[stage].label}
          </span>
        </div>
      </div>

      {/* Bounty Vault & Deadline */}
      <div className="mt-6 flex items-end justify-between gap-4 rounded-xl bg-[#111114] border border-[#27272F] p-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#8F8E94]">
            Amount Locked
          </p>
          <p className="mt-1 font-display text-3xl sm:text-4xl font-bold tracking-tight text-[#C8925A] tabular-nums">
            2,400.00{" "}
            <span className="text-sm font-semibold text-[#8F8E94]">USDC</span>
          </p>
        </div>
        <div className="text-right text-xs text-[#8F8E94]">
          <p className="uppercase tracking-wider font-semibold">Deadline</p>
          <p className="mt-1 font-mono font-bold text-[#F4F1EA]">Mar 14</p>
        </div>
      </div>

      {/* Counterparties */}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl bg-[#111114] border border-[#27272F] px-3.5 py-2.5">
          <dt className="text-[#8F8E94] uppercase tracking-wider font-semibold">
            Patron (Client)
          </dt>
          <dd className="mt-0.5 font-mono font-semibold text-[#F4F1EA] tabular-nums">
            0x7a3f…c21b
          </dd>
        </div>
        <div className="rounded-xl bg-[#111114] border border-[#27272F] px-3.5 py-2.5 text-right">
          <dt className="text-[#8F8E94] uppercase tracking-wider font-semibold">
            Ronin (Builder)
          </dt>
          <dd className="mt-0.5 font-mono font-semibold text-[#C8925A] tabular-nums">
            0x4c9d…8e04
          </dd>
        </div>
      </dl>

      {/* Progress Bar */}
      <div className="mt-6 space-y-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[#18181D] border border-[#27272F] p-0.5">
          <div
            className="h-full rounded-full bg-[#C8925A] transition-all duration-500"
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
                      ? "bg-[#C8925A] border-[#C8925A] text-[#09090B]"
                      : "bg-[#111114] border-[#27272F] text-[#8F8E94]"
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
                    done ? "text-[#C8925A]" : "text-[#8F8E94]"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-5 min-h-[40px] text-xs sm:text-sm leading-relaxed text-[#8F8E94]" aria-live="polite">
        {meta[stage].note}
      </p>

      <button
        type="button"
        onClick={advance}
        disabled={stage === "Released"}
        className="katana-btn mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#C8925A] hover:bg-[#D9A46D] px-6 py-3 text-sm font-bold uppercase tracking-wider text-[#09090B] transition active:scale-[0.98] disabled:cursor-default disabled:bg-[#1C1C22] disabled:text-[#C8925A] disabled:border disabled:border-[#C8925A]/40"
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
        className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8F8E94] transition hover:text-[#F4F1EA]"
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        Reset Demo
      </button>
    </div>
  );
}
