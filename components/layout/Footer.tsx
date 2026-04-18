'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Cake, MapPin, Phone, Clock, Instagram, Facebook } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Footer() {
  const [clickCount, setClickCount] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const router = useRouter()

  const REQUIRED_CLICKS = 5

  const handleSecretClick = useCallback(() => {
    setClickCount(prev => {
      const next = prev + 1

      if (next === 2) {
        setShowHint(true)
        setTimeout(() => setShowHint(false), 1500)
      }

      if (next >= REQUIRED_CLICKS) {
        setUnlocked(true)
        setTimeout(() => {
          router.push('/login')
        }, 800)
        return 0
      }

      setTimeout(() => setClickCount(0), 3000)
      return next
    })
  }, [router])

  return (
    <footer className="bg-brand-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                <Cake size={22} className="text-brand-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-xl">Bakes & Delights</div>
                <div className="text-xs text-brand-primary">Every Bite, A Delight</div>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed max-w-xs">
              Freshly baked cakes, pastries, cookies and more. Made with love, delivered to your doorstep with care.
            </p>
            <div className="flex items-center gap-3 mt-5">
              <a href="#" className="w-9 h-9 rounded-full bg-brand-primary/20 flex items-center justify-center hover:bg-brand-primary/30 transition-colors text-brand-primary">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-brand-primary/20 flex items-center justify-center hover:bg-brand-primary/30 transition-colors text-brand-primary">
                <Facebook size={16} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest text-brand-primary mb-5">Quick Links</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              {[
                { href: '/', label: 'Home' },
                { href: '/menu', label: 'Menu' },
                { href: '/menu', label: 'Order Online' },
              ].map(link => (
                <li key={link.label}>
                  <Link href={link.href} className="hover:text-brand-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-widest text-brand-primary mb-5">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <MapPin size={14} className="mt-0.5 text-brand-primary flex-shrink-0" />
                <a href="https://maps.app.goo.gl/X2p2SMNrwJmoJkR96" target="_blank" rel="noopener noreferrer" className="hover:text-brand-primary transition-colors">
                  Bakes & Delights
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-brand-primary flex-shrink-0" />
                <span>+91 97010 03268</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock size={14} className="text-brand-primary flex-shrink-0" />
                <span>8:00 AM – 9:00 PM, Daily</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-400">

          {/* ← SECRET TRIGGER: clicking this 5 times opens admin */}
          <span
            onClick={handleSecretClick}
            className="cursor-default select-none relative"
            title=""
          >
            © 2024 Bakes & Delights. All rights reserved.

            {/* Subtle dot progress indicator */}
            <AnimatePresence>
              {clickCount > 0 && clickCount < REQUIRED_CLICKS && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-0.5 ml-2"
                >
                  {Array.from({ length: REQUIRED_CLICKS }).map((_, i) => (
                    <span
                      key={i}
                      className={`inline-block w-1 h-1 rounded-full transition-all duration-200 ${
                        i < clickCount ? 'bg-brand-primary' : 'bg-white/10'
                      }`}
                    />
                  ))}
                </motion.span>
              )}
            </AnimatePresence>
          </span>

          <span>Made with ❤️ for bake lovers</span>
        </div>

        {/* Hint toast */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white/60 text-xs px-4 py-2 rounded-full border border-white/10 pointer-events-none z-50"
            >
              Keep clicking...
            </motion.div>
          )}
        </AnimatePresence>

        {/* Unlock animation */}
        <AnimatePresence>
          {unlocked && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-brand-green-dark/90 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 12 }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-brand-green rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-green">
                  <Cake size={36} className="text-white" />
                </div>
                <p className="text-white font-display text-2xl font-bold">Admin Access</p>
                <p className="text-gray-400 text-sm mt-1">Redirecting to login...</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </footer>
  )
}
