/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        ysabeau: ['Ysabeau Office', 'sans-serif'],
        roboto: ['Roboto Mono', 'monospace'],
        martian: ['Martian Mono', 'monospace'],
        cascadia: ['Cascadia Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
