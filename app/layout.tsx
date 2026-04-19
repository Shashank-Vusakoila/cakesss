import type { Metadata } from 'next'
import '../styles/globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: {
    default: 'Bakes & Delights — Every Bite, A Story',
    template: '%s | Bakes & Delights'
  },
  description: 'Premium gourmet bakery and cafe delivery. Order freshly baked cakes, pastries, handcrafted cookies, and more from Bakes & Delights. Fast delivery to your doorstep.',
  keywords: ['bakery', 'gourmet cakes', 'online cake delivery', 'pastries', 'premium bakery', 'Bakes & Delights', 'food delivery'],
  authors: [{ name: 'Bakes & Delights Team' }],
  creator: 'Bakes & Delights',
  publisher: 'Bakes & Delights',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Bakes & Delights — Every Bite, A Delight',
    description: 'Freshly baked gourmet delights delivered to your door.',
    url: 'https://bakes-and-delights.example.com',
    siteName: 'Bakes & Delights',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bakes & Delights',
    description: 'Freshly baked gourmet delights delivered to your door.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=Outfit:wght@100;200;300;400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body selection:bg-brand-primary selection:text-white">
        {children}
        <Toaster
          position="top-center"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#1A1A1A',
              borderRadius: '20px',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              fontWeight: '700',
              padding: '16px 24px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.05)',
            },
            success: {
               iconTheme: { primary: '#FF6B2C', secondary: '#FFFFFF' },
            },
            error: {
               iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
            }
          }}
        />
      </body>
    </html>
  )
}
