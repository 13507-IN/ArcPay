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
        obsidian: {
          void: "#09090B",
          panel: "#111114",
          card: "#141418",
          elevated: "#1C1C22",
          border: "#27272F",
        },
        bronze: {
          DEFAULT: "#C8925A",
          hover: "#D9A46D",
          muted: "#9B6E42",
          soft: "rgba(200, 146, 90, 0.12)",
        },
        lav: {
          50: "#141418",
          100: "#1A1A20",
          200: "#27272F",
          300: "#3A3A45",
          400: "#8F8E94",
          500: "#C8925A",
          600: "#C8925A",
          700: "#D9A46D",
          800: "#E8C399",
          900: "#F4F1EA",
        },
        ink: {
          DEFAULT: "#F4F1EA",
          soft: "#8F8E94",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "SF Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 8px 30px -10px rgba(200, 146, 90, 0.25)",
        "glow-gold": "0 8px 30px -10px rgba(200, 146, 90, 0.25)",
        "glow-emerald": "0 8px 25px -10px rgba(200, 146, 90, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
