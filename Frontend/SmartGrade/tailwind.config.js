/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Arial', 'sans-serif'],   //  this is the main fix
      },

      colors: {
        brand: {
          DEFAULT: "#2F2A27",
          light: "#F5F3F1",
          muted: "#6B625C",
          accent: "#9C8F87",
        },
      },
    },
  },
  plugins: [],
};