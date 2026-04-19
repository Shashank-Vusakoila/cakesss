'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  ShoppingBag, User, LogOut, Menu as MenuIcon, X, 
  ChevronDown, Search, Heart, MapPin, Sparkles, ArrowRight, Cake
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { signOut } from '@/lib/firebase/auth'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/hooks/useCart'

export default function Navbar() {
  const { user, isAdmin } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toggleCart, itemCount } = useCartStore()
  const cartCount = itemCount()

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    toast.success('Signed out successfully')
    router.push('/')
  }

  const isAdminPath = pathname.startsWith('/admin')
  const isHome = pathname === '/' && !isScrolled

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[60] transition-all duration-700 font-body ${
        isScrolled 
          ? 'py-3 bg-white/70 backdrop-blur-2xl border-b border-slate-100/50 shadow-sm px-4' 
          : 'py-8 bg-transparent px-6'
      }`}
    >
      <div className={`max-w-[1280px] mx-auto transition-all ${isScrolled ? 'px-2' : ''}`}>
        <div className="flex items-center justify-between">
          
          {/* Elite Brand Logo */}
          <Link href="/" className="flex items-center gap-4 group">
             <div className="w-12 h-12 bg-brand-dark rounded-[1.25rem] flex items-center justify-center shadow-xl relative overflow-hidden group-hover:scale-110 transition-transform duration-500">
                <Cake size={24} className="text-white relative z-10" />
                <motion.div 
                   className="absolute inset-0 bg-brand-orange"
                   initial={{ y: '100%' }}
                   whileHover={{ y: '0%' }}
                   transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                />
             </div>
             <div className="flex flex-col">
                <span className={`font-display text-2xl font-black tracking-tighter block leading-none transition-colors duration-500 ${isHome ? 'text-white' : 'text-brand-dark'}`}>
                   Bakes & Delights
                </span>
                <span className={`text-[9px] font-black uppercase tracking-[0.4em] mt-1 transition-colors duration-500 ${isHome ? 'text-white/70' : 'text-brand-orange'}`}>
                   Handcrafted Excellence
                </span>
             </div>
          </Link>

          {/* Nav Links - High Contrast */}
          <div className="hidden lg:flex items-center gap-12">
            <nav className="flex items-center gap-10">
               {['Menu', 'Corporate', 'Specials'].map((item) => (
                  <Link 
                    key={item}
                    href="/menu" 
                    className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all relative group overflow-hidden ${isHome ? 'text-white/80 hover:text-white' : 'text-slate-400 hover:text-brand-dark'}`}
                  >
                    {item}
                    <span className="absolute bottom-[-2px] left-0 w-full h-[2px] bg-brand-orange translate-x-[-105%] group-hover:translate-x-0 transition-transform duration-500" />
                  </Link>
               ))}
            </nav>
            
            <div className={`h-8 w-px transition-colors duration-500 ${isHome ? 'bg-white/10' : 'bg-slate-100'}`} />

            <div className="flex items-center gap-5">
               {/* Cart Intelligence */}
               <motion.div 
                 whileTap={{ scale: 0.9 }}
                 onClick={toggleCart}
                 className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all cursor-pointer group select-none ${
                   isHome 
                    ? 'text-white bg-white/10 hover:bg-white/20' 
                    : 'text-brand-dark bg-slate-50 hover:bg-slate-100'
                 }`}
               >
                  <div className="relative">
                     <ShoppingBag size={20} className="group-hover:rotate-12 transition-transform" />
                     <AnimatePresence>
                        {mounted && cartCount > 0 && (
                           <motion.span 
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              className="absolute -top-2 -right-2 bg-brand-orange text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg"
                           >
                              {cartCount}
                           </motion.span>
                        )}
                     </AnimatePresence>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider">My Cart</span>
               </motion.div>

               {mounted && user ? (
                 <div className="flex items-center gap-3">
                    <Link 
                      href="/profile" 
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all border shadow-sm ${
                        isHome ? 'bg-white/10 border-white/10 text-white hover:bg-white/20' : 'bg-white border-slate-100 text-brand-dark hover:text-brand-orange'
                      }`}
                    >
                       <User size={18} />
                    </Link>
                    
                    {isAdmin && (
                      <Link 
                        href="/admin/dashboard" 
                        className="px-6 py-3 bg-brand-dark text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-orange transition-all shadow-xl shadow-brand-dark/10"
                      >
                         Dashboard
                      </Link>
                    )}
                    
                    <button 
                      onClick={handleSignOut} 
                      className={`p-3 transition-all ${isHome ? 'text-white/60 hover:text-white' : 'text-slate-300 hover:text-red-500'}`}
                    >
                       <LogOut size={20} />
                    </button>
                 </div>
               ) : (
                 <Link 
                   href="/login" 
                   className={`px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${
                     isHome 
                      ? 'bg-white text-brand-dark hover:scale-105 shadow-2xl shadow-white/20' 
                      : 'bg-brand-dark text-white hover:bg-brand-orange shadow-2xl shadow-brand-dark/20'
                   }`}
                 >
                    Member Secret
                 </Link>
               )}
            </div>
          </div>

          {/* Mobile Interactions */}
          <div className="flex items-center gap-2 lg:hidden">
             <button onClick={toggleCart} className={`relative p-3 rounded-2xl transition-colors ${isHome ? 'text-white' : 'text-brand-dark'}`}>
                <ShoppingBag size={24} />
                <AnimatePresence>
                   {mounted && cartCount > 0 && (
                     <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-2 right-2 bg-brand-orange text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-lg"
                     >
                        {cartCount}
                     </motion.span>
                   )}
                </AnimatePresence>
             </button>
             <button 
               onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
               className={`p-3 rounded-2xl transition-colors ${isHome ? 'text-white' : 'text-brand-dark'}`}
             >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? <X size={26} key="x" /> : <MenuIcon size={26} key="menu" />}
                </AnimatePresence>
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Glass Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white/95 backdrop-blur-3xl p-10 lg:hidden shadow-2xl border-l border-slate-50 z-[70] flex flex-col"
          >
             <div className="flex justify-between items-center mb-12">
                 <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-dark rounded-xl flex items-center justify-center text-white"><Cake size={20} /></div>
                    <span className="font-display font-black text-xl tracking-tighter">B&D Mobile</span>
                 </Link>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><X size={20} /></button>
             </div>

             <div className="space-y-4 flex-1">
                {[
                  { label: 'Explore Menu', href: '/menu', icon: Cake },
                  { label: 'Live Tracking', href: '/orders', icon: MapPin },
                  { label: 'Member Profile', href: '/profile', icon: User },
                ].map((item, idx) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Link 
                      href={item.href} 
                      onClick={() => setIsMobileMenuOpen(false)} 
                      className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 hover:bg-slate-100 transition-colors group"
                    >
                       <div className="flex items-center gap-4">
                          <item.icon size={20} className="text-brand-orange" />
                          <span className="text-lg font-black text-brand-dark tracking-tight">{item.label}</span>
                       </div>
                       <ArrowRight size={18} className="text-slate-300 group-hover:text-brand-orange group-hover:translate-x-2 transition-all" />
                    </Link>
                  </motion.div>
                ))}
             </div>

             <div className="mt-auto space-y-4">
                {user ? (
                  <button onClick={handleSignOut} className="w-full py-5 rounded-3xl border-2 border-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest">Terminate Session</button>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full btn-premium py-5 text-center">Member Entry</Link>
                )}
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
