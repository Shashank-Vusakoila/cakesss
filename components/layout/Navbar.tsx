'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCartStore } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { ShoppingCart, Menu, X, Cake, User, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from '@/lib/firebase/auth'
import { subscribeToOrders } from '@/lib/firebase/firestore'
import { Order } from '@/types'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { itemCount, toggleCart } = useCartStore()
  const { user } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hasActiveOrder, setHasActiveOrder] = useState<string | null>(null)
  const count = itemCount()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    if (!user) {
      setHasActiveOrder(null)
      return
    }

    const unsub = subscribeToOrders((orders) => {
      const active = orders.find(o => 
        o.userId === user.uid && 
        !['delivered', 'completed', 'cancelled'].includes(o.status)
      )
      setHasActiveOrder(active?.id || null)
    })

    return () => unsub()
  }, [user])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/menu', label: 'Menu' },
  ]

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
  }

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
          scrolled ? 'glass shadow-md py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-brand-primary rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Cake size={20} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold text-lg text-brand-dark">Bakes & Delights</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-brand-text-light hover:text-brand-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
            {hasActiveOrder && (
              <Link
                href={`/order/${hasActiveOrder}`}
                className="text-sm font-bold text-brand-primary flex items-center gap-2 group"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                </span>
                Track Order
              </Link>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Cart */}
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={toggleCart}
              className="relative w-10 h-10 flex items-center justify-center rounded-full bg-brand-primary text-white hover:bg-brand-green-dark transition-all shadow-md hover:shadow-lg"
            >
              <ShoppingCart size={20} />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-brand-dark text-white text-xs font-bold rounded-full flex items-center justify-center"
                  >
                    {count > 9 ? '9+' : count}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Auth */}
            {user ? (
              <div className="hidden md:flex items-center gap-2">
                <div className="w-9 h-9 bg-brand-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-brand-primary">
                  {(user.displayName?.[0] || user.email?.[0] || 'U').toUpperCase()}
                </div>
                <button onClick={handleSignOut} className="text-brand-text-light hover:text-red-500 transition-colors" title="Sign Out">
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link href="/login" className="hidden md:flex items-center gap-1.5 text-sm font-medium text-brand-primary hover:text-brand-green-dark transition-colors">
                <User size={16} /> Login
              </Link>
            )}

            <Link
              href="/menu"
              className="hidden md:flex btn-primary text-sm py-2.5 px-5"
            >
              Order Now
            </Link>

            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white shadow-md text-brand-text-dark"
              onClick={() => setMobileOpen(v => !v)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass border-t border-brand-border px-4 py-4 flex flex-col gap-3"
            >
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-2 text-brand-text-dark font-medium hover:text-brand-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <button onClick={handleSignOut} className="py-2 text-red-500 font-medium text-left">
                  Sign Out
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="py-2 text-brand-primary font-medium">
                  Login / Sign Up
                </Link>
              )}
              <Link href="/menu" className="btn-primary text-sm text-center" onClick={() => setMobileOpen(false)}>
                Order Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  )
}
