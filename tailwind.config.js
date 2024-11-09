/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out forwards',
        'slideDown': 'slideDown 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          'from': { 
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          'to': { 
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        slideDown: {
          'from': {
            opacity: '0',
            transform: 'translateY(-10px)',
            maxHeight: '0'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
            maxHeight: '500px'
          },
        },
      },
    },
  },
  plugins: [],
}