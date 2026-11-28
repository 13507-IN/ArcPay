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
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#18181D] border border-[#27272F] px-2.5 py-0.5 text-xs font-semibold text-[#C8925A] hover:border-[#C8925A]/60 transition-colors ${className}`}
        title="Click to run live AI deliverable audit"
      >
        <Sparkles className="h-3 w-3" />
        <span>Audit with AI</span>
      </button>
    );
  }

  if (audit.status === "FAILED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#18181D] border border-red-500/50 px-2.5 py-0.5 text-xs font-bold text-red-400 hover:border-red-400 transition-colors ${className}`}
        title={`AI Audit Flagged (${audit.overallScore}/100, Grade ${audit.grade}). Click to inspect.`}
      >
        <XCircle className="h-3 w-3" />
        <span>AI Flagged: {audit.overallScore}%</span>
      </button>
    );
  }

  if (audit.status === "REVIEW_RECOMMENDED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-[#18181D] border border-[#C8925A]/50 px-2.5 py-0.5 text-xs font-bold text-[#C8925A] hover:border-[#C8925A] transition-colors ${className}`}
        title={`AI Review Recommended (${audit.overallScore}/100, Grade ${audit.grade}). Click to inspect.`}
      >
        <AlertTriangle className="h-3 w-3" />
        <span>AI Review: {audit.overallScore}%</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#C8925A]/15 border border-[#C8925A]/45 px-2.5 py-0.5 text-xs font-bold text-[#C8925A] hover:bg-[#C8925A]/25 transition-colors ${className}`}
      title={`AI Verified: Score ${audit.overallScore}/100 (Grade ${audit.grade}). Click to view audit log.`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-[#C8925A]" />
      <span>AI Cleared: {audit.overallScore}%</span>
    </button>
  );
}
