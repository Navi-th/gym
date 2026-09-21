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
        brand: {
          50: '#fff1f2',
          100: '#ffe4e6',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          900: '#881337',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': 'radial-gradient(circle at 50% 0%, rgba(225, 29, 72, 0.15) 0%, transparent 60%)',
      }
    },
  },
  plugins: [],
};
export default config;
