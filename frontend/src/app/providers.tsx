"use client";

import React, { useState, useEffect } from "react";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { config } from "../config/wagmi";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 5000,
          },
        },
      })
  );

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#0066FF",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {mounted ? (
            children
          ) : (
            <div className="min-h-screen bg-[#0B0F19] text-slate-100 antialiased">
              {children}
            </div>
          )}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
