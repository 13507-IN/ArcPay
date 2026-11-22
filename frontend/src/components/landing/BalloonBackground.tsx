"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Flame,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { BalloonFlightEngine, BalloonAudioStore } from "./BalloonFlightEngine";

export function BalloonBackground() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isBurning, setIsBurning] = useState(false);
  const [isPureView, setIsPureView] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BalloonFlightEngine | null>(null);
  const audioRef = useRef<BalloonAudioStore | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    if (!canvasContainerRef.current) return;

    const engine = new BalloonFlightEngine(canvasContainerRef.current);
    engineRef.current = engine;

    const audio = new BalloonAudioStore();
    audioRef.current = audio;

    return () => {
      engine.destroy();
      engineRef.current = null;
      audio.destroy();
      audioRef.current = null;
    };
  }, [isEnabled]);

  // Handle burner activation
  const handleBurnerStart = () => {
    setIsBurning(true);
    engineRef.current?.igniteBurner(true);
    audioRef.current?.setBurnerActive(true);
  };

  const handleBurnerEnd = () => {
    setIsBurning(false);
    engineRef.current?.igniteBurner(false);
    audioRef.current?.setBurnerActive(false);
  };

  // Handle audio toggle
  const handleToggleSound = () => {
    if (!audioRef.current) return;
    const muted = audioRef.current.toggleMute();
    setIsMuted(muted);
  };

  // Pure View mode: hide text temporarily to enjoy pure flight
  useEffect(() => {
    const mainEl = document.querySelector("main");
    const headerEl = document.querySelector("header");
    const footerEl = document.querySelector("footer");

    if (isPureView) {
      mainEl?.classList.add("opacity-0", "pointer-events-none");
      headerEl?.classList.add("opacity-0", "pointer-events-none");
      footerEl?.classList.add("opacity-0", "pointer-events-none");
    } else {
      mainEl?.classList.remove("opacity-0", "pointer-events-none");
      headerEl?.classList.remove("opacity-0", "pointer-events-none");
      footerEl?.classList.remove("opacity-0", "pointer-events-none");
    }
  }, [isPureView]);

  return (
    <>
      {/* 1. Fullscreen 3D WebGL Balloon Flight Canvas */}
      {isEnabled && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
          {/* Canvas — 100% crystal clear with no white overlay */}
          <div
            ref={canvasContainerRef}
            className="absolute inset-0 pointer-events-auto"
            onPointerDown={handleBurnerStart}
            onPointerUp={handleBurnerEnd}
            onPointerLeave={handleBurnerEnd}
          />
        </div>
      )}

      {/* 2. Floating Aesthetic Glassmorphic HUD Controller */}
      <aside aria-label="3D Sky Mode Controls" className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-full border border-lav-200/80 bg-white/90 p-1.5 shadow-xl backdrop-blur-xl transition-all">
          {/* Toggle Sky Background Button */}
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isEnabled
                ? "bg-lav-600 text-white shadow-sm"
                : "text-ink-soft hover:bg-lav-100 hover:text-ink"
            }`}
          >
            <span>🎈</span>
            <span className="hidden sm:inline">Sky Flight</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isEnabled ? "bg-emerald-300 animate-pulse" : "bg-gray-400"
              }`}
            />
          </button>

          {isEnabled && (
            <>
              {/* Hold to Fire Burner */}
              <button
                type="button"
                onPointerDown={handleBurnerStart}
                onPointerUp={handleBurnerEnd}
                onPointerLeave={handleBurnerEnd}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all select-none ${
                  isBurning
                    ? "bg-amber-500 text-white shadow-amber-300 shadow-md scale-105"
                    : "text-ink-soft hover:bg-lav-100 hover:text-ink"
                }`}
                title="Hold down to blast propane burners and gain altitude"
              >
                <Flame
                  className={`h-3.5 w-3.5 ${
                    isBurning ? "text-amber-200 animate-bounce" : "text-amber-500"
                  }`}
                />
                <span className="hidden md:inline">{isBurning ? "Blasting 🔥" : "Burner"}</span>
              </button>

              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={handleToggleSound}
                className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft hover:bg-lav-100 hover:text-ink transition-colors"
                title={isMuted ? "Unmute Sunrise Ambient Audio" : "Mute Audio"}
                aria-label={isMuted ? "Unmute Sunrise Ambient Audio" : "Mute Audio"}
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-lav-600 animate-pulse" />
                )}
              </button>

              {/* Immersive View Toggle (hide page content to enjoy the balloons) */}
              <button
                type="button"
                onClick={() => setIsPureView(!isPureView)}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  isPureView
                    ? "bg-lav-600 text-white"
                    : "text-ink-soft hover:bg-lav-100 hover:text-ink"
                }`}
                title={isPureView ? "Restore Landing Page Content" : "Immersive Balloon View (Hide text)"}
                aria-label={isPureView ? "Restore Landing Page Content" : "Immersive Balloon View (Hide text)"}
              >
                {isPureView ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
