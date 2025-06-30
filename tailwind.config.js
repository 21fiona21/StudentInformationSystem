/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-yellow-100',
    'hover:bg-yellow-200',
    'bg-purple-100',
    'hover:bg-purple-200',
    'bg-pink-100',
    'hover:bg-pink-200',
    'bg-green-100',
    'hover:bg-green-200',
    'bg-red-100',
    'hover:bg-red-200',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}