'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import FoodCard from '@/components/menu/FoodCard'
import { FoodCardSkeleton } from '@/components/ui/Skeleton'
import { getMenuItems, getCategories } from '@/lib/firebase/firestore'
import { MenuItem, Category } from '@/types'
import { Search, X, Leaf, Drumstick } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartStore } from '@/hooks/useCart'
import { formatCurrency } from '@/utils'

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

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || id

  return (
    <div className="min-h-screen bg-brand-background">
      <Navbar />
      <CartDrawer />

      {/* Header */}
      <div className="bg-brand-dark pt-24 pb-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-4xl font-bold text-white">Our Menu</h1>
            <p className="text-gray-200 mt-1">
              {items.filter(i => i.isAvailable).length} items available • Bakes & Delights
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6 relative max-w-lg"
          >
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search for cakes, pastries, cookies..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-brand-primary/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:bg-white/20 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            )}
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters — category pills */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'bg-brand-card text-brand-text-dark hover:text-brand-primary shadow-sm border border-brand-border'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.id
                    ? 'bg-brand-primary text-white shadow-md'
                    : 'bg-brand-card text-brand-text-dark hover:text-brand-primary shadow-sm border border-brand-border'
                }`}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>

          {/* Veg filter */}
          <div className="flex gap-2 flex-shrink-0">
            {(['all', 'veg', 'nonveg'] as const).map(v => (
              <button
                key={v}
                onClick={() => setVegFilter(v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border transition-all ${
                  vegFilter === v
                    ? v === 'veg'
                      ? 'bg-green-500 text-white border-green-500'
                      : v === 'nonveg'
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-brand-dark text-white border-brand-dark'
                    : 'bg-brand-card text-brand-text-dark border-brand-border'
                }`}
              >
                {v === 'veg' && <Leaf size={12} />}
                {v === 'nonveg' && <Drumstick size={12} />}
                {v === 'all' ? 'All' : v === 'veg' ? 'Veg' : 'Non-Veg'}
              </button>
            ))}
          </div>
        </div>

        {/* Menu grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array(8).fill(0).map((_, i) => <FoodCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍰</div>
            <h3 className="font-semibold text-brand-dark text-xl">No items found</h3>
            <p className="text-brand-text-light mt-2">Try a different search or category</p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all'); setVegFilter('all') }}
              className="btn-primary mt-5 text-sm"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([catId, catItems]) => (
              <motion.div key={catId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {Object.keys(grouped).length > 1 && (
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-display text-xl font-bold text-brand-dark">
                      {categories.find(c => c.id === catId)?.icon} {getCategoryName(catId)}
                    </h2>
                    <div className="flex-1 h-px bg-brand-border" />
                    <span className="text-xs text-brand-text-light font-medium">{catItems.length} items</span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {catItems.map(item => <FoodCard key={item.id} item={item} />)}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky cart bar */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30"
          >
            <button
              onClick={openCart}
              className="flex items-center gap-4 bg-brand-primary text-white px-6 py-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <span className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-sm font-bold">
                {count}
              </span>
              <span className="font-semibold">View Cart</span>
              <span className="font-bold">{formatCurrency(tot)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pb-24">
        <Footer />
      </div>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-background flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>}>
      <MenuContent />
    </Suspense>
  )
}
