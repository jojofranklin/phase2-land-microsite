/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#00233a',
        'primary-foreground': '#ffffff',
        background: '#fafbfc',
        foreground: '#00233a',
        border: '#e2e8f0',
        muted: '#f0f4f8',
        'muted-foreground': '#5a6b7b',
        accent: '#f5543a',
        cyan: '#16a3d6',
        indigo: '#1a3b6f',
      },
      borderRadius: {
        DEFAULT: '10px',
        sm: '6px',
        md: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Sora', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0,0,0,0.05)',
        md: '0 2px 4px -2px rgba(0,0,0,0.1), 0 4px 6px -1px rgba(0,0,0,0.1)',
        xl: '0 8px 10px -6px rgba(0,0,0,0.1), 0 4px 4px 0 rgba(0,0,0,0.25)',
        '2xl': '0 25px 50px -12px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}
