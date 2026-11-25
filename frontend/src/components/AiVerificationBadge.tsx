"use client";

import React from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

interface AiVerificationBadgeProps {
  score?: number;
  grade?: string;
  className?: string;
  onClick?: () => void;
}

export function AiVerificationBadge({
  score = 96,
  grade = "A+",
  className = "",
  onClick,
}: AiVerificationBadgeProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition-all ${className}`}
      title={`AI Verified: Score ${score}/100 (Grade ${grade}). Click to view audit log.`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <Sparkles className="h-3 w-3 text-emerald-600" />
      <span>AI Verified: {score}%</span>
    </button>
  );
}
