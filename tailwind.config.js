/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#1f1b24',
        blush: '#f4e9e6',
        rose: '#c97d84',
      },
    },
  },
  plugins: [],
}
