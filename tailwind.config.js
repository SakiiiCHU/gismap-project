/** @type {import('tailwindcss').Config} */
import { heroui } from '@heroui/react'
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontSize: {
        12: '0.75rem',
        16: '1rem',
      },
      fontFamily: {
        // 預設字體
        sans: ['IBM Plex Mono', 'Noto Sans TC'],
        // 中文襯線體
        cn: ['"Noto Serif TC"', 'serif'],
        // 英文襯線體
        en: ['"Unna"', 'serif'],
        // 特殊字體
        kanit: ['"Kanit"', 'serif'],
      },
      fontWeight: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },

      colors: {
        gray: {
          DEFAULT: '#f5f5f5',
          50: '#FCFCFC',
          100: '#FBFBFB',
          200: '#FAFAFA',
          300: '#F8F8F8',
          400: '#F7F7F7',
          500: '#f5f5f5',
          600: '#CECECE',
          700: '#A7A7A7',
          800: '#7F7F7F',
          900: '#585858',
        },
        red: {
          DEFAULT: '#F0686C',
          50: '#FBD5D6',
          100: '#FAC9CA',
          200: '#F7B0B3',
          300: '#F5989B',
          400: '#F2808D',
          500: '#F0686C',
          600: '#CA575B',
          700: '#A34749',
          800: '#7D3638',
          900: '#562527',
        },
        yellow: {
          DEFAULT: '#FFC45C',
          50: '#FFF0D1',
          100: '#FFECC4',
          200: '#FFE3AA',
          300: '#FFDB90',
          400: '#FFD276',
          500: '#FFCA5C',
          600: '#D6AA4D',
          700: '#AD893F',
          800: '#856930',
          900: '#5C4921',
        },
        green: {
          DEFAULT: '#5DC7B7',
          50: '#D2EFEB',
          100: '#C5EBE5',
          200: '#ABE2DA',
          300: '#91D9CE',
          400: '#77D0C3',
          500: '#5DC7B7',
          600: '#4EA79A',
          700: '#3F877C',
          800: '#30675F',
          900: '#214842',
        },
        zinc: {
          DEFAULT: '#D9D9D9',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [
    heroui({
      addCommonColors: true,
      layout: {
        fontSize: {
          small: '12px',
        },
      },
      themes: {
        light: {
          colors: {
            background: '#000000 ',
            primary: {
              DEFAULT: '#3B4163',
              50: '#C8CAD3',
              100: '#B8BBC7',
              200: '#999CAE',
              300: '#7A7E95',
              400: '#5A5D7C',
              500: '#3B4163',
              600: '#323753',
              700: '#282C43',
              800: '#1F2233',
              900: '#151724',
            },
            secondary: {
              DEFAULT: '#E3C8B9',
            },
            danger: {
              DEFAULT: '#FFFFFF',
            },
            warning: {
              DEFAULT: '#000000',
            },
          },
        },
      },
    }),
  ],
}
