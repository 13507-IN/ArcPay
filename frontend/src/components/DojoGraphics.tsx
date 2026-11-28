"use client";

import React from "react";

/**
 * Iconic Shadow Fight 2 inspired SVG illustration of two shadow warriors
 * in combat stance flanking the Arc USDC Escrow Crest under a crimson twilight sun.
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
        <radialGradient id="sfSun" cx="50%" cy="62%" r="45%">
          <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#E11D48" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#08050D" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="bladeGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>

      {/* Atmospheric Twilight Sun */}
      <circle cx="320" cy="95" r="88" fill="url(#sfSun)" />

      {/* Floor Horizon Mist & Dojo Tatami Line */}
      <line x1="20" y1="142" x2="620" y2="142" stroke="#F59E0B" strokeOpacity="0.35" strokeWidth="1.5" />
      <line x1="80" y1="146" x2="560" y2="146" stroke="#E11D48" strokeOpacity="0.25" strokeWidth="1" />

      {/* Left Warrior Silhouette (Patron / Challenger with Katana Guard) */}
      <g fill="#09050F" stroke="#F59E0B" strokeOpacity="0.55" strokeWidth="1.2">
        {/* Headband tails */}
        <path d="M180 56 Q160 50 144 62 Q160 64 176 62 Z" fill="#E11D48" stroke="none" />
        {/* Head */}
        <circle cx="192" cy="58" r="11" />
        {/* Torso & Hakama Stance */}
        <path d="M184 71 L204 74 L210 105 L226 142 L205 142 L195 112 L178 142 L158 142 L176 102 Z" />
        {/* Guarding Arms */}
        <path d="M198 76 L224 88 L234 80 L228 96 L195 86 Z" />
        {/* Katana Blade */}
        <path d="M230 82 L278 44 L281 47 L233 87 Z" fill="url(#bladeGold)" stroke="none" />
      </g>

      {/* Center Emblem: Arc Escrow Seal with Crossed Slash */}
      <g>
        <circle cx="320" cy="88" r="24" fill="#120D1B" stroke="#F59E0B" strokeWidth="1.8" />
        <circle cx="320" cy="88" r="18" fill="none" stroke="#E11D48" strokeOpacity="0.7" strokeWidth="1" strokeDasharray="3 3" />
        <path d="M312 96 L320 74 L328 96 M314 91 L326 91" stroke="#FBBF24" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        {/* Slash glint */}
        <path d="M292 106 Q320 82 350 70" stroke="url(#bladeGold)" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
      </g>

      {/* Right Warrior Silhouette (Ronin / Freelancer in Forward Strike Stance) */}
      <g fill="#09050F" stroke="#E11D48" strokeOpacity="0.6" strokeWidth="1.2">
        {/* Straw Ronin Kasa Hat */}
        <path d="M420 55 L448 41 L476 55 Z" />
        {/* Head */}
        <circle cx="448" cy="59" r="10" />
        {/* Torso & Dynamic Lunge */}
        <path d="M438 71 L458 70 L465 104 L484 142 L463 142 L448 111 L428 142 L408 142 L430 100 Z" />
        {/* Dual/Long Katana Arm */}
        <path d="M442 75 L414 87 L406 79 L413 95 L446 84 Z" />
        {/* Katana Blade */}
        <path d="M409 81 L360 45 L357 48 L406 86 Z" fill="url(#bladeGold)" stroke="none" />
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
