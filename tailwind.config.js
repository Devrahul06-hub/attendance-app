/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef4ff',
          100: '#dbe6ff',
          200: '#bcd1ff',
          300: '#8eb1ff',
          400: '#5a86ff',
          500: '#345fff',
          600: '#1f3df5',
          700: '#1a2fd9',
          800: '#1a2bae',
          900: '#1c2a89',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)',
        card: '0 4px 20px -2px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
