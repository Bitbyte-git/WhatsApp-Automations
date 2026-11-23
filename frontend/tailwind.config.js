/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          50: '#F0FDF4',
          100: '#DCF8C6', // Light Green
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#25D366', // Primary Green
          600: '#16A34A',
          700: '#075E54', // Dark Green
          800: '#064E3B', // Deep Green
          900: '#022C22',
        },
        brand: {
          green: '#25D366',
          darkGreen: '#075E54',
          deepGreen: '#064E3B',
          lightGreen: '#DCF8C6',
          bg: '#F5F7F8',
          text: '#1F2937',
          border: '#E5E7EB',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'premium': '0 10px 25px -5px rgba(7, 94, 84, 0.08), 0 8px 10px -6px rgba(7, 94, 84, 0.04)',
      }
    },
  },
  plugins: [],
}
