/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MWD custom color palette
        mwd: {
          // Primary blue scale - more vibrant blue that pops
          blue: {
            50: '#f0f7fc',
            100: '#e3eef7',   // Soft blue-tinted white
            200: '#c4ddf0',
            300: '#9ec8e8',
            400: '#82aed6',   // Light sky blue - rgb(130, 174, 214)
            500: '#4a90c4',
            600: '#2e74a8',
            700: '#1e5a8a',   // Vibrant medium blue
            800: '#164876',   // Rich blue (more blue, less gray)
            900: '#0f3456',
          },
        },
        // Semantic aliases for common uses
        lavender: {
          50: '#f8fafc',     // Lighter
          100: '#eef2f7',    // Lighter lavender background
          200: '#e1e8f0',
        },
      },
    },
  },
  plugins: [],
}
