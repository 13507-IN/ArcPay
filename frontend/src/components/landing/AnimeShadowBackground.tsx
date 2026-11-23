"use client";

import React, { useEffect, useRef } from "react";
import { AnimeShadowEngine } from "./AnimeShadowEngine";

export function AnimeShadowBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<AnimeShadowEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new AnimeShadowEngine(containerRef.current, {
      enableGrain: true,
      enablePetals: true,
    });
    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none bg-[#090614]">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
