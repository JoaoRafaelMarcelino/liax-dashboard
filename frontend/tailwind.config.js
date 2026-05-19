/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        liax: {
          primary: '#0074e8',
          'primary-dark': '#1c3775',
          'primary-deeper': '#363063',
          'primary-mid': '#1669f0',
          'primary-light': '#0094f8',
          success: '#17dd30',
          'success-dark': '#00c100',
          warning: '#fcb900',
          'warning-dark': '#ff6900',
          error: '#cc3366',
          info: '#7adcb4',
          text: '#111111',
          'text-dark': '#040434',
          surface: '#fafeff',
          'surface-border': '#e2e8f0',
          bg: '#ededed',
          'bg-light': '#f8f8f8',
          neutral: '#777777',
          'neutral-dark': '#333333',
          'neutral-light': '#cacaca',
        },
      },
      fontFamily: {
        heading: ['"Exo 2"', 'Rubik', '"Segoe UI"', 'sans-serif'],
        body: ['Montserrat', 'Rubik', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        xl: '20px',
        '2xl': '25px',
        '3xl': '35px',
      },
      boxShadow: {
        'liax-sm': 'rgba(0,0,0,0.5) 0px 0px 0px 0px',
        'liax-md': 'rgba(0,0,0,0.5) 0px 0px 4px 0px',
        'liax-lg': 'rgba(0,0,0,0.25) 0px 2px 8px 0px',
        'liax-xl': 'rgba(0,0,0,0.08) 0px 0px 10px 0px',
        'liax-2xl': 'rgba(0,0,0,0.25) 0px 4px 15px 0px',
        'liax-card': 'rgba(0,0,0,0.35) -5px 10px 30px 0px',
      },
    },
  },
  plugins: [],
}
