/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accurate: {
          green: "#008000",
          blue: "#4F81BD",
          headerDark: "#0c4a6e",
          bgLight: "#f8fafc",
        }
      }
    },
  },
  plugins: [],
};
