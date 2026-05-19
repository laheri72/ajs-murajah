import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#fbfaf4",
        foreground: "#17201c",
        primary: {
          DEFAULT: "#047857",
          foreground: "#ffffff",
        },
        gold: {
          DEFAULT: "#c99a2e",
          soft: "#f6ead0",
        },
        muted: {
          DEFAULT: "#f0eee5",
          foreground: "#647067",
        },
        border: "#ddd8c8",
      },
      boxShadow: {
        soft: "0 12px 30px rgba(23, 32, 28, 0.08)",
      },
    },
  },
  plugins: [],
} satisfies Config;
