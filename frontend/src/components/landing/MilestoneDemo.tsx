"use client";

import { useState } from "react";
import { ArrowRight, Check, RotateCcw, Sparkles, ShieldCheck } from "lucide-react";

type Stage = "Funded" | "Submitted" | "Released";

const order: Stage[] = ["Funded", "Submitted", "Released"];

const meta: Record<
  Stage,
  { label: string; action: string; note: string }
> = {
  Funded: {
    label: "Funded",
    action: "Submit deliverable",
    note: "2,400.00 USDC is locked in the escrow contract on Arc.",
  },
  Submitted: {
    label: "Submitted",
    action: "Approve & release",
    note: "AI Oracle verified GitHub PR with 100% tests passing & 0 leaks. Ready for release.",
  },
  Released: {
    label: "Released",
    action: "Paid in 0.8s",
    note: "Payout sent to the freelancer in native USDC in under 1 second.",
  },
};

export function MilestoneDemo() {
  const [stage, setStage] = useState<Stage>("Funded");
  const activeIndex = order.indexOf(stage);

  const advance = () => {
    if (stage === "Funded") setStage("Submitted");
    else if (stage === "Submitted") setStage("Released");
  };

  return (
    <div data-ui className="w-full rounded-[28px] bg-white p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-soft">Milestone 24</p>
          <h3 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
            Website redesign
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {stage === "Submitted" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 animate-pulse">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              AI Verified: 98%
            </span>
          )}
          {stage === "Released" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Audited
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lav-100 px-3 py-1 text-sm font-medium text-lav-700">
            <span className="h-1.5 w-1.5 rounded-full bg-lav-500" aria-hidden="true" />
            {meta[stage].label}
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-4xl font-semibold tracking-tight text-ink tabular-nums">
            2,400.00{" "}
            <span className="text-base font-medium text-ink-soft">USDC</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">Amount in escrow</p>
        </div>
        <div className="text-right text-sm text-ink-soft">
          <p>Due</p>
          <p className="mt-1 font-medium text-ink">Mar 14</p>
        </div>
      </div>

      <dl className="mt-8 space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-soft">Client</dt>
          <dd className="font-medium text-ink tabular-nums">0x7a3f…c21b</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-ink-soft">Freelancer</dt>
          <dd className="font-medium text-ink tabular-nums">0x4c9d…8e04</dd>
        </div>
      </dl>

      <div className="mt-8 flex items-start justify-between gap-2">
        {order.map((step, i) => {
          const done = i <= activeIndex;
          return (
            <div key={step} className="flex flex-1 flex-col items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  done ? "bg-lav-600 text-white" : "bg-lav-100 text-lav-500"
                }`}
              >
                {done ? (
                  <Check className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  done ? "text-ink" : "text-ink-soft"
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-6 min-h-[40px] text-sm leading-relaxed text-ink-soft" aria-live="polite">
        {meta[stage].note}
      </p>

      <button
        type="button"
        onClick={advance}
        disabled={stage === "Released"}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-lav-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-lav-700 active:scale-[0.99] disabled:cursor-default disabled:bg-lav-900"
      >
        {stage === "Released" ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
        {meta[stage].action}
        {stage !== "Released" ? (
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => setStage("Funded")}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-ink-soft transition hover:text-ink"
      >
        <RotateCcw className="h-3 w-3" aria-hidden="true" />
        Reset demo
      </button>
    </div>
  );
}
