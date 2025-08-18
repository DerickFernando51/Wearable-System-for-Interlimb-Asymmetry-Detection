module.exports = {
    plugins: [
      require('tailwindcss'),
      require('autoprefixer'),
    ],
  };
  
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
