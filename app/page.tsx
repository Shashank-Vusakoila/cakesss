'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import { getMenuItems, getCategories, subscribeToOrders, updateMenuItem } from '@/lib/firebase/firestore'
import { MenuItem, Category, Order } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { getStatusDescription, getValidImageUrl, sanitizeBakeryData } from '@/utils'
import { useCartStore } from '@/hooks/useCart'
import toast from 'react-hot-toast'
import {
  Star, Clock, MapPin, ChevronLeft, ChevronRight, Truck, Sparkles, Utensils, Heart, ShoppingBag, Leaf, Zap, ArrowRight
} from 'lucide-react'

export default function HomePage() {
  const { user, isAdmin, loading: authLoading } = useAuth()
  const { addItem } = useCartStore()
  const router = useRouter()

  // Auto-redirect admin users to admin dashboard
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      router.replace('/admin/dashboard')
    }
  }, [authLoading, user, isAdmin, router])
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOrder, setActiveOrder] = useState<Order | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      try {
        const [menuItems, cats] = await Promise.all([
          getMenuItems(),
          getCategories()
        ])
        setItems(menuItems)
        setCategories(cats.filter(c => c.isActive))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!user) {
      setActiveOrder(null)
      return
    }
    const unsub = subscribeToOrders((orders) => {
      const active = orders.find(o => 
        o.userId === user.uid && 
        !['delivered', 'completed', 'cancelled'].includes(o.status)
      )
      setActiveOrder(active || null)
    })
    return () => unsub()
  }, [user])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const offset = direction === 'left' ? -clientWidth / 2 : clientWidth / 2
      scrollRef.current.scrollTo({ left: scrollLeft + offset, behavior: 'smooth' })
    }
  }

  const bestsellers = items.filter(item => item.isBestseller)
  const displayBestsellers = bestsellers.length > 0 ? bestsellers : items.filter(item => (item.rating || 0) >= 4.5).slice(0, 3)

  return (
    <div className="min-h-screen bg-[#FAFAF8] font-body selection:bg-brand-orange selection:text-white overflow-x-hidden">
      <Navbar />
      <CartDrawer />

      {/* PREMIUM HERO SECTION */}
      <section className="relative h-[70vh] md:h-[85vh] lg:h-screen flex items-center justify-center overflow-hidden">
         {/* Premium background image placeholder */}
         <div className="absolute inset-0 z-0">
            <Image 
              src="https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1600&q=80" 
              alt="Bakery Showcase" 
              fill 
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
         </div>
         
         <div className="max-w-[1240px] mx-auto px-4 w-full relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="flex flex-col items-center"
            >

               <h1 className="font-display text-5xl md:text-8xl lg:text-[10rem] font-bold text-white tracking-tighter leading-[0.85] mb-8 md:mb-12">
                  Every Bite, <br />
                  <span className="gradient-text italic">A Story.</span>
               </h1>
               
               <p className="text-white/80 text-base md:text-xl font-medium mb-10 md:mb-16 max-w-2xl leading-relaxed italic-font px-4 md:px-0">
                  Discover the finest cakes, freshest treats, and warmest moments at B&D, your neighborhood&apos;s most loved cafe.
               </p>
               
               <div className="flex flex-col sm:flex-row gap-6">
                  <Link href="/menu" className="btn-primary flex items-center justify-center gap-4 group">
                     Order Now <ChevronRight size={16} />
                  </Link>
                  <Link href="/menu" className="btn-secondary">
                     Explore Menu
                  </Link>
               </div>
            </motion.div>
         </div>
         
         {/* Floating bottom indicator */}
         <motion.div 
           animate={{ y: [0, 10, 0] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="absolute bottom-12 left-1/2 -translate-x-1/2 transform flex flex-col items-center gap-2"
         >
            <div className="w-[1px] h-12 bg-gradient-to-t from-white/60 to-transparent" />
         </motion.div>
      </section>

      {/* FEATURES SECTION - Mobile-first clean layout */}
      <section className="py-12 md:py-20 bg-white relative z-20 px-4 md:px-6">
         <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row gap-4 md:gap-8">
            {[
               { icon: Leaf, title: 'Fresh Ingredients', desc: 'Locally sourced, prepared daily', color: 'text-green-500', bg: 'bg-green-50' },
               { icon: Zap, title: 'Fast Service', desc: 'Order to doorstep in minutes', color: 'text-brand-orange', bg: 'bg-orange-50' },
               { icon: Heart, title: 'Made with Love', desc: 'Every item crafted with care', color: 'text-brand-red', bg: 'bg-red-50' }
            ].map((feature, i) => (
               <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex-1 bg-[#FAFAF8] rounded-2xl md:rounded-[2rem] p-5 md:p-8 flex items-center md:items-start gap-4 md:gap-6 border border-gray-100/50 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-500 group"
               >
                  <div className={`w-11 h-11 md:w-14 md:h-14 ${feature.bg} rounded-xl md:rounded-2xl flex items-center justify-center ${feature.color} flex-shrink-0 transform group-hover:scale-110 transition-transform`}>
                     <feature.icon size={20} className="md:hidden" />
                     <feature.icon size={26} className="hidden md:block" />
                  </div>
                  <div>
                     <h3 className="text-sm md:text-lg font-black text-brand-dark mb-0.5 md:mb-1 tracking-tight">{feature.title}</h3>
                     <p className="text-gray-400 font-medium text-[11px] md:text-xs leading-relaxed">{feature.desc}</p>
                  </div>
               </motion.div>
            ))}
         </div>
      </section>

      {/* DYNAMIC CATEGORY SECTION */}
      <section className="py-16 md:py-32 bg-white">
        <div className="max-w-[1240px] mx-auto px-4">
           <div className="flex items-end justify-between mb-10 md:mb-20">
              <div>
                 <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.4em] mb-2 md:mb-4 block">Gourmet Selection</span>
                 <h2 className="text-3xl md:text-5xl font-black text-brand-dark tracking-tighter leading-none">Curated For You</h2>
              </div>
              <div className="hidden md:flex gap-4">
                 <button onClick={() => scroll('left')} className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand-orange transition-all active:scale-95"><ChevronLeft size={28} /></button>
                 <button onClick={() => scroll('right')} className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand-orange transition-all active:scale-95"><ChevronRight size={28} /></button>
              </div>
           </div>
           
           <div 
             ref={scrollRef}
             className="flex gap-6 md:gap-16 overflow-x-auto pb-8 md:pb-12 scrollbar-hide px-2 snap-x snap-mandatory"
           >
              {loading ? (
                [1,2,3,4,5,6].map(i => (
                  <div key={i} className="flex flex-col items-center gap-6">
                    <div className="w-32 md:w-44 aspect-square rounded-full skeleton" />
                    <div className="h-4 w-20 rounded skeleton" />
                  </div>
                ))
              ) : categories.map((cat, i) => (
                <motion.div 
                  key={cat.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex flex-col items-center group cursor-pointer flex-shrink-0"
                >
                   <Link href={`/menu?category=${cat.name}`} className="flex flex-col items-center">
                    <div className="relative w-24 md:w-44 aspect-square rounded-full overflow-hidden mb-4 md:mb-8 transition-all duration-700 group-hover:scale-105 group-hover:rotate-3 ring-0 group-hover:ring-[12px] ring-brand-orange/5 shadow-lg group-hover:shadow-2xl snap-center">
                        <Image 
                          src={getValidImageUrl(cat.icon, "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80")} 
                          alt={cat.name}
                          fill
                          className="object-cover"
                        />
                    </div>
                    <span className="text-xs md:text-sm font-black text-brand-dark tracking-tight uppercase group-hover:text-brand-orange transition-colors duration-300">{sanitizeBakeryData(cat.name)}</span>
                   </Link>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* BESTSELLERS SECTION [REDESIGN] */}
      <section className="py-16 md:py-32 bg-[#FFFAF8]">
        <div className="max-w-[1240px] mx-auto px-4">
           <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 md:mb-20 px-2">
              <div className="flex items-center gap-3 md:gap-4">
                 <div className="w-12 h-12 md:w-16 md:h-16 bg-brand-orange/10 rounded-xl md:rounded-2xl flex items-center justify-center text-brand-orange shadow-inner">
                    <Utensils size={24} className="md:hidden" />
                    <Utensils size={32} className="hidden md:block" />
                 </div>
                 <div>
                    <h2 className="text-3xl md:text-5xl font-black text-brand-dark tracking-tighter leading-none flex items-center gap-2 md:gap-4">
                       Bestsellers <Sparkles size={20} className="text-brand-orange md:w-6 md:h-6" />
                    </h2>
                    <p className="text-gray-400 font-medium text-xs md:text-sm mt-1 md:mt-3 tracking-tight italic-font">Most loved by our community</p>
                 </div>
              </div>
              <Link href="/menu" className="group flex items-center gap-3 text-sm font-black text-brand-orange uppercase tracking-widest hover:gap-5 transition-all">
                 View All <ArrowRight size={18} />
              </Link>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-x-12 md:gap-y-20">
              {loading ? (
                [1,2,3].map(i => (
                  <div key={i} className="skeleton h-[480px] w-full rounded-[3rem]" />
                ))
              ) : displayBestsellers.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="card group overflow-hidden"
                >
                  <div className="relative h-72 w-full overflow-hidden">
                     <Image 
                       src={getValidImageUrl(item.image, "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80")} 
                       alt={item.name} 
                       fill 
                       className="object-cover group-hover:scale-105 transition-transform duration-700" 
                     />
                     
                     <div className="absolute top-6 left-6">
                        <span className="bg-[#FF9A3C] text-white text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg flex items-center gap-2">
                           <Sparkles size={12} fill="currentColor" /> Bestseller
                        </span>
                     </div>

                     <div className="absolute top-6 right-6">
                        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-white/20">
                           <div className={item.isVeg ? 'veg-dot' : 'nonveg-dot'} />
                        </div>
                     </div>
                  </div>

                  <div className="p-6 md:p-10">
                     <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4 text-[10px] md:text-xs font-black text-gray-500 uppercase tracking-widest">
                        <div className="flex items-center gap-1.5 bg-brand-success/10 text-brand-success px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg">
                           <Star size={11} fill="currentColor" /> {item.rating || '4.9'}
                        </div>
                        <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-gray-200" />
                        <div className="flex items-center gap-1.5">
                           <Clock size={14} className="text-brand-orange" /> {item.prepTime || '25'} MINS
                        </div>
                     </div>
                     
                     <h3 className="text-2xl md:text-3xl font-black text-brand-dark mb-5 md:mb-8 tracking-tight group-hover:text-brand-orange transition-colors leading-none">{sanitizeBakeryData(item.name)}</h3>
                     
                     <div className="flex items-center justify-between pt-5 md:pt-8 border-t border-gray-100">
                        <div className="flex flex-col">
                           <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Total Price</span>
                           <span className="text-3xl md:text-4xl font-black text-brand-dark leading-none tracking-tighter">₹{item.price.toLocaleString('en-IN')}</span>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            addItem(item)
                            toast.success(`${item.name} added to cart!`)
                          }}
                          className="w-14 h-14 md:w-16 md:h-16 bg-brand-orange rounded-2xl flex items-center justify-center text-white shadow-orange hover:bg-brand-red transition-all duration-300 hover:scale-110 active:scale-95"
                        >
                           <ShoppingBag size={28} />
                        </button>
                     </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      <Footer />

      {/* PERSISTENT TRACKER */}
      <AnimatePresence>
        {activeOrder && (
          <motion.div
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4 md:pb-8 md:px-12 flex justify-center"
          >
             <div className="glass-dark max-w-[900px] w-full p-4 md:p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-white/5">
                <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-brand-orange rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-brand-orange/30 animate-pulse">
                      <Truck size={28} className="text-white" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Live Operation Active</p>
                      <h4 className="text-base md:text-lg font-black text-white tracking-tight">{getStatusDescription(activeOrder.status)}</h4>
                   </div>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <div className="hidden lg:block text-right mr-4 border-r border-white/10 pr-6">
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Order ID</p>
                      <p className="text-white font-mono text-xs font-bold mt-0.5">#{activeOrder.orderNumber.split('-')[1]}</p>
                   </div>
                   <Link 
                     href={`/tracking/${activeOrder.id}`} 
                     className="flex-1 md:flex-none py-4 px-10 bg-white text-brand-dark rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center"
                   >
                     Track Live
                   </Link>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
