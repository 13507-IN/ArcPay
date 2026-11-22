"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Flame,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Compass,
  ArrowRight,
} from "lucide-react";
import { MilestoneDemo } from "./MilestoneDemo";
import { BalloonFlightEngine, BalloonAudioStore } from "./BalloonFlightEngine";

export function BalloonHeroInteractive() {
  const [activeTab, setActiveTab] = useState<"escrow" | "balloons">("balloons");
  const [isMuted, setIsMuted] = useState(true);
  const [isBurning, setIsBurning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BalloonFlightEngine | null>(null);
  const audioRef = useRef<BalloonAudioStore | null>(null);

  // Initialize BalloonFlightEngine when balloons tab is mounted
  useEffect(() => {
    if (activeTab !== "balloons" && !isFullscreen) {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    if (!canvasContainerRef.current) return;

    const engine = new BalloonFlightEngine(canvasContainerRef.current, () => {
      setIsLoaded(true);
    });
    engineRef.current = engine;

    const audio = new BalloonAudioStore();
    audioRef.current = audio;

    return () => {
      engine.destroy();
      engineRef.current = null;
      audio.destroy();
      audioRef.current = null;
    };
  }, [activeTab, isFullscreen]);

  // Handle burner boost
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

  // Handle audio mute toggle
  const handleToggleSound = () => {
    if (!audioRef.current) return;
    const muted = audioRef.current.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full">
      {/* Top Interactive Mode Switcher Pill */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex items-center rounded-full bg-lav-100/80 p-1 text-xs font-medium text-ink-soft shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveTab("balloons");
              setIsFullscreen(false);
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition-all ${
              activeTab === "balloons"
                ? "bg-lav-600 text-white shadow-sm font-semibold"
                : "text-ink-soft hover:text-ink hover:bg-lav-200/50"
            }`}
          >
            <span>🎈</span>
            <span>3D Balloon Flight</span>
            <span className="hidden sm:inline rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] uppercase tracking-wider">
              Live
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("escrow");
              setIsFullscreen(false);
            }}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition-all ${
              activeTab === "escrow"
                ? "bg-white text-ink shadow-sm font-semibold"
                : "text-ink-soft hover:text-ink hover:bg-lav-200/50"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-lav-600" />
            <span>Milestone Escrow</span>
          </button>
        </div>

        {activeTab === "balloons" && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-ink-soft">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Interactive WebGL</span>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div
        className={`relative overflow-hidden rounded-[36px] border border-lav-200/70 bg-lav-50/70 transition-all duration-300 ${
          isFullscreen
            ? "fixed inset-0 z-50 rounded-none border-none bg-black"
            : "min-h-[460px] sm:min-h-[520px] p-4 sm:p-6"
        }`}
      >
        {activeTab === "escrow" && !isFullscreen ? (
          <div className="animate-in fade-in zoom-in-95 duration-200">
            <div className="rounded-[28px] bg-white p-2">
              <MilestoneDemo />
            </div>
            <div className="mt-4 flex items-center justify-between px-2 text-xs text-ink-soft">
              <span>Interactive preview: click "Submit deliverable"</span>
              <button
                type="button"
                onClick={() => setActiveTab("balloons")}
                className="inline-flex items-center gap-1 font-semibold text-lav-700 hover:text-lav-800"
              >
                <span>Fly 3D Balloons</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* 3D Hot Air Balloon WebGL Flight Experience */
          <div
            className={`relative w-full ${
              isFullscreen ? "h-screen w-screen" : "h-[450px] sm:h-[480px] rounded-[28px] overflow-hidden"
            }`}
          >
            {/* WebGL Canvas Container */}
            <div
              ref={canvasContainerRef}
              onPointerDown={handleBurnerStart}
              onPointerUp={handleBurnerEnd}
              onPointerLeave={handleBurnerEnd}
              className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
            />

            {/* Aesthetic Glassmorphic HUD Overlays */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
              {/* Top HUD Row */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur-md">
                    <Sparkles className="h-3.5 w-3.5 text-lav-600" />
                    <span>Dawn Valley Odyssey</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/40 bg-white/50 px-3 py-1.5 text-[11px] font-medium text-ink-soft backdrop-blur-md">
                    <Compass className="h-3 w-3 text-lav-500" />
                    <span>Arc Layer-1</span>
                  </div>
                </div>

                {/* Top Right Controls (Sound & Fullscreen) */}
                <div className="pointer-events-auto flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    aria-label={isMuted ? "Unmute sunrise ambient audio" : "Mute audio"}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink shadow-sm backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-ink-soft" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-lav-600 animate-pulse" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen flight"}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink shadow-sm backdrop-blur-md transition-all hover:bg-white hover:scale-105 active:scale-95"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4 text-ink" />
                    ) : (
                      <Maximize2 className="h-4 w-4 text-ink" />
                    )}
                  </button>
                </div>
              </div>

              {/* Bottom HUD: Burner Flame Boost & Flight Guidance */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Guidance pill */}
                <div className="pointer-events-auto rounded-full border border-white/60 bg-white/75 px-4 py-2 text-xs text-ink shadow-sm backdrop-blur-md">
                  <span className="font-semibold text-lav-700">Move mouse</span> to look ·{" "}
                  <span className="font-semibold text-lav-700">Scroll</span> to fly
                </div>

                {/* Primary Interactive Burner Button */}
                <button
                  type="button"
                  onPointerDown={handleBurnerStart}
                  onPointerUp={handleBurnerEnd}
                  onPointerLeave={handleBurnerEnd}
                  className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold transition-all shadow-md active:scale-95 select-none ${
                    isBurning
                      ? "bg-amber-500 text-white shadow-amber-300/60 shadow-lg scale-105"
                      : "bg-lav-600 text-white hover:bg-lav-700 shadow-lav-200"
                  }`}
                >
                  <Flame
                    className={`h-4 w-4 transition-transform ${
                      isBurning ? "text-amber-200 animate-bounce scale-125" : "text-amber-300"
                    }`}
                  />
                  <span>{isBurning ? "Burner Blasting 🔥" : "Hold to Fire Burner"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
