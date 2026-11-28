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
        box: "bg-[#18181D] border-red-500/45",
        scoreText: "text-red-400",
        gradeBg: "bg-[#09090B] text-red-400 border border-red-500/40",
        titleText: "text-red-300",
        badge: "bg-[#18181D] border border-red-500/45 text-red-300",
        dot: "bg-red-400",
        label: "Scope Mismatch / Failed",
        recText: "AI Recommendation: Do Not Release Payment",
      }
    : isWarning
    ? {
        box: "bg-[#141418] border-[#C8925A]/50",
        scoreText: "text-[#C8925A]",
        gradeBg: "bg-[#09090B] text-[#C8925A] border border-[#C8925A]/40",
        titleText: "text-[#F4F1EA]",
        badge: "bg-[#C8925A]/15 border border-[#C8925A]/45 text-[#C8925A]",
        dot: "bg-[#C8925A]",
        label: "Manual Review Required",
        recText: "AI Recommendation: Manual Review Required",
      }
    : {
        box: "bg-[#141418] border-[#C8925A]/40",
        scoreText: "text-[#C8925A]",
        gradeBg: "bg-[#C8925A] text-[#09090B]",
        titleText: "text-[#F4F1EA]",
        badge: "bg-[#C8925A]/15 border border-[#C8925A]/45 text-[#C8925A]",
        dot: "bg-[#C8925A]",
        label: "Verified",
        recText:
          report?.recommendation === "SAFE_TO_RELEASE"
            ? "AI Recommendation: Safe to Release Payment"
            : "AI Recommendation: Satisfactory Deliverable",
      };

  return (
    <div className="rounded-xl border border-[#27272F] bg-[#09090B] p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#27272F] pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C8925A] text-[#09090B] shrink-0">
            <Cpu className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display text-sm font-bold text-[#F4F1EA] truncate">
                AI Deliverable Oracle
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#18181D] px-2.5 py-0.5 text-[10px] font-bold text-[#C8925A] border border-[#27272F]">
                <Sparkles className="h-2.5 w-2.5" />
                {report?.metadata?.aiEngine || "AI Oracle"}
              </span>
            </div>
            <p className="text-[11px] text-[#8F8E94] hidden sm:block">
              Live repository &amp; endpoint inspection against client milestone requirements
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleVerify(true)}
          disabled={isVerifying}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#27272F] bg-[#141418] px-3 py-1.5 text-xs font-semibold text-[#F4F1EA] hover:border-[#C8925A]/60 transition-colors disabled:opacity-60 shrink-0"
        >
          <RefreshCw
            className={`h-3 w-3 ${isVerifying ? "animate-spin text-[#C8925A]" : ""}`}
          />
          <span>{isVerifying ? "Auditing..." : "Re-inspect"}</span>
        </button>
      </div>

      {isVerifying ? (
        <div className="flex flex-col items-center justify-center py-6 text-[#8F8E94] space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[#C8925A] animate-pulse" />
            <span className="text-xs font-semibold text-[#F4F1EA]">
              Fetching live deliverable files &amp; running AI milestone audit...
            </span>
          </div>
          <p className="text-[11px] text-[#8F8E94]">
            Inspecting languages, file tree, CI tests &amp; scope alignment
          </p>
        </div>
      ) : report ? (
        <div className="space-y-3.5">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 rounded-xl bg-[#111114] border border-[#27272F] p-3 sm:p-3.5">
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
                    <ShieldCheck className="h-4 w-4 text-[#C8925A] shrink-0" />
                  )}
                  <span className={`text-xs font-bold truncate ${tone.titleText}`}>
                    {tone.recText}
                  </span>
                </div>
                <p className="text-[11px] text-[#8F8E94] mt-0.5 truncate">
                  Type:{" "}
                  <span className="font-semibold text-[#F4F1EA] uppercase">
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

          {report.summary && (
            <div
              className={`rounded-xl border p-3 text-xs leading-relaxed ${tone.box} ${tone.titleText}`}
            >
              {report.summary}
            </div>
          )}

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-[#8F8E94] uppercase tracking-wider block">
              Inspection Checkpoints (
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
                    ? "text-[#C8925A]"
                    : check.status === "warning"
                    ? "text-[#C8925A]"
                    : "text-red-400";

                return (
                  <div
                    key={check.id}
                    className={`flex items-start gap-2.5 rounded-xl bg-[#111114] border border-[#27272F] p-3 text-xs transition-colors hover:border-[#C8925A]/40 ${
                      isLastOdd ? "sm:col-span-2" : ""
                    }`}
                  >
                    {check.status === "passed" ? (
                      <CheckCircle2 className="h-4 w-4 text-[#C8925A] shrink-0 mt-0.5" />
                    ) : check.status === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-[#C8925A] shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-[#F4F1EA] truncate">
                          {check.name}
                        </span>
                        <span
                          className={`text-[11px] font-mono font-bold shrink-0 ${scoreColor}`}
                        >
                          {check.score}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8F8E94] mt-1 leading-snug">
                        {check.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl bg-[#111114] border border-[#27272F] p-2.5 text-[11px] text-[#8F8E94] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileCode2 className="h-3.5 w-3.5 text-[#C8925A] shrink-0" />
              <span className="truncate">
                {report.metadata.oracleSignature ? (
                  <>
                    Oracle Hash:{" "}
                    <code className="font-mono text-[#F4F1EA] text-[10px]">
                      {report.metadata.oracleSignature}
                    </code>
                  </>
                ) : (
                  "Oracle Status: Offline"
                )}
              </span>
            </div>
            <span className="text-[10px] text-[#8F8E94] shrink-0">
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
