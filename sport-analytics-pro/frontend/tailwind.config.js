/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    { pattern: /bg-(emerald|green|blue|yellow|orange|red|cyan|purple|indigo)-(400|500)/ },
    { pattern: /text-(emerald|green|blue|yellow|orange|red|cyan|purple|indigo)-(300|400|500)/ },
    { pattern: /border-(emerald|green|blue|yellow|orange|red|cyan|purple|indigo)-(300|400|500)/ },
    { pattern: /bg-(emerald|green|blue|yellow|orange|red)-(500)\/(10|15|20)/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
