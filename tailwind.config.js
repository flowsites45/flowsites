/** @type {import('tailwindcss').Config} */
const withOpacity = (variableName) => {
  return ({ opacityValue }) => {
    if (opacityValue !== undefined) {
      return `hsl(var(${variableName}) / ${opacityValue})`;
    }
    return `hsl(var(${variableName}))`;
  };
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: withOpacity("--background"),
        foreground: withOpacity("--foreground"),
        primary: {
          DEFAULT: withOpacity("--primary"),
          foreground: withOpacity("--primary-foreground"),
        },
        secondary: {
          DEFAULT: withOpacity("--secondary"),
          foreground: withOpacity("--secondary-foreground"),
        },
        muted: {
          DEFAULT: withOpacity("--muted"),
          foreground: withOpacity("--muted-foreground"),
        },
        accent: {
          DEFAULT: withOpacity("--accent"),
          foreground: withOpacity("--accent-foreground"),
        },
        border: withOpacity("--border"),
        ring: withOpacity("--ring"),
        /* Rich Pastel Cosmic Palette */
        "pastel-teal": withOpacity("--pastel-teal"),
        "pastel-lavender": withOpacity("--pastel-lavender"),
        "pastel-peach": withOpacity("--pastel-peach"),
        "pastel-coral": withOpacity("--pastel-coral"),
        "pastel-sage": withOpacity("--pastel-sage"),
        "pastel-periwinkle": withOpacity("--pastel-periwinkle"),
        "pastel-gold": withOpacity("--pastel-gold"),
        "pastel-rose": withOpacity("--pastel-rose"),
        "pastel-sky": withOpacity("--pastel-sky"),
        "pastel-mint": withOpacity("--pastel-mint"),
        "pastel-cream": withOpacity("--pastel-cream"),
        "pastel-butter": withOpacity("--pastel-butter"),
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        dashboard: "var(--shadow-dashboard)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
