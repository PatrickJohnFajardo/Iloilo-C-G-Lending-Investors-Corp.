import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark Mode Palette
        obsidian: {
          950: "#080B14",
          900: "#0D0F1A",
          800: "#121629",
          700: "#1A1F35",
          600: "#232840",
        },
        gold: {
          300: "#F0D070",
          400: "#E8C547",
          500: "#D4AF37",
          600: "#B8960C",
          700: "#96780A",
        },
        emerald: {
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
        },
        // Light Mode Palette
        navy: {
          950: "#060D1F",
          900: "#0A1535",
          800: "#112060",
          700: "#1E2B5F",
          600: "#2D3D7A",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Inter Display'", "Inter", "sans-serif"],
      },
      boxShadow: {
        "glow-gold": "0 0 20px rgba(212, 175, 55, 0.25)",
        "glow-emerald": "0 0 20px rgba(16, 185, 129, 0.25)",
        "glow-navy": "0 0 20px rgba(30, 43, 95, 0.25)",
        "card-dark": "0 4px 24px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)",
        "card-light": "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
        "elevated-dark": "0 8px 40px rgba(0,0,0,0.5)",
        "elevated-light": "0 8px 40px rgba(0,0,0,0.1)",
      },
      backgroundImage: {
        "gradient-dark":
          "radial-gradient(ellipse at top left, #1A1F35 0%, #0D0F1A 50%, #080B14 100%)",
        "gradient-light":
          "radial-gradient(ellipse at top left, #EEF2FF 0%, #FFFFFF 50%, #F8F9FA 100%)",
        "gradient-gold":
          "linear-gradient(135deg, #D4AF37 0%, #E8C547 50%, #B8960C 100%)",
        "gradient-navy":
          "linear-gradient(135deg, #112060 0%, #1E2B5F 50%, #2D3D7A 100%)",
        "shimmer":
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in": "slideIn 0.3s ease-out",
        "shimmer": "shimmer 2s infinite",
        "pulse-gold": "pulseGold 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseGold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212, 175, 55, 0)" },
          "50%": { boxShadow: "0 0 0 8px rgba(212, 175, 55, 0.15)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      borderRadius: {
        "2.5xl": "1.125rem",
      },
      transitionDuration: {
        "400": "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
