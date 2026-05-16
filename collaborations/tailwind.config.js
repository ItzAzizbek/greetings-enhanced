/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'serif'],
      },
      colors: {
        canvas: '#FAFAF7',
        surface: '#FFFFFF',
        sunken: '#F4F3EE',
        line: '#E6E4DD',
        ink: '#1B1B1A',
        muted: '#6F6E68',
        sage: {
          DEFAULT: '#2F5D52',
          soft: '#ECF1EE',
          deep: '#244A42',
        },
      },
      borderRadius: { xl2: '1.25rem' },
    },
  },
  plugins: [],
};
