/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1A54F2",
          light: "var(--brand-light)",
          hover: "#4D78F4",
          btn: "var(--brand-btn)",
          "btn-hover": "var(--brand-btn-hover)",
          "btn-active": "var(--brand-btn-active)",
        },
        border: "var(--border)",
        surface: {
          DEFAULT: "var(--surface)",
          secondary: "var(--surface-secondary)",
        },
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "sm": ["13px", { lineHeight: "18px" }],
        "base": ["15px", { lineHeight: "22px" }],
        "lg": ["17px", { lineHeight: "24px" }],
        "xl": ["22px", { lineHeight: "28px" }],
      },
      borderRadius: {
        "lg": "8px",
        "xl": "12px",
        "2xl": "16px",
        "full": "9999px",
      },
      boxShadow: {
        "sm": "0 1px 2px rgba(0,0,0,0.1)",
        "lg": "0 4px 12px rgba(0,0,0,0.15)",
        "none": "none",
      },
    },
  },
  plugins: [],
};
