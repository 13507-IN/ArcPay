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
      title={enabled ? "Mute Dojo Soundscape & SFX" : "Enable Dojo Audio & SFX"}
      aria-label={enabled ? "Mute Dojo Audio" : "Enable Dojo Audio"}
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold uppercase tracking-wider transition-all ${
        enabled
          ? "border-[#C8925A] bg-[#C8925A]/15 text-[#C8925A]"
          : "border-[#27272F] bg-[#111114] text-[#8F8E94] hover:border-[#C8925A]/50 hover:text-[#F4F1EA]"
      }`}
    >
      {enabled ? (
        <Volume2 className="h-3.5 w-3.5 text-[#C8925A]" />
      ) : (
        <VolumeX className="h-3.5 w-3.5" />
      )}
      <span className="hidden md:inline">{enabled ? "Dojo SFX" : "SFX Off"}</span>
    </button>
  );
}
