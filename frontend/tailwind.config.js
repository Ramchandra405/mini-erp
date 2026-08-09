/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#d9e6ff",
          200: "#b3ccff",
          300: "#82abff",
          400: "#5285ff",
          500: "#2f62f5",
          600: "#1f47d1",
          700: "#1c39a8",
          800: "#1c3286",
          900: "#1c2d6b",
        },
      },
    },
  },
  plugins: [],
};
