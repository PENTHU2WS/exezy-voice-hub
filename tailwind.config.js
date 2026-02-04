/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dev-black': '#000000',
        'dev-card': '#0a0a0a',
        'neon-violet': '#8b5cf6',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
