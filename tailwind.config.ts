import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand tokens (DESIGN_SYSTEM §2) — never hardcode hex in components.
        orange: { DEFAULT: '#F26522', 600: '#D9551A', 50: '#FFF1E9' },
        navy: { DEFAULT: '#10295C', 700: '#1C3D78', 900: '#0A1A3F' },
        ink: '#0E1B3A',
        muted: '#64748B',
        surface: '#F5F7FB',
        line: '#E7EBF3',
        ok: '#1E9E62',
        okbg: '#E7F6EE',
        bad: '#E5484D',
        badbg: '#FDECEC',
        warn: '#E8920C',
        warnbg: '#FDF3E2',
        // shadcn semantic tokens (mapped to the theme via HSL vars in globals.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        xl: '16px',
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,41,92,.06), 0 8px 24px rgba(16,41,92,.06)',
        primary: '0 6px 16px rgba(242,101,34,.3)',
        nav: '0 6px 16px rgba(242,101,34,.35)',
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
} satisfies Config
