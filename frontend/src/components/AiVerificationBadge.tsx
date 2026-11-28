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
        className={`inline-flex items-center gap-1.5 rounded-full bg-lav-50 border border-lav-200 px-2.5 py-0.5 text-xs font-semibold text-lav-700 hover:bg-lav-100 transition-all ${className}`}
        title="Click to run live AI deliverable audit"
      >
        <Sparkles className="h-3 w-3 text-lav-600" />
        <span>Audit with AI</span>
      </button>
    );
  }

  if (audit.status === "FAILED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-semibold text-rose-800 hover:bg-rose-100 transition-all ${className}`}
        title={`AI Audit Flagged (${audit.overallScore}/100, Grade ${audit.grade}). Click to inspect.`}
      >
        <XCircle className="h-3 w-3 text-rose-600" />
        <span>AI Flagged: {audit.overallScore}%</span>
      </button>
    );
  }

  if (audit.status === "REVIEW_RECOMMENDED") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-all ${className}`}
        title={`AI Review Recommended (${audit.overallScore}/100, Grade ${audit.grade}). Click to inspect.`}
      >
        <AlertTriangle className="h-3 w-3 text-amber-600" />
        <span>AI Review: {audit.overallScore}%</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition-all ${className}`}
      title={`AI Verified: Score ${audit.overallScore}/100 (Grade ${audit.grade}). Click to view audit log.`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      <Sparkles className="h-3 w-3 text-emerald-600" />
      <span>AI Verified: {audit.overallScore}%</span>
    </button>
  );
}
