import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, DM_Sans } from 'next/font/google'
import './globals.css'
import { NavigationProgress } from '@/components/shared/navigation-progress'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { DarkModeProvider } from '@/hooks/use-dark-mode'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Orchidée NMS',
  description: 'Système de gestion commerciale — Cosmetiques & Epices',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Orchidée NMS' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/icons/icon-192.png', sizes: '192x192' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
  other: { 'mobile-web-app-capable': 'yes' },
}

export const viewport: Viewport = {
  themeColor: '#2C5219',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${dmSans.variable}`}>
      <head>
        {/* Évite le flash de mode au chargement */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            var t = localStorage.getItem('orchidee-theme');
            var d = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            if ((t || d) === 'dark') document.documentElement.classList.add('dark');
          })()
        `}} />
        <script dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js') }`,
        }} />
      </head>
      <body className="font-body antialiased">
        <NavigationProgress />
        <ThemeProvider />
        <DarkModeProvider>
          {children}
        </DarkModeProvider>
      </body>
    </html>
  )
}
