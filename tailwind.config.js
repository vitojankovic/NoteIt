/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/screens/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["WorkSans_700Bold", "System"], // Set Work Sans 700 as default sans font
    },
      colors: {
        primary: '#90caf9',
        secondary: '#ce93d8',
        accent: '#DEE2E6',
        background: '#121212',
        paper: '#1e1e1e',
        txtp: '#ffffff',
        txts: 'rgba(255, 255, 255, 0.7)',
        btnRadius: '16px',
        warning: '#f44336'
      }
    }, 
  },
  plugins: [],
};
