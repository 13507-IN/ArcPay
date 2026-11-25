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
  const [report, setReport] = useState<VerificationAuditReport | null>(initialReport || null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    if (!deliverableUrl) return;
    setIsVerifying(true);
    try {
      const result = await verifyDeliverable({
        deliverableUrl,
        title: milestoneTitle,
        brief: milestoneBrief,
        milestoneId,
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
      handleVerify();
    }, 600);

    return () => clearTimeout(timer);
  }, [deliverableUrl]);

  if (!deliverableUrl) return null;

  const isFailed = report?.status === "FAILED";
  const isWarning = report?.status === "REVIEW_RECOMMENDED";

  const tone = isFailed
    ? {
        box: "bg-rose-50 border-rose-200/90",
        scoreText: "text-rose-700",
        gradeBg: "bg-rose-100/80 text-rose-800",
        titleText: "text-rose-900",
        badge: "bg-rose-100/90 text-rose-800",
        dot: "bg-rose-500",
        label: "Scope Mismatch / Failed",
        recText: "AI Recommendation: Do Not Release Payment",
      }
    : isWarning
    ? {
        box: "bg-amber-50 border-amber-200/90",
        scoreText: "text-amber-700",
        gradeBg: "bg-amber-100/80 text-amber-800",
        titleText: "text-amber-900",
        badge: "bg-amber-100/90 text-amber-800",
        dot: "bg-amber-500",
        label: "Review Required",
        recText: "AI Recommendation: Manual Review Required",
      }
    : {
        box: "bg-emerald-50 border-emerald-200/90",
        scoreText: "text-emerald-700",
        gradeBg: "bg-emerald-100/80 text-emerald-800",
        titleText: "text-emerald-900",
        badge: "bg-emerald-100/80 text-emerald-800",
        dot: "bg-emerald-500",
        label: "Verified",
        recText:
          report?.recommendation === "SAFE_TO_RELEASE"
            ? "AI Recommendation: Safe to Release Payment"
            : "AI Recommendation: Satisfactory Deliverable",
      };

  return (
    <div className="rounded-2xl border border-lav-200/90 bg-gradient-to-b from-white via-lav-50/20 to-lav-50/50 p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 border-b border-lav-100 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-lav-600 to-indigo-600 text-white shadow-xs shrink-0">
            <Cpu className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display text-sm font-semibold text-ink truncate">
                Autonomous AI Deliverable Verification
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-lav-100 px-2 py-0.5 text-[10px] font-bold text-lav-800 border border-lav-200">
                <Sparkles className="h-2.5 w-2.5" />
                {report?.metadata?.aiEngine || "AI Oracle"}
              </span>
            </div>
            <p className="text-[11px] text-ink-soft hidden sm:block">
              Live repository &amp; endpoint inspection against client milestone requirements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-lav-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-lav-50 hover:text-ink transition-all disabled:opacity-60 shrink-0 shadow-xs"
        >
          <RefreshCw className={`h-3 w-3 ${isVerifying ? "animate-spin text-lav-600" : ""}`} />
          <span>{isVerifying ? "Auditing..." : "Re-inspect"}</span>
        </button>
      </div>

      {isVerifying ? (
        <div className="flex flex-col items-center justify-center py-6 text-ink-soft space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-lav-600 animate-pulse" />
            <span className="text-xs font-medium">
              Fetching live deliverable files &amp; running AI milestone audit...
            </span>
          </div>
          <p className="text-[11px] text-ink-soft/70">
            Inspecting repository languages, file tree, tests, and milestone scope alignment
          </p>
        </div>
      ) : report ? (
        <div className="space-y-3.5">
          {/* Score & Recommendation Banner */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl bg-white border border-lav-200/80 p-3 sm:p-3.5 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 shrink-0 ${tone.box}`}>
                <span className={`font-display text-xl font-bold leading-none ${tone.scoreText}`}>
                  {report.overallScore}
                </span>
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${tone.gradeBg}`}>
                  {report.grade}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {isFailed || isWarning ? (
                    <ShieldAlert className={`h-4 w-4 shrink-0 ${tone.scoreText}`} />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  )}
                  <span className={`text-xs font-bold truncate ${tone.titleText}`}>
                    {tone.recText}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5 truncate">
                  Type: <span className="font-semibold text-ink uppercase">{report.deliverableType.replace("_", " ")}</span>
                  {typeof report.metadata?.filesInspected === "number"
                    ? ` · ${report.metadata.filesInspected} files inspected`
                    : ""}
                </p>
              </div>
            </div>

            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shrink-0 ${tone.badge}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
              {tone.label}
            </span>
          </div>

          {/* Real AI Audit Summary */}
          {report.summary && (
            <div className={`rounded-xl border p-3 text-xs leading-relaxed ${tone.box} ${tone.titleText}`}>
              {report.summary}
            </div>
          )}

          {/* Inspection Checkpoints (2-Column Grid) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">
              Inspection Checkpoints ({report.checks.filter((c) => c.status === "passed").length}/{report.checks.length} Passed)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {report.checks.map((check, idx) => {
                const isLastOdd = idx === report.checks.length - 1 && report.checks.length % 2 !== 0;
                const scoreColor =
                  check.status === "passed"
                    ? "text-emerald-700"
                    : check.status === "warning"
                    ? "text-amber-700"
                    : "text-rose-700";

                return (
                  <div
                    key={check.id}
                    className={`flex items-start gap-2.5 rounded-xl bg-white border border-lav-200/70 p-3 text-xs transition-colors hover:border-lav-300 shadow-2xs ${
                      isLastOdd ? "sm:col-span-2" : ""
                    }`}
                  >
                    {check.status === "passed" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : check.status === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-ink truncate">{check.name}</span>
                        <span className={`text-[11px] font-mono font-bold shrink-0 ${scoreColor}`}>
                          {check.score}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-soft mt-1 leading-snug">{check.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Oracle Metadata Footer */}
          <div className="rounded-xl bg-lav-50/70 border border-lav-100 p-2.5 text-[11px] text-ink-soft flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileCode2 className="h-3.5 w-3.5 text-lav-600 shrink-0" />
              <span className="truncate">
                {report.metadata.oracleSignature ? (
                  <>
                    Oracle Hash: <code className="font-mono text-ink text-[10px]">{report.metadata.oracleSignature}</code>
                  </>
                ) : (
                  "Oracle Status: Offline"
                )}
              </span>
            </div>
            <span className="text-[10px] text-ink-soft/80 shrink-0">
              {new Date(report.metadata.inspectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
