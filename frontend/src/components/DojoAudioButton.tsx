"use client";

import React, { useState, useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { dojoSfx } from "../lib/dojoSfx";

export function DojoAudioButton() {
  const [enabled, setEnabled] = useState(dojoSfx.isEnabled());

  useEffect(() => {
    return dojoSfx.subscribe(setEnabled);
  }, []);

  return (
    <button
      type="button"
      onClick={() => dojoSfx.toggle()}
      title={enabled ? "Mute Shadow Dojo Soundscape & SFX" : "Enable Shadow Dojo Audio & SFX"}
      aria-label={enabled ? "Mute Dojo Audio" : "Enable Dojo Audio"}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold uppercase tracking-wider transition-all ${
        enabled
          ? "border-amber-500/60 bg-amber-500/15 text-amber-200 shadow-glow-gold"
          : "border-amber-500/20 bg-[#120D1B]/80 text-[#A99BB8] hover:border-amber-500/40 hover:text-[#F6EFE0]"
      }`}
    >
      {enabled ? (
        <Volume2 className="h-3.5 w-3.5 text-amber-400" />
      ) : (
        <VolumeX className="h-3.5 w-3.5" />
      )}
      <span className="hidden md:inline">{enabled ? "Dojo SFX" : "SFX Off"}</span>
    </button>
  );
}
