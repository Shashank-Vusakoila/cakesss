'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Star, Clock, Heart, Sparkles, ShoppingCart } from 'lucide-react'
import { MenuItem } from '@/types'
import { useCartStore } from '@/hooks/useCart'
import { formatCurrency, getValidImageUrl } from '@/utils'
import toast from 'react-hot-toast'

interface Props { item: MenuItem }

export default function FoodCard({ item }: Props) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find(i => i.menuItem.id === item.id)
  const qty = cartItem?.quantity ?? 0
  const [imgError, setImgError] = useState(false)

  const fallback = `https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80`

  const handleAdd = () => {
    addItem(item)
    toast.success(`${item.name} added to cart!`, {
      style: {
        background: '#0F172A',
        color: '#FFFFFF',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        padding: '16px 24px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
      },
      icon: <Sparkles className="text-brand-orange" size={16} />
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="flex gap-8 py-10 border-b border-slate-50 last:border-0 group relative"
    >
      {/* Information - Left Side */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-4 mb-4">
          <div className={item.isVeg ? 'veg-dot' : 'non-veg-dot'} />
          {item.isBestseller && (
            <div className="flex items-center gap-1.5 bg-[#FF6B20]/5 px-3 py-1 rounded-full border border-[#FF6B20]/10">
               <Sparkles size={10} className="text-[#FF6B20] fill-[#FF6B20]" />
               <span className="text-[9px] font-black text-[#FF6B20] uppercase tracking-widest">Masterpiece</span>
            </div>
          )}
        </div>
        
        <h3 className="font-display font-black text-brand-dark text-2xl mb-1 tracking-tighter group-hover:text-brand-orange transition-all duration-300">
          {item.name}
        </h3>
        
        <div className="flex items-center gap-3 mb-4">
          <span className="text-lg font-black text-brand-dark tracking-tight">{formatCurrency(item.price)}</span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs font-bold text-slate-300 line-through decoration-brand-orange/20 decoration-2">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
        </div>

        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2 pr-10">
          {item.description}
        </p>

        {item.rating && (
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100 shadow-sm">
                 <Star size={14} className="text-emerald-500 fill-emerald-500" />
                 <span className="text-xs font-black text-emerald-600">{item.rating}</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-slate-100" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Crated Excellence</span>
           </div>
        )}
      </div>

      {/* Image & Action - Right Side */}
      <div className="relative flex-shrink-0 flex items-center">
        <div className="relative w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-[3rem] overflow-hidden shadow-card border-[6px] border-white group-hover:shadow-xl group-hover:scale-[1.05] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
           <Image
             src={getValidImageUrl(imgError ? fallback : item.image, fallback)}
             alt={item.name}
             fill
             className="object-cover group-hover:scale-125 transition-transform duration-1000"
             onError={() => setImgError(true)}
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        {/* Action Button - More Premium Feel */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] z-10 px-1">
          {item.isAvailable ? (
            <div className="bg-white rounded-[1.5rem] shadow-2xl shadow-black/10 border border-slate-50 h-14 flex items-center justify-center overflow-hidden ring-4 ring-white/50 backdrop-blur-sm">
               <AnimatePresence mode="wait">
                  {qty === 0 ? (
                    <button
                      onClick={handleAdd}
                      className="w-full h-full text-brand-dark font-black text-[10px] uppercase tracking-[0.25em] hover:bg-brand-orange hover:text-white transition-all flex items-center justify-center gap-3 group/btn"
                    >
                      <span>ADD BAKE</span>
                      <Plus size={16} className="stroke-[3] group-hover/btn:rotate-90 transition-transform duration-500" />
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full h-full text-brand-orange">
                       <button
                         onClick={() => updateQuantity(item.id, qty - 1)}
                         className="w-12 h-full flex items-center justify-center hover:bg-slate-50 transition-colors"
                       >
                         <Minus size={16} className="stroke-[3]" />
                       </button>
                       <span className="text-base font-black text-brand-dark tabular-nums">{qty}</span>
                       <button
                         onClick={() => updateQuantity(item.id, qty + 1)}
                         className="w-12 h-full flex items-center justify-center hover:bg-slate-50 transition-colors"
                       >
                         <Plus size={16} className="stroke-[3]" />
                       </button>
                    </div>
                  )}
               </AnimatePresence>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-[1.5rem] shadow-lg border border-slate-100 h-14 flex items-center justify-center text-[10px] font-black text-slate-300 uppercase tracking-widest px-6 ring-4 ring-white italic-font">
               Crafting Soon...
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
