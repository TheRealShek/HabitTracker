/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        background: '#2B2D31',
        surface: '#35383F',
        'text-primary': '#E8E8E8',
        'text-secondary': '#A8A8A8',
        accent: '#5865F2',
        border: '#3F4248',
      },
    },
  },
  plugins: [],
}
