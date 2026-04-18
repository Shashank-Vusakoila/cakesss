import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Bakes & Delights — Every Bite, A Delight',
  description: 'Freshly baked cakes, pastries, cookies and more. Order online from Bakes & Delights and get it delivered to your doorstep.',
  keywords: 'bakery, cakes, pastries, cookies, order online, bakes and delights, delivery',
  openGraph: {
    title: 'Bakes & Delights',
    description: 'Every Bite, A Delight',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#2C3E50',
              color: '#FFFFFF',
              borderRadius: '12px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#E67E22', secondary: '#FFFFFF' } },
          }}
        />
      </body>
    </html>
  )
}
