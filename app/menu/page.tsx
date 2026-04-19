'use client'
import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import FoodCard from '@/components/menu/FoodCard'
import { FoodCardSkeleton } from '@/components/ui/Skeleton'
import { getMenuItems, getCategories } from '@/lib/firebase/firestore'
import { MenuItem, Category } from '@/types'
import { Search, X, Leaf, Drumstick, ArrowRight, Sparkles, Filter } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/hooks/useCart'
import { formatCurrency, sanitizeBakeryData } from '@/utils'

function MenuContent() {
  const searchParams = useSearchParams()
  const initialCat = searchParams.get('category') || 'all'
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(initialCat)
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all')
  const { itemCount, total, openCart } = useCartStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const count = itemCount()
  const tot = total()

  useEffect(() => {
    async function load() {
      try {
        const [menuData, catData] = await Promise.all([getMenuItems(), getCategories()])
        setItems(menuData)
        setCategories(catData.filter(c => c.isActive))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      const matchCat = activeCategory === 'all' || item.category === activeCategory
      const matchVeg = vegFilter === 'all' || (vegFilter === 'veg' ? item.isVeg : !item.isVeg)
      return matchSearch && matchCat && matchVeg
    })
  }, [items, search, activeCategory, vegFilter])

  const grouped = useMemo(() => {
    if (activeCategory !== 'all') return { [activeCategory]: filtered }
    const g: Record<string, MenuItem[]> = {}
    filtered.forEach(item => {
      if (!g[item.category]) g[item.category] = []
      g[item.category].push(item)
    })
    return g
  }, [filtered, activeCategory])

  const getCategoryName = (id: string) => {
    const name = categories.find(c => c.id === id)?.name || id
    return sanitizeBakeryData(name)
  }

  const scrollToCategory = (id: string) => {
    setActiveCategory(id)
    if (id === 'all') {
       window.scrollTo({ top: 0, behavior: 'smooth' })
       return
    }
    const el = document.getElementById(`cat-${id}`)
    if (el) {
       const offset = 160 // Account for sticky headers
       const bodyRect = document.body.getBoundingClientRect().top
       const elementRect = el.getBoundingClientRect().top
       const elementPosition = elementRect - bodyRect
       const offsetPosition = elementPosition - offset
       window.scrollTo({ top: offsetPosition, behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] selection:bg-brand-orange selection:text-white font-body">
      <Navbar />
      <CartDrawer />

      {/* Header - More Compact & Punchy */}
      <div className="bg-white pt-28 pb-8 px-4 sm:px-8 border-b border-slate-100 sticky top-0 z-20 shadow-sm glass">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-brand-orange animate-pulse" />
                  <span className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em]">Signature Selection</span>
               </div>
               <h1 className="font-display text-4xl font-black text-brand-dark tracking-tighter">Our Menu</h1>
            </div>

            {/* Prominent Search Bar */}
            <div className="relative w-full max-w-xl">
               <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none transition-colors group-focus-within:text-brand-orange" />
               <input
                 type="text"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 placeholder="Search for cakes, pastries..."
                 className="w-full pl-14 pr-12 py-4 rounded-2xl bg-[#FAFAF8] border border-transparent focus:border-brand-orange/20 focus:bg-white focus:ring-4 focus:ring-brand-orange/5 focus:outline-none transition-all font-semibold text-sm text-brand-dark placeholder-slate-300"
               />
               <AnimatePresence>
                 {search && (
                   <motion.button 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     onClick={() => setSearch('')} 
                     className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl hover:bg-brand-orange hover:text-white transition-all shadow-sm"
                   >
                     <X size={14} />
                   </motion.button>
                 )}
               </AnimatePresence>
            </div>
          </div>

          {/* Mobile Category Scroller */}
          <div className="flex items-center gap-4 mt-8 lg:hidden">
             <div className="w-10 h-10 rounded-xl bg-brand-dark text-white flex items-center justify-center flex-shrink-0 shadow-lg">
                <Filter size={16} />
             </div>
             <div className="flex-1 flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                <button
                  onClick={() => scrollToCategory('all')}
                  className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeCategory === 'all' ? 'bg-brand-orange text-white shadow-md' : 'bg-[#FAFAF8] text-slate-400 border border-slate-100'
                  }`}
                >
                  All Bakes
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`flex-shrink-0 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeCategory === cat.id ? 'bg-brand-orange text-white shadow-md' : 'bg-[#FAFAF8] text-slate-400 border border-slate-100'
                    }`}
                  >
                    {sanitizeBakeryData(cat.name)}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-[1240px] mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Desktop Left Sidebar: Sticky & Elite */}
          <div className="hidden lg:block w-72 flex-shrink-0">
             <div className="sticky top-40 space-y-3">
                <div className="p-1.5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-1">
                   <button
                     onClick={() => scrollToCategory('all')}
                     className={`w-full text-left px-6 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                       activeCategory === 'all'
                         ? 'bg-white text-brand-orange shadow-sm'
                         : 'text-slate-400 hover:text-brand-dark hover:bg-white/50'
                     }`}
                   >
                     All Collection
                   </button>
                   {categories.map(cat => (
                     <button
                       key={cat.id}
                       onClick={() => scrollToCategory(cat.id)}
                       className={`w-full text-left px-6 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${
                         activeCategory === cat.id
                           ? 'bg-white text-brand-orange shadow-sm'
                           : 'text-slate-400 hover:text-brand-dark hover:bg-white/50'
                       }`}
                     >
                       {sanitizeBakeryData(cat.name)}
                     </button>
                   ))}
                </div>

                {/* Quick Filters */}
                <div className="p-6 bg-white rounded-[2rem] border border-slate-50 shadow-sm mt-8">
                   <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Dietary Preferences</h4>
                   <div className="space-y-3">
                      {(['all', 'veg', 'nonveg'] as const).map(v => (
                        <button
                          key={v}
                          onClick={() => setVegFilter(v)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                            vegFilter === v ? 'bg-brand-orange/5 text-brand-orange' : 'text-slate-400'
                          }`}
                        >
                           <span className="text-xs font-bold">{v === 'all' ? 'Everything' : v === 'veg' ? 'Pure Veg' : 'Non-Vegetarian'}</span>
                           <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${vegFilter === v ? 'border-brand-orange' : 'border-slate-100'}`}>
                              {vegFilter === v && <div className="w-1.5 h-1.5 bg-brand-orange rounded-full" />}
                           </div>
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          {/* Right Content List */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-16">
                {[1, 2].map(i => (
                  <div key={i} className="space-y-8">
                    <div className="skeleton h-10 w-64 rounded-xl" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {[1, 2, 3, 4].map(j => <div key={j} className="skeleton h-48 w-full rounded-[2.5rem]" />)}
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-32 bg-white rounded-[3rem] border border-slate-50">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                   <Search size={32} className="text-slate-200" />
                </div>
                <h3 className="text-2xl font-black text-brand-dark tracking-tight">No Recipe Found</h3>
                <p className="text-sm text-slate-400 mt-2 font-medium italic italic-font">We couldn't find any matches for your search.</p>
                <button onClick={() => {setSearch(''); setVegFilter('all'); setActiveCategory('all')}} className="mt-8 text-brand-orange font-black text-xs uppercase tracking-widest hover:underline decoration-2 underline-offset-8">Clear Intelligence</button>
              </motion.div>
            ) : (
              <div className="space-y-24">
                {Object.entries(grouped).map(([catId, catItems], catIdx) => (
                  <motion.div 
                    key={catId} 
                    id={`cat-${catId}`} 
                    className="scroll-mt-48"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ delay: catIdx * 0.1 }}
                  >
                    <div className="mb-10 flex items-end justify-between px-2">
                       <div>
                          <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-1">Bakery Masterpiece</p>
                          <h2 className="text-3xl font-black text-brand-dark tracking-tighter">
                             {getCategoryName(catId)}
                          </h2>
                       </div>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          {catItems.length} Selections
                       </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {catItems.map((item, itemIdx) => (
                         <motion.div 
                          key={item.id} 
                          initial={{ opacity: 0, scale: 0.95 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: itemIdx * 0.05 }}
                         >
                            <FoodCard item={item} />
                         </motion.div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Modern Cart Bar */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2.5rem)] max-w-lg"
          >
            <button
              onClick={openCart}
              className="w-full flex items-center justify-between bg-brand-dark text-white p-2.5 pr-8 rounded-[2.5rem] shadow-2xl shadow-black/30 group hover:scale-[1.02] active:scale-95 transition-all duration-300 overflow-hidden relative"
            >
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent w-full h-full"
                animate={{ x: ['100%', '-100%'] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-brand-orange text-white rounded-[1.8rem] flex items-center justify-center text-lg font-black shadow-lg">
                  {count}
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Bake Summary</p>
                  <p className="font-black text-xl tracking-tight">{formatCurrency(tot)}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 font-black text-xs uppercase tracking-widest relative z-10">
                Proceed to Checkout
                <ArrowRight size={20} className="text-brand-orange group-hover:translate-x-2 transition-transform duration-300" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 pb-12">
        <Footer />
      </div>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full animate-spin" />
    </div>}>
      <MenuContent />
    </Suspense>
  )
}
