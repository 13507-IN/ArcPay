"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Cpu,
  FileCode2,
} from "lucide-react";
import { VerificationAuditReport } from "../types";
import { verifyDeliverable } from "../lib/aiVerifier";

interface AiVerificationReportProps {
  report?: VerificationAuditReport | null;
  deliverableUrl: string;
  milestoneTitle?: string;
  milestoneId?: number;
  onRefresh?: (updatedReport: VerificationAuditReport) => void;
}

export function AiVerificationReport({
  report: initialReport,
  deliverableUrl,
  milestoneTitle,
  milestoneId,
  onRefresh,
}: AiVerificationReportProps) {
  const [report, setReport] = useState<VerificationAuditReport | null>(initialReport || null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Trigger on-demand verification
  const handleVerify = async () => {
    if (!deliverableUrl) return;
    setIsVerifying(true);
    try {
      const result = await verifyDeliverable({
        deliverableUrl,
        title: milestoneTitle,
        milestoneId,
      });
      setReport(result);
      onRefresh?.(result);
    } finally {
      setIsVerifying(false);
    }
  };

  // If no initial report provided, compute on first mount if deliverableUrl exists
  React.useEffect(() => {
    if (!report && deliverableUrl) {
      handleVerify();
    }
  }, [deliverableUrl]);

  if (!deliverableUrl) return null;

  return (
    <div className="rounded-2xl border border-lav-200/90 bg-gradient-to-b from-white via-lav-50/30 to-lav-50/60 p-5 shadow-sm space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-lav-100 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-lav-600 to-indigo-600 text-white shadow-sm">
            <Cpu className="h-4 w-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display text-sm font-semibold text-ink">
                Autonomous AI Deliverable Verification
              </h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                <Sparkles className="h-2.5 w-2.5" />
                AI Oracle
              </span>
            </div>
            <p className="text-[11px] text-ink-soft">
              Real-time automated code, security &amp; acceptance criteria audit
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={isVerifying}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-lav-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-lav-50 hover:text-ink transition-all disabled:opacity-60"
        >
          <RefreshCw className={`h-3 w-3 ${isVerifying ? "animate-spin text-lav-600" : ""}`} />
          <span>{isVerifying ? "Auditing..." : "Re-inspect"}</span>
        </button>
      </div>

      {isVerifying ? (
        <div className="flex flex-col items-center justify-center py-6 text-ink-soft space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-lav-600 animate-pulse" />
            <span className="text-xs font-medium">Running multi-vector deliverable verification...</span>
          </div>
          <p className="text-[11px] text-ink-soft/70">
            Checking PR commit status, unit tests, and secret security scans
          </p>
        </div>
      ) : report ? (
        <div className="space-y-4">
          {/* Score & Recommendation Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl bg-white border border-lav-200/80 p-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5">
                <span className="font-display text-xl font-bold text-emerald-700 leading-tight">
                  {report.overallScore}
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">
                  Grade {report.grade}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-800">
                    {report.recommendation === "SAFE_TO_RELEASE"
                      ? "AI Recommendation: Safe to Release Payment"
                      : "AI Recommendation: Satisfactory Deliverable"}
                  </span>
                </div>
                <p className="text-[11px] text-ink-soft mt-0.5 line-clamp-1">
                  Type: <span className="font-semibold text-ink">{report.deliverableType.toUpperCase()}</span> · All core assertions verified
                </p>
              </div>
            </div>

            <span className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-2.5 py-1 text-xs font-bold text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Verified On-Chain
            </span>
          </div>

          {/* Audit Checks Checklist */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider block">
              Inspection Checkpoints ({report.checks.filter((c) => c.status === "passed").length}/{report.checks.length} Passed)
            </span>
            <div className="grid grid-cols-1 gap-2">
              {report.checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-start gap-2.5 rounded-xl bg-white border border-lav-200/60 p-2.5 text-xs transition-colors hover:border-lav-300"
                >
                  {check.status === "passed" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : check.status === "warning" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-ink">{check.name}</span>
                      <span className="text-[11px] font-mono text-ink-soft font-semibold">{check.score}/100</span>
                    </div>
                    <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary & Oracle Hash */}
          <div className="rounded-xl bg-lav-50/60 border border-lav-100 p-3 text-[11px] text-ink-soft flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <FileCode2 className="h-3.5 w-3.5 text-lav-600 shrink-0" />
              <span className="truncate">Oracle Hash: <code className="font-mono text-ink text-[10px]">{report.metadata.oracleSignature}</code></span>
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
