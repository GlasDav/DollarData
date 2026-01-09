/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Brand Primary - Electric Indigo
                primary: {
                    DEFAULT: '#5D5DFF',
                    hover: '#4B4BE6',
                    light: '#8B8BFF',
                },
                // Surfaces
                surface: {
                    DEFAULT: '#F5F5F7',
                    dark: '#1A1A2E',
                },
                card: {
                    DEFAULT: '#FFFFFF',
                    dark: '#252538',
                },
                // Text
                'text-primary': {
                    DEFAULT: '#191B18',
                    dark: '#F5F5F7',
                },
                'text-muted': {
                    DEFAULT: '#666666',
                    dark: '#9CA3AF',
                },
                // Buttons
                'button-dark': {
                    DEFAULT: '#232522',
                    hover: '#191B18',
                },
                // Borders
                border: {
                    DEFAULT: '#E5E5E7',
                    dark: '#374151',
                },
                // Accents
                accent: {
                    success: '#34D399',
                    warning: '#FB923C',
                    error: '#EF4444',
                    info: '#5D5DFF',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'card': '1.5rem',  // 24px for cards
            },
            boxShadow: {
                'card': '0 4px 24px rgba(0, 0, 0, 0.06)',
                'card-hover': '0 8px 32px rgba(0, 0, 0, 0.08)',
            },
        },
    },
    plugins: [],
}
