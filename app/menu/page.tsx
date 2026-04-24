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
import { Search, X, Leaf, Drumstick, ArrowRight, Sparkles, Filter, Heart, Star } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import FilterModal from '@/components/menu/FilterModal'
import { formatCurrency, sanitizeBakeryData, getValidImageUrl } from '@/utils'

function MenuContent() {
  const searchParams = useSearchParams()
  const initialCat = searchParams.get('category') || 'all'
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(initialCat)
  const [vegFilter, setVegFilter] = useState<'all' | 'veg' | 'nonveg'>('all')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'rating'>('default')
  const [budgetFilter, setBudgetFilter] = useState(false)
  const [offersFilter, setOffersFilter] = useState(false)
  const [favoritesFilter, setFavoritesFilter] = useState(false)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string[]>([])
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const { itemCount, total, openCart } = useCartStore()
  const { favorites, isFavorite, toggleFavorite } = useFavorites()
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

  useEffect(() => {
    if (!loading && items.length > 0 && initialCat !== 'all') {
      setTimeout(() => {
        scrollToCategory(initialCat)
      }, 300)
    }
  }, [loading, items.length, initialCat])

  const filtered = useMemo(() => {
    let result = items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())
      const matchVeg = vegFilter === 'all' || (vegFilter === 'veg' ? item.isVeg : !item.isVeg)
      const matchBudget = !budgetFilter || item.price < 300
      const matchOffer = !offersFilter || (item.originalPrice && item.originalPrice > item.price)
      const matchFav = !favoritesFilter || favorites.includes(item.id)
      const matchCatFilter = activeCategoryFilter.length === 0 || activeCategoryFilter.includes(item.category)
      return matchSearch && matchVeg && matchBudget && matchOffer && matchFav && matchCatFilter
    })

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price)
    else if (sortBy === 'rating') result.sort((a, b) => (b.rating || 0) - (a.rating || 0))

    return result
  }, [items, search, vegFilter, sortBy, budgetFilter, offersFilter, favoritesFilter, favorites, activeCategoryFilter])

  const grouped = useMemo(() => {
    const g: Record<string, MenuItem[]> = {}
    filtered.forEach(item => {
      if (!g[item.category]) g[item.category] = []
      g[item.category].push(item)
    })
    
    // Sort so bestsellers appear first in each category
    Object.keys(g).forEach(key => {
      g[key].sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0))
    })
    
    return g
  }, [filtered])

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
      <div className="bg-[#02060C] pt-[100px] pb-4 px-4 sm:px-8 border-b border-white/10 sticky top-0 z-20 shadow-md mt-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
               <div className="flex items-center gap-2 mb-1">
                  <Sparkles size={12} className="text-white animate-pulse" />
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">Delivering To</span>
               </div>
               <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">Sreenidhi Boys Hostel <span className="text-sm">▼</span></h1>
            </div>

            {/* Prominent Search Bar */}
            <div className="relative w-full max-w-xl">
               <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none transition-colors group-focus-within:text-brand-orange" />
               <input
                 type="text"
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 placeholder="Search for 'Cake'"
                 className="w-full pl-14 pr-12 py-3.5 rounded-2xl bg-white/10 border border-white/20 focus:border-brand-orange/50 focus:bg-white focus:text-brand-dark focus:ring-4 focus:ring-brand-orange/10 focus:outline-none transition-all font-semibold text-sm text-white placeholder-slate-400"
               />
               <AnimatePresence>
                 {search && (
                   <motion.button 
                     initial={{ opacity: 0, scale: 0.8 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     onClick={() => setSearch('')} 
                     className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white/20 text-white rounded-full hover:bg-brand-orange transition-all"
                   >
                     <X size={14} />
                   </motion.button>
                 )}
               </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 lg:hidden">
             <div className="flex-1 flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-1">
                <button
                  onClick={() => scrollToCategory('all')}
                  className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all ${
                    activeCategory === 'all' ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${activeCategory === 'all' ? 'bg-brand-orange' : 'bg-white/10'}`}>
                    <span className="font-bold text-xs">All</span>
                  </div>
                  <span className="text-[10px] font-bold text-white tracking-wide">All Bakes</span>
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => scrollToCategory(cat.id)}
                    className={`flex flex-col items-center gap-2 flex-shrink-0 transition-all ${
                      activeCategory === cat.id ? 'opacity-100 scale-105' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden border-2 ${activeCategory === cat.id ? 'border-brand-orange' : 'border-transparent bg-white/10'}`}>
                       {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/')) ? (
                         <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-2xl">{cat.icon || "🍰"}</span>
                       )}
                    </div>
                    <span className="text-[10px] font-bold text-white tracking-wide whitespace-nowrap">{sanitizeBakeryData(cat.name)}</span>
                  </button>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-[1240px] mx-auto px-4 py-6">

        {/* Quick Filters Row (Swiggy Style) */}
        <div className="flex items-center gap-3 mb-6 overflow-x-visible pb-4 border-b border-slate-200/60 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative z-30">
           
           <div className="relative flex-shrink-0">
              <button 
                 onClick={() => setIsFilterModalOpen(true)}
                 className={`px-4 py-2 bg-white border border-slate-200 rounded-full text-[13px] font-semibold text-brand-dark shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${(budgetFilter || offersFilter || activeCategoryFilter.length > 0) ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' : ''}`}
              >
                 <Filter size={14} /> Filter 
                 {activeCategoryFilter.length > 0 && <span className="w-2 h-2 bg-brand-orange rounded-full ml-1" />}
              </button>
           </div>

           <div className="relative flex-shrink-0">
              <button 
                 onClick={() => setIsFilterModalOpen(true)}
                 className={`px-4 py-2 border rounded-full text-[13px] font-semibold shadow-sm transition-colors flex items-center gap-1 ${sortBy !== 'default' ? 'bg-brand-orange/5 border-brand-orange text-brand-orange' : 'bg-white border-slate-200 text-brand-dark hover:bg-slate-50'}`}
              >
                 Sort By {sortBy !== 'default' && <span className="ml-1 text-brand-orange font-bold">({sortBy === 'price-asc' ? 'Low to High' : sortBy === 'price-desc' ? 'High to Low' : 'Rating'})</span>} <span className="ml-1 text-slate-400 text-[10px]">▼</span>
              </button>
           </div>
           <button 
              onClick={() => setVegFilter(vegFilter === 'veg' ? 'all' : 'veg')}
              className={`flex-shrink-0 px-4 py-2 border rounded-full text-[13px] font-semibold shadow-sm transition-colors ${vegFilter === 'veg' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-200 text-brand-dark hover:bg-slate-50'}`}
           >
              Pure Veg
           </button>
           <button 
              onClick={() => setVegFilter(vegFilter === 'nonveg' ? 'all' : 'nonveg')}
              className={`flex-shrink-0 px-4 py-2 border rounded-full text-[13px] font-semibold shadow-sm transition-colors ${vegFilter === 'nonveg' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-brand-dark hover:bg-slate-50'}`}
           >
              Non Veg
           </button>
           <button 
              onClick={() => setBudgetFilter(!budgetFilter)}
              className={`flex-shrink-0 px-4 py-2 border rounded-full text-[13px] font-semibold shadow-sm transition-colors ${budgetFilter ? 'bg-brand-orange/5 border-brand-orange text-brand-orange' : 'bg-white border-slate-200 text-brand-dark hover:bg-slate-50'}`}
           >
              Less than Rs. 300
           </button>
           <button 
              onClick={() => setOffersFilter(!offersFilter)}
              className={`flex-shrink-0 px-4 py-2 border rounded-full text-[13px] font-semibold shadow-sm transition-colors ${offersFilter ? 'bg-brand-orange/5 border-brand-orange text-brand-orange' : 'bg-white border-slate-200 text-brand-dark hover:bg-slate-50'}`}
           >
              Offers
           </button>
           <button 
              onClick={() => setFavoritesFilter(!favoritesFilter)}
              className={`flex-shrink-0 px-4 py-2 border rounded-full text-[13px] font-semibold shadow-sm transition-colors flex items-center gap-1.5 ${favoritesFilter ? 'bg-brand-orange/5 border-brand-orange text-[#FF5252]' : 'bg-white border-slate-200 text-brand-dark hover:bg-slate-50'}`}
           >
              <Heart size={14} className={favoritesFilter ? 'fill-[#FF5252]' : ''} /> Favorites
           </button>
        </div>

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
              <div className="space-y-16">
                {/* In the Spotlight Section */}
                {activeCategory === 'all' && !search && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                  >
                    <h3 className="text-[19px] font-black text-brand-dark mb-4 tracking-tight px-1">In the Spotlight</h3>
                    <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
                      {items.slice(0, 5).map((spotlightItem, idx) => (
                        <div key={spotlightItem.id} className="snap-start flex-shrink-0 w-[160px] md:w-[240px]">
                           <div className="bg-white rounded-[2rem] h-full shadow-card relative overflow-hidden group border border-slate-100 flex flex-col">
                             <div className="absolute top-3 right-3 z-10">
                               <button 
                                 onClick={() => toggleFavorite(spotlightItem.id)}
                                 className={`p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm transition-colors ${isFavorite(spotlightItem.id) ? 'text-[#FF5252]' : 'text-slate-400 hover:text-[#FF5252]'}`}
                               >
                                  <Heart size={16} className={isFavorite(spotlightItem.id) ? 'fill-[#FF5252]' : ''} />
                               </button>
                             </div>
                             
                             {/* Deal tag overlay */}
                             <div className="absolute top-3 left-0 bg-[#FF5252] text-white text-[9px] font-black px-2 py-1 rounded-r-lg z-10 flex flex-col">
                               <span>10% Extra O...</span>
                               <span>Free Delivery</span>
                             </div>

                             <div className={`relative h-32 md:h-48 w-full overflow-hidden ${idx % 2 === 0 ? 'bg-gradient-to-b from-[#E41F25] to-[#1B1112]' : 'bg-gradient-to-b from-[#0E0E0E] to-[#1D1B17]'}`}>
                               <img src={getValidImageUrl(spotlightItem.image, "")} alt={spotlightItem.name} className="w-[85%] h-[85%] object-cover absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-[1.5rem] shadow-2xl drop-shadow-2xl" />
                               
                               <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg">
                                 <p className="text-[9px] font-black uppercase tracking-wider opacity-90 leading-none mb-0.5">ITEMS AT</p>
                                 <p className="text-sm font-black leading-none">{formatCurrency(spotlightItem.price)}</p>
                               </div>
                             </div>
                             
                             <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
                               <h4 className="text-brand-dark font-bold text-[15px] leading-tight mb-1 line-clamp-1">{spotlightItem.name}</h4>
                               <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                                 <div className="flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1 rounded-full"><Star size={10} className="fill-emerald-600" /> {spotlightItem.rating || "4.5"}</div>
                                 <span>•</span>
                                 <span>{spotlightItem.prepTime || "30-35"} mins</span>
                               </div>
                               <p className="text-slate-400 text-[11px] mt-1 line-clamp-1">{sanitizeBakeryData(spotlightItem.category)}</p>
                             </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Categories or Flat Sorted List */}
                {sortBy === 'default' ? (
                  Object.entries(grouped).map(([catId, catItems], catIdx) => (
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
                  ))
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                  >
                    <div className="mb-10 flex items-end justify-between px-2">
                       <div>
                          <p className="text-[10px] font-black text-brand-orange uppercase tracking-[0.3em] mb-1">Sorted Results</p>
                          <h2 className="text-3xl font-black text-brand-dark tracking-tighter">
                             {sortBy === 'price-asc' ? 'Cost: Low to High' : sortBy === 'price-desc' ? 'Cost: High to Low' : 'Highest Rated'}
                          </h2>
                       </div>
                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          {filtered.length} Selections
                       </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {filtered.map((item, itemIdx) => (
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
                )}
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
      
      {/* Advanced Swiggy Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        sortBy={sortBy}
        setSortBy={setSortBy}
        vegFilter={vegFilter}
        setVegFilter={setVegFilter}
        budgetFilter={budgetFilter}
        setBudgetFilter={setBudgetFilter}
        offersFilter={offersFilter}
        setOffersFilter={setOffersFilter}
        categories={categories}
        activeCategoryFilter={activeCategoryFilter}
        setActiveCategoryFilter={setActiveCategoryFilter}
      />
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
