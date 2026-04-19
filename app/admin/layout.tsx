'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/firebase/auth'
import {
  ChefHat, LayoutDashboard, UtensilsCrossed, ClipboardList,
  BarChart3, QrCode, Menu, X, LogOut, Monitor, Loader2, Bell
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { subscribeToOrders } from '@/lib/firebase/firestore'
import toast from 'react-hot-toast'
import { useRef } from 'react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/menu', label: 'Menu', icon: UtensilsCrossed },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/kitchen', label: 'Kitchen Display', icon: Monitor },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const initialOrdersRef = useRef<Set<string> | null>(null)
  const isHome = pathname === '/'

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/login')
    }
  }, [user, loading, isAdmin, router])

  useEffect(() => {
    if (!isAdmin) return

    const unsub = subscribeToOrders((orders) => {
      const orderIds = new Set(orders.map(o => o.id))
      
      // If this is the first run, just capture current IDs
      if (initialOrdersRef.current === null) {
        initialOrdersRef.current = orderIds
        return
      }

      // Check for new orders
      orders.forEach(order => {
        if (!initialOrdersRef.current?.has(order.id) && order.status === 'pending') {
          toast.custom((t) => (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`${
                t.visible ? 'animate-enter' : 'animate-leave'
              } max-w-md w-full bg-white shadow-2xl rounded-[1.5rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 border-l-8 border-brand-primary overflow-hidden`}
            >
              <div className="flex-1 w-0 p-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-brand-primary ring-4 ring-orange-50/50">
                       <Bell size={24} className="animate-bounce" />
                    </div>
                  </div>
                  <div className="ml-5 flex-1">
                    <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-1">New Order Received</p>
                    <p className="text-sm font-black text-gray-900 tracking-tight">
                       {order.customerName} placed a new order!
                    </p>
                    <p className="mt-1 text-xs font-medium text-gray-500 line-clamp-1">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                    <div className="mt-4 flex gap-3">
                       <Link href="/admin/orders" onClick={() => toast.dismiss(t.id)} className="bg-gray-900 text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">View Order</Link>
                       <button onClick={() => toast.dismiss(t.id)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">Dismiss</button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ), { duration: 6000, position: 'bottom-right' })
        }
      })

      initialOrdersRef.current = orderIds
    })

    return () => unsub()
  }, [isAdmin])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-primary" />
      </div>
    )
  }

  if (!user || !isAdmin) return null

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <ChefHat size={18} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-brand-primary">Bakes & Delights</div>
            <div className="text-xs text-gray-400">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-brand-primary">
            {user.email?.[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gray-700 truncate">{user.email}</p>
            <p className="text-xs text-gray-400">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-100 flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-white z-50 md:hidden flex flex-col"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 transition-all"
            >
              <Menu size={20} />
            </button>
            <span className="font-display font-black text-brand-primary tracking-tight">ADMIN PANEL</span>
          </div>
          <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-primary">
            {user.email?.[0].toUpperCase()}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
