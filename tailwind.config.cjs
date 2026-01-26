module.exports = {
  content: [
    './src/sidepanel/index.html',
    './src/sidepanel/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0d1b2a',
          800: '#1b263b',
          700: '#415a77',
          600: '#778da9',
        },
        accent: {
          500: '#e07a5f',
          400: '#f2cc8f',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
