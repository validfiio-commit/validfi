/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#06060a",
        surface: "#0d0d12",
        "surface-2": "#13131a",
        border: "rgba(255,255,255,0.06)",
        "border-hover": "rgba(255,255,255,0.12)",
        ivory: "#eeeae2",
        "ivory-muted": "rgba(238,234,226,0.5)",
        "ivory-dim": "rgba(238,234,226,0.25)",
        accent: "#00f0ff",
        "accent-muted": "rgba(0,240,255,0.1)",
        "accent-border": "rgba(0,240,255,0.2)",
        purple: "#a855f7",
        "purple-muted": "rgba(168,85,247,0.1)",
        green: "#4ade80",
        amber: "#fbbf24",
        red: "#f87171",
      },
      fontFamily: {
        serif: ["Instrument Serif", "Georgia", "serif"],
        sans: ["Onest", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};
