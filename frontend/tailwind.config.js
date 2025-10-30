/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f7ff',
          100: '#bae7ff',
          500: '#1890ff',
          600: '#096dd9',
          700: '#0050b3',
        },
        hazard: {
          typhoon: '#ff4d4f',
          flood: '#1890ff',
          earthquake: '#faad14',
          landslide: '#8b4513',
          drought: '#fa8c16',
        }
      },
    },
  },
  plugins: [],
}
