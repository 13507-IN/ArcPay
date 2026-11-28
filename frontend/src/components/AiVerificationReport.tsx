"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Cpu,
  FileCode2,
} from "lucide-react";
import { VerificationAuditReport } from "../types";
import { verifyDeliverable } from "../lib/aiVerifier";

interface AiVerificationReportProps {
  report?: VerificationAuditReport | null;
  deliverableUrl: string;
  milestoneTitle?: string;
  milestoneBrief?: string;
  milestoneId?: number;
  onRefresh?: (updatedReport: VerificationAuditReport) => void;
}

export function AiVerificationReport({
  report: initialReport,
  deliverableUrl,
  milestoneTitle,
  milestoneBrief,
  milestoneId,
  onRefresh,
}: AiVerificationReportProps) {
  const [report, setReport] = useState<VerificationAuditReport | null>(
    initialReport || null
  );
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async (forceRefresh = false) => {
    if (!deliverableUrl) return;
    setIsVerifying(true);
    try {
      const result = await verifyDeliverable({
        deliverableUrl,
        title: milestoneTitle,
        brief: milestoneBrief,
        milestoneId,
        forceRefresh,
      });
      setReport(result);
      onRefresh?.(result);
    } finally {
      setIsVerifying(false);
    }
  };

  React.useEffect(() => {
    const trimmed = deliverableUrl.trim();
    if (!trimmed || trimmed.length < 10) return;

    const timer = setTimeout(() => {
      handleVerify(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [deliverableUrl]);

  if (!deliverableUrl) return null;

  const isFailed = report?.status === "FAILED";
  const isWarning = report?.status === "REVIEW_RECOMMENDED";

  const tone = isFailed
    ? {
        box: "bg-rose-950/50 border-rose-500/45",
        scoreText: "text-rose-300",
        gradeBg: "bg-rose-500/20 text-rose-200",
        titleText: "text-rose-200",
        badge: "bg-rose-500/20 border border-rose-500/45 text-rose-200",
        dot: "bg-rose-400",
        label: "Scope Mismatch / Failed",
        recText: "AI Verdict: Do Not Release Payment",
      }
    : isWarning
    ? {
        box: "bg-amber-950/45 border-amber-500/45",
        scoreText: "text-amber-300",
        gradeBg: "bg-amber-500/20 text-amber-200",
        titleText: "text-amber-200",
        badge: "bg-amber-500/20 border border-amber-500/45 text-amber-200",
        dot: "bg-amber-400",
        label: "Manual Trial Required",
        recText: "AI Verdict: Manual Review Required",
      }
    : {
        box: "bg-emerald-950/40 border-emerald-500/45",
        scoreText: "text-emerald-300",
        gradeBg: "bg-emerald-500/20 text-emerald-200",
        titleText: "text-emerald-200",
        badge: "bg-emerald-500/20 border border-emerald-500/45 text-emerald-200",
        dot: "bg-emerald-400",
        label: "Rank S · Verified",
        recText:
          report?.recommendation === "SAFE_TO_RELEASE"
            ? "AI Verdict: Safe to Release Bounty"
            : "AI Verdict: Satisfactory Scroll",
      };

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-[#0D0914]/95 p-4 sm:p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 border-b border-amber-500/15 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-glow shrink-0">
            <Cpu className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display text-sm font-bold text-[#F6EFE0] truncate">
                Shadow Dojo AI Oracle Audit
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/35">
                <Sparkles className="h-2.5 w-2.5" />
                {report?.metadata?.aiEngine || "AI Oracle"}
              </span>
            </div>
            <p className="text-[11px] text-[#A99BB8] hidden sm:block">
              Live repository &amp; endpoint inspection against quest acceptance scope
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleVerify(true)}
          disabled={isVerifying}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-amber-500/30 bg-[#161022] px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/15 transition-all disabled:opacity-60 shrink-0"
        >
          <RefreshCw
            className={`h-3 w-3 ${isVerifying ? "animate-spin text-amber-400" : ""}`}
          />
          <span>{isVerifying ? "Auditing..." : "Re-inspect"}</span>
        </button>
      </div>

      {isVerifying ? (
        <div className="flex flex-col items-center justify-center py-6 text-[#A99BB8] space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-[#F6EFE0]">
              Fetching live deliverable files &amp; running AI milestone audit...
            </span>
          </div>
          <p className="text-[11px] text-[#A99BB8]">
            Inspecting languages, file tree, CI tests &amp; scope alignment
          </p>
        </div>
      ) : report ? (
        <div className="space-y-3.5">
          {/* Score & Recommendation Banner */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl bg-[#161022] border border-amber-500/20 p-3 sm:p-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shrink-0 ${tone.box}`}
              >
                <span
                  className={`font-display text-xl font-extrabold leading-none ${tone.scoreText}`}
                >
                  {report.overallScore}
                </span>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${tone.gradeBg}`}
                >
                  {report.grade}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {isFailed || isWarning ? (
                    <ShieldAlert className={`h-4 w-4 shrink-0 ${tone.scoreText}`} />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                  )}
                  <span className={`text-xs font-bold truncate ${tone.titleText}`}>
                    {tone.recText}
                  </span>
                </div>
                <p className="text-[11px] text-[#A99BB8] mt-0.5 truncate">
                  Type:{" "}
                  <span className="font-semibold text-[#F6EFE0] uppercase">
                    {report.deliverableType.replace("_", " ")}
                  </span>
                  {typeof report.metadata?.filesInspected === "number"
                    ? ` · ${report.metadata.filesInspected} files inspected`
                    : ""}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shrink-0 ${tone.badge}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {tone.label}
            </span>
          </div>

          {/* Summary */}
          {report.summary && (
            <div
              className={`rounded-xl border p-3 text-xs leading-relaxed ${tone.box} ${tone.titleText}`}
            >
              {report.summary}
            </div>
          )}

          {/* Checkpoints */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#A99BB8] uppercase tracking-wider block">
              Inspection Trials (
              {report.checks.filter((c) => c.status === "passed").length}/
              {report.checks.length} Passed)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {report.checks.map((check, idx) => {
                const isLastOdd =
                  idx === report.checks.length - 1 &&
                  report.checks.length % 2 !== 0;
                const scoreColor =
                  check.status === "passed"
                    ? "text-emerald-300"
                    : check.status === "warning"
                    ? "text-amber-300"
                    : "text-rose-300";

                return (
                  <div
                    key={check.id}
                    className={`flex items-start gap-2.5 rounded-xl bg-[#161022]/90 border border-white/10 p-3 text-xs transition-colors hover:border-amber-500/35 ${
                      isLastOdd ? "sm:col-span-2" : ""
                    }`}
                  >
                    {check.status === "passed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : check.status === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-[#F6EFE0] truncate">
                          {check.name}
                        </span>
                        <span
                          className={`text-[11px] font-mono font-bold shrink-0 ${scoreColor}`}
                        >
                          {check.score}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A99BB8] mt-1 leading-snug">
                        {check.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Oracle Metadata Footer */}
          <div className="rounded-xl bg-[#161022] border border-white/10 p-2.5 text-[11px] text-[#A99BB8] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileCode2 className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                {report.metadata.oracleSignature ? (
                  <>
                    Oracle Seal:{" "}
                    <code className="font-mono text-amber-200 text-[10px]">
                      {report.metadata.oracleSignature}
                    </code>
                  </>
                ) : (
                  "Oracle Status: Offline"
                )}
              </span>
            </div>
            <span className="text-[10px] text-[#A99BB8] shrink-0">
              {new Date(report.metadata.inspectedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
