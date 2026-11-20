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
        arc: {
          blue: "#0066FF",
          "blue-hover": "#0052CC",
          "blue-light": "rgba(0, 102, 255, 0.12)",
          dark: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          surface: "#1A2234",
        },
      },
      fontFamily: {
        mono: ["SF Mono", "Fira Code", "Courier New", "monospace"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(0, 102, 255, 0.3)",
        "glow-emerald": "0 0 25px -5px rgba(16, 185, 129, 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
