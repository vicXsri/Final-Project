/** @type {import('tailwindcss').Config} */
// Tailwind just scans the app files; most styling lives in globals and components.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
