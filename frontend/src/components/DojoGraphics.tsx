"use client";

import React from "react";

/**
 * Monochrome Obsidian + Warm Bronze (#C8925A) Shadow Fight Duelist Arena SVG.
 * Matches the ArcPay logo palette with strict two-color discipline.
 */
export function DuelArenaSvg({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 640 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dojoBronzeSun" cx="50%" cy="65%" r="48%">
          <stop offset="0%" stopColor="#C8925A" stopOpacity="0.45" />
          <stop offset="65%" stopColor="#C8925A" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#09090B" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Atmospheric Bronze Horizon Glow */}
      <circle cx="320" cy="95" r="92" fill="url(#dojoBronzeSun)" />

      {/* Ground Line */}
      <line x1="24" y1="142" x2="616" y2="142" stroke="#C8925A" strokeOpacity="0.32" strokeWidth="1.2" />

      {/* Left Warrior Silhouette (Patron) */}
      <g fill="#050507" stroke="#C8925A" strokeOpacity="0.45" strokeWidth="1.1">
        <path d="M180 56 Q160 50 144 62 Q160 64 176 62 Z" fill="#C8925A" fillOpacity="0.7" stroke="none" />
        <circle cx="192" cy="58" r="11" />
        <path d="M184 71 L204 74 L210 105 L226 142 L205 142 L195 112 L178 142 L158 142 L176 102 Z" />
        <path d="M198 76 L224 88 L234 80 L228 96 L195 86 Z" />
        <path d="M230 82 L278 44 L281 47 L233 87 Z" fill="#C8925A" stroke="none" />
      </g>

      {/* Center Seal */}
      <g>
        <circle cx="320" cy="88" r="23" fill="#111114" stroke="#C8925A" strokeWidth="1.5" />
        <path d="M312 96 L320 74 L328 96 M314 91 L326 91" stroke="#C8925A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Right Warrior Silhouette (Ronin) */}
      <g fill="#050507" stroke="#C8925A" strokeOpacity="0.45" strokeWidth="1.1">
        <path d="M420 55 L448 41 L476 55 Z" />
        <circle cx="448" cy="59" r="10" />
        <path d="M438 71 L458 70 L465 104 L484 142 L463 142 L448 111 L428 142 L408 142 L430 100 Z" />
        <path d="M442 75 L414 87 L406 79 L413 95 L446 84 Z" />
        <path d="M409 81 L360 45 L357 48 L406 86 Z" fill="#C8925A" stroke="none" />
      </g>
    </svg>
  );
}

export function CrossedKatanaSvg({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 20L9 15M9 15L19 5L20 4L15 9M9 15L7 13M11 17L9 15M20 20L15 15M15 15L5 5L4 4L9 9M15 15L17 13M13 17L15 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
