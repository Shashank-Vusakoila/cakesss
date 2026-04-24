'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { Category } from '@/types'
import { sanitizeBakeryData } from '@/utils'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  sortBy: 'default' | 'price-asc' | 'price-desc' | 'rating'
  setSortBy: (val: 'default' | 'price-asc' | 'price-desc' | 'rating') => void
  vegFilter: 'all' | 'veg' | 'nonveg'
  setVegFilter: (val: 'all' | 'veg' | 'nonveg') => void
  budgetFilter: boolean
  setBudgetFilter: (val: boolean) => void
  offersFilter: boolean
  setOffersFilter: (val: boolean) => void
  categories: Category[]
  activeCategoryFilter: string[]
  setActiveCategoryFilter: (cats: string[]) => void
}

export default function FilterModal({
  isOpen,
  onClose,
  sortBy,
  setSortBy,
  vegFilter,
  setVegFilter,
  budgetFilter,
  setBudgetFilter,
  offersFilter,
  setOffersFilter,
  categories,
  activeCategoryFilter,
  setActiveCategoryFilter
}: FilterModalProps) {
  const [activeTab, setActiveTab] = useState('Sort')
  const [searchCat, setSearchCat] = useState('')

  const tabs = [
    'Sort',
    'Offers',
    'Cost for two',
    'Veg/Non-Veg',
    'Category'
  ]

  const clearAll = () => {
    setSortBy('default')
    setVegFilter('all')
    setBudgetFilter(false)
    setOffersFilter(false)
    setActiveCategoryFilter([])
  }

  const toggleCat = (id: string) => {
    if (activeCategoryFilter.includes(id)) {
      setActiveCategoryFilter(activeCategoryFilter.filter(c => c !== id))
    } else {
      setActiveCategoryFilter([...activeCategoryFilter, id])
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full md:w-[600px] h-[85vh] md:h-[600px] bg-white rounded-t-3xl md:rounded-3xl flex flex-col overflow-hidden shadow-2xl pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-brand-dark">Filter</h2>
              <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0">
              {/* Left Sidebar */}
              <div className="w-1/3 bg-slate-50 border-r border-slate-100 overflow-y-auto">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full text-left px-4 py-4 text-sm font-bold relative ${
                      activeTab === tab ? 'text-brand-orange bg-white' : 'text-slate-600 hover:bg-slate-100/50'
                    }`}
                  >
                    {activeTab === tab && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-orange rounded-r" />
                    )}
                    {tab}
                  </button>
                ))}
              </div>

              {/* Right Content */}
              <div className="w-2/3 bg-white overflow-y-auto p-4 md:p-6">
                {activeTab === 'Sort' && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Sort By</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" checked={sortBy === 'default'} onChange={() => setSortBy('default')} className="w-4 h-4 accent-brand-orange" />
                      <span className="text-sm font-semibold text-brand-dark">Relevance (Default)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" checked={sortBy === 'rating'} onChange={() => setSortBy('rating')} className="w-4 h-4 accent-brand-orange" />
                      <span className="text-sm font-semibold text-brand-dark">Rating: High to Low</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" checked={sortBy === 'price-asc'} onChange={() => setSortBy('price-asc')} className="w-4 h-4 accent-brand-orange" />
                      <span className="text-sm font-semibold text-brand-dark">Cost: Low to High</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" checked={sortBy === 'price-desc'} onChange={() => setSortBy('price-desc')} className="w-4 h-4 accent-brand-orange" />
                      <span className="text-sm font-semibold text-brand-dark">Cost: High to Low</span>
                    </label>
                  </div>
                )}

                {activeTab === 'Offers' && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Filter By Offers</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={offersFilter} onChange={(e) => setOffersFilter(e.target.checked)} className="w-4 h-4 accent-brand-orange rounded" />
                      <span className="text-sm font-semibold text-brand-dark">Special Offers & Discounts</span>
                    </label>
                  </div>
                )}

                {activeTab === 'Cost for two' && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Filter By Budget</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={budgetFilter} onChange={(e) => setBudgetFilter(e.target.checked)} className="w-4 h-4 accent-brand-orange rounded" />
                      <span className="text-sm font-semibold text-brand-dark">Less than Rs. 300</span>
                    </label>
                  </div>
                )}

                {activeTab === 'Veg/Non-Veg' && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Filter By Dietary</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" checked={vegFilter === 'all'} onChange={() => setVegFilter('all')} className="w-4 h-4 accent-brand-orange" />
                      <span className="text-sm font-semibold text-brand-dark">All</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" checked={vegFilter === 'veg'} onChange={() => setVegFilter('veg')} className="w-4 h-4 accent-brand-orange" />
                      <span className="text-sm font-semibold text-brand-dark">Pure Veg Only</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="radio" checked={vegFilter === 'nonveg'} onChange={() => setVegFilter('nonveg')} className="w-4 h-4 accent-brand-orange" />
                      <span className="text-sm font-semibold text-brand-dark">Non-Veg Only</span>
                    </label>
                  </div>
                )}

                {activeTab === 'Category' && (
                  <div className="space-y-4 flex flex-col h-full">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Filter By Category</p>
                    <div className="relative mb-4">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search for Categories" 
                        value={searchCat}
                        onChange={(e) => setSearchCat(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                      {categories.filter(c => c.name.toLowerCase().includes(searchCat.toLowerCase())).map(cat => (
                        <label key={cat.id} className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={activeCategoryFilter.includes(cat.id)} 
                            onChange={() => toggleCat(cat.id)} 
                            className="w-4 h-4 accent-brand-orange rounded" 
                          />
                          <span className="text-sm font-semibold text-brand-dark">{sanitizeBakeryData(cat.name)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white">
              <button onClick={clearAll} className="text-brand-orange font-bold text-sm px-4 py-2 hover:bg-brand-orange/5 rounded-lg transition-colors">
                Clear Filters
              </button>
              <button onClick={onClose} className="bg-brand-orange text-white font-bold text-sm px-8 py-3 rounded-xl shadow-orange hover:bg-brand-red transition-colors">
                Apply
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
