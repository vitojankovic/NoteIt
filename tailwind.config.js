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
        primary: '#8BB552',
        secondary: '#C3DE9D',
        accent: '#A8D867',
        background: '#111111'
      }
    }, 
  },
  plugins: [],
};
