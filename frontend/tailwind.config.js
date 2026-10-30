/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213d',
        muted: '#64748b',
        canvas: '#f5f7fb',
        line: '#e4e9f2',
        brand: '#3457d5',
        'brand-dark': '#263f9f',
      },
      boxShadow: {
        panel: '0 12px 38px rgba(20, 33, 61, 0.06)',
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
}