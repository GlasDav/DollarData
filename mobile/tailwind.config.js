/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          hover: "rgb(var(--color-primary-hover) / <alpha-value>)",
          light: "rgb(var(--color-primary-light) / <alpha-value>)",
        },
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        card: "rgb(var(--color-card) / <alpha-value>)",
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        },
        border: "rgb(var(--color-border) / <alpha-value>)",
        accent: {
          success: "rgb(var(--color-accent-success) / <alpha-value>)",
          warning: "rgb(var(--color-accent-warning) / <alpha-value>)",
          error: "rgb(var(--color-accent-error) / <alpha-value>)",
          info: "rgb(var(--color-accent-info) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["SpaceMono"], // Temporary until Inter is added
      }
    },
  },
  plugins: [],
}
