/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        primary: "#111111",
        secondary: "#666666",
        border: "#E5E5E5",
        surface: "#F7F7F7",
        surfaceHover: "#F2F2F2",
      },
      borderRadius: {
        DEFAULT: "3px",
        sm: "2px",
        md: "4px",
        lg: "6px",
      },
      fontSize: {
        xxs: "11px",
      }
    },
  },
  plugins: [],
}

