import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    // Next.js routing layer (root).
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // All FSD layers.
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
};

export default config;
