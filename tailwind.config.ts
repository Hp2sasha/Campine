import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefbf4",
          100: "#d5f5e3",
          200: "#aeeacb",
          300: "#79d8ac",
          400: "#41bd89",
          500: "#1ea26e",
          600: "#118258",
          700: "#0e6849",
          800: "#0d533b",
          900: "#0b4432",
          950: "#05261c",
        },
        sand: {
          50: "#faf7f2",
          100: "#f3ede2",
          200: "#e6d9c3",
          300: "#d5bf9e",
          400: "#c3a177",
          500: "#b68c5c",
          600: "#a97a50",
          700: "#8d6243",
          800: "#73513b",
          900: "#5e4332",
        },
      },
      fontFamily: {
        sans: ["Vazirmatn", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,.06), 0 8px 24px -12px rgba(16,24,40,.12)",
      },
    },
  },
  plugins: [],
};

export default config;
