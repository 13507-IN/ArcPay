"use client";

import React from "react";
import { Sparkles, AlertTriangle, XCircle } from "lucide-react";
import { MilestoneAiAuditSummary } from "../types";

interface AiVerificationBadgeProps {
  audit?: MilestoneAiAuditSummary | null;
  className?: string;
  onClick?: () => void;
}

export function AiVerificationBadge({
  audit,
  className = "",
  onClick,
}: AiVerificationBadgeProps) {
  if (!audit) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/35 px-2.5 py-0.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20 transition-all ${className}`}
        title="Click to run live AI deliverable audit"
      >
        <Sparkles className="h-3 w-3 text-amber-400" />
        <span>Audit with AI</span>
      </button>
    );
  }

  if (audit.status === "FAILED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/50 px-2.5 py-0.5 text-xs font-bold text-rose-300 hover:bg-rose-500/25 transition-all ${className}`}
        title={`AI Audit Flagged (${audit.overallScore}/100, Grade ${audit.grade}). Click to inspect.`}
      >
        <XCircle className="h-3 w-3 text-rose-400" />
        <span>AI Flagged: {audit.overallScore}%</span>
      </button>
    );
  }

  if (audit.status === "REVIEW_RECOMMENDED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/50 px-2.5 py-0.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-all ${className}`}
        title={`AI Review Recommended (${audit.overallScore}/100, Grade ${audit.grade}). Click to inspect.`}
      >
        <AlertTriangle className="h-3 w-3 text-amber-400" />
        <span>AI Review: {audit.overallScore}%</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/45 px-2.5 py-0.5 text-xs font-bold text-emerald-300 shadow-xs hover:bg-emerald-500/25 transition-all ${className}`}
      title={`AI Verified: Score ${audit.overallScore}/100 (Grade ${audit.grade}). Click to view audit log.`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      <Sparkles className="h-3 w-3 text-emerald-400" />
      <span>AI Cleared: {audit.overallScore}%</span>
    </button>
  );
}
