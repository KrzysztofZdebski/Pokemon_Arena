/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pokemon-themed colors
        'pokemon-red': '#DC143C',
        'pokemon-blue': '#4169E1',
        'pokemon-yellow': '#FFD100',
      }
    },
  },
  plugins: [],
}
