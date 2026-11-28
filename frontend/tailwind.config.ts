import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        dojo: {
          void: "#08050D",
          panel: "#120D1B",
          surface: "#1B1328",
          border: "#362547",
          crimson: "#E11D48",
          "crimson-glow": "#FB7185",
          gold: "#F59E0B",
          amber: "#D97706",
          jade: "#10B981",
        },
        arc: {
          blue: "#E11D48",
          "blue-hover": "#BE123C",
          "blue-light": "rgba(225, 29, 72, 0.16)",
          dark: "#08050D",
          card: "#120D1B",
          border: "#2E1F3E",
          surface: "#1B1328",
        },
        lav: {
          50: "#1D1429",
          100: "#281B38",
          200: "#3D2854",
          300: "#593875",
          400: "#9E6B8A",
          500: "#D97706",
          600: "#E11D48",
          700: "#F59E0B",
          800: "#FBBF24",
          900: "#FDE68A",
        },
        ink: {
          DEFAULT: "#F6EFE0",
          soft: "#A99BB8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "SF Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 28px -5px rgba(225, 29, 72, 0.45)",
        "glow-gold": "0 0 28px -5px rgba(245, 158, 11, 0.38)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
