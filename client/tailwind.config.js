/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zenPrimary: '#006B3C',
        zenSecondary: '#0B7A46',
        zenPale: '#EAF6EF',
        zenBg: '#F5F7F6',
      }
    },
  },
  plugins: [],
}
