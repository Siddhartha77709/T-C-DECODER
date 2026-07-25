/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Canvas / surface
        canvas: "#F4F6FA",
        surface: "#FFFFFF",
        surfaceAlt: "#F8F9FC",

        // Brand — indigo/violet
        brand: {
          50:  "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
        },

        // Sidebar — deep navy
        navy: {
          50:  "#F0F4FF",
          100: "#E1EAFF",
          200: "#C3D5FF",
          300: "#A4BFFF",
          400: "#7B9EFF",
          500: "#527DFF",
          600: "#2955E7",
          700: "#1A3FC5",
          800: "#152F9E",
          900: "#0F1117",
          950: "#090B0F",
        },

        // Text hierarchy
        obsidian: "#0D1117",
        textPrimary: "#0D1117",
        textSecondary: "#4B5563",
        textMuted: "#9CA3AF",
        slateGray: "#6B7280",

        // Severity colors — danger
        danger: {
          bg:     "#FEF2F2",
          text:   "#B91C1C",
          border: "#FECACA",
          solid:  "#DC2626",
        },

        // Severity colors — caution
        caution: {
          bg:     "#FFFBEB",
          text:   "#92400E",
          border: "#FDE68A",
          solid:  "#D97706",
        },

        // Severity colors — safe
        safe: {
          bg:     "#F0FDF4",
          text:   "#166534",
          border: "#BBF7D0",
          solid:  "#16A34A",
        },
      },

      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "'Fira Code'", "Consolas", "monospace"],
      },

      gridTemplateColumns: {
        20: 'repeat(20, minmax(0, 1fr))',
      },

      boxShadow: {
        premium: "0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)",
        card: "0 2px 8px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
        float: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
        glow: "0 0 0 3px rgba(99,102,241,0.18)",
        'glow-danger': "0 0 0 3px rgba(220,38,38,0.15)",
        'glow-safe': "0 0 0 3px rgba(22,163,74,0.15)",
        'inner-soft': "inset 0 1px 3px rgba(0,0,0,0.04)",
        sidebar: "4px 0 24px rgba(9,11,15,0.25)",
      },

      backgroundImage: {
        'brand-gradient': "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
        'navy-gradient': "linear-gradient(180deg, #0F1117 0%, #090B0F 100%)",
        'hero-gradient': "linear-gradient(135deg, #EEF2FF 0%, #F4F6FA 60%, #FDF4FF 100%)",
        'card-gradient': "linear-gradient(135deg, #FFFFFF 0%, #F8F9FC 100%)",
        'danger-gradient': "linear-gradient(135deg, #FEF2F2 0%, #FFF5F5 100%)",
        'safe-gradient': "linear-gradient(135deg, #F0FDF4 0%, #F7FFF9 100%)",
        'shimmer': "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },

      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.16,1,0.3,1) forwards',
        'shimmer': 'shimmer 2s infinite linear',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'scan-beam': 'scan 3s infinite linear',
        'spin-slow': 'spin 2s linear infinite',
        'bounce-subtle': 'bounceSubtle 0.4s cubic-bezier(0.36,0.07,0.19,0.97)',
        'count-up': 'countUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.97) translateY(4px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)' },
          to:   { transform: 'translateY(0)' },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(99,102,241,0)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(99,102,241,0.15)' },
        },
        scan: {
          '0%':   { top: '0%' },
          '50%':  { top: '100%' },
          '100%': { top: '0%' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'scale(1)' },
          '40%':      { transform: 'scale(0.9)' },
          '70%':      { transform: 'scale(1.1)' },
        },
        countUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
