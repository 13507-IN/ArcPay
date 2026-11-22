"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Wind,
  Film,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { AnimeShadowEngine, AnimeAudioStore } from "./AnimeShadowEngine";

export function AnimeShadowBackground() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isGrainOn, setIsGrainOn] = useState(true);
  const [isPetalsOn, setIsPetalsOn] = useState(true);
  const [isPureView, setIsPureView] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AnimeShadowEngine | null>(null);
  const audioRef = useRef<AnimeAudioStore | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    if (!containerRef.current) return;

    const engine = new AnimeShadowEngine(containerRef.current, {
      enableGrain: isGrainOn,
      enablePetals: isPetalsOn,
    });
    engineRef.current = engine;

    const audio = new AnimeAudioStore();
    audioRef.current = audio;

    return () => {
      engine.destroy();
      engineRef.current = null;
      audio.destroy();
      audioRef.current = null;
    };
  }, [isEnabled]);

  // Handle Wind Gust Trigger
  const handleWindBurst = () => {
    engineRef.current?.triggerWindGust();
  };

  // Toggle Film Grain
  const handleToggleGrain = () => {
    const next = !isGrainOn;
    setIsGrainOn(next);
    engineRef.current?.setGrain(next);
  };

  // Toggle Falling Petals
  const handleTogglePetals = () => {
    const next = !isPetalsOn;
    setIsPetalsOn(next);
    engineRef.current?.setPetals(next);
  };

  // Toggle Audio
  const handleToggleSound = () => {
    if (!audioRef.current) return;
    const muted = audioRef.current.toggleMute();
    setIsMuted(muted);
  };

  // Pure View mode: hide text temporarily to enjoy full anime & Shadow Fight scenery
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
      {/* 1. Fullscreen Anime & Shadow Fight Background Canvas */}
      {isEnabled && (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#090614]">
          <div
            ref={containerRef}
            className="absolute inset-0 pointer-events-auto cursor-crosshair"
            onClick={handleWindBurst}
            title="Click anywhere for an anime sakura wind gust!"
          />
        </div>
      )}

      {/* 2. Floating Aesthetic Glassmorphic HUD Controller */}
      <aside
        aria-label="Anime & Shadow Fight Controls"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
      >
        <div className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-slate-950/85 p-1.5 shadow-2xl backdrop-blur-xl transition-all">
          {/* Anime Sky Theme Toggle */}
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
              isEnabled
                ? "bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-md shadow-rose-900/50"
                : "text-rose-200/60 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <span>🌸</span>
            <span className="hidden sm:inline">Anime Shadow</span>
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isEnabled ? "bg-rose-400 animate-pulse" : "bg-gray-500"
              }`}
            />
          </button>

          {isEnabled && (
            <>
              {/* Sakura Breeze Gust Button */}
              <button
                type="button"
                onClick={handleWindBurst}
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-950/60 hover:text-white transition-all active:scale-95 select-none"
                title="Trigger a cherry blossom anime wind burst"
              >
                <Wind className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                <span className="hidden md:inline">Breeze</span>
              </button>

              {/* Shadow Fight Grain Toggle */}
              <button
                type="button"
                onClick={handleToggleGrain}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  isGrainOn
                    ? "bg-rose-950/80 text-rose-300"
                    : "text-rose-200/40 hover:bg-slate-800 hover:text-white"
                }`}
                title={isGrainOn ? "Shadow Fight Grain: ON" : "Shadow Fight Grain: OFF"}
                aria-label="Toggle Shadow Fight Grain"
              >
                <Film className="h-3.5 w-3.5" />
              </button>

              {/* Falling Petals Toggle */}
              <button
                type="button"
                onClick={handleTogglePetals}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  isPetalsOn
                    ? "text-rose-300"
                    : "text-rose-200/40 hover:bg-slate-800 hover:text-white"
                }`}
                title={isPetalsOn ? "Falling Petals: ON" : "Falling Petals: OFF"}
                aria-label="Toggle Falling Petals"
              >
                <Sparkles className="h-3.5 w-3.5" />
              </button>

              {/* Sound Toggle Button */}
              <button
                type="button"
                onClick={handleToggleSound}
                className="flex h-7 w-7 items-center justify-center rounded-full text-rose-200/70 hover:bg-slate-800 hover:text-white transition-colors"
                title={isMuted ? "Unmute Ambient Japanese Koto" : "Mute Sound"}
                aria-label={isMuted ? "Unmute Ambient Japanese Koto" : "Mute Sound"}
              >
                {isMuted ? (
                  <VolumeX className="h-3.5 w-3.5" />
                ) : (
                  <Volume2 className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
                )}
              </button>

              {/* Immersive View Toggle (hide text to enjoy the scene) */}
              <button
                type="button"
                onClick={() => setIsPureView(!isPureView)}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                  isPureView
                    ? "bg-rose-600 text-white"
                    : "text-rose-200/70 hover:bg-slate-800 hover:text-white"
                }`}
                title={isPureView ? "Restore Page Content" : "Pure View (Hide Text)"}
                aria-label={isPureView ? "Restore Page Content" : "Pure View (Hide Text)"}
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
