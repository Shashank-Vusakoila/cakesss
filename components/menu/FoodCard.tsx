'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Star, Clock, Heart, Sparkles, ShoppingCart } from 'lucide-react'
import { MenuItem } from '@/types'
import { useCartStore } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { formatCurrency, getValidImageUrl, sanitizeBakeryData } from '@/utils'
import toast from 'react-hot-toast'

interface Props { item: MenuItem }

export default function FoodCard({ item }: Props) {
  const { items, addItem, updateQuantity } = useCartStore()
  const { isFavorite, toggleFavorite } = useFavorites()
  const cartItem = items.find(i => i.menuItem.id === item.id)
  const qty = cartItem?.quantity ?? 0
  const [imgError, setImgError] = useState(false)
  const isFav = isFavorite(item.id)

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
      className="flex gap-4 md:gap-6 py-6 border-b border-slate-100 last:border-0 group relative bg-white md:bg-transparent md:p-6 md:rounded-3xl md:hover:bg-white md:hover:shadow-xl transition-all duration-300"
    >
      {/* Information - Left Side */}
      <div className="flex-1 min-w-0 flex flex-col justify-start pt-1">
        <div className="flex items-center gap-2 mb-1.5">
          <div className={item.isVeg ? 'veg-dot' : 'non-veg-dot'} />
          {item.isBestseller && (
            <span className="text-[10px] font-bold text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded-md">Bestseller</span>
          )}
        </div>
        
        <h3 className="font-bold text-brand-dark text-[17px] mb-1 leading-tight line-clamp-2">
          {item.name}
        </h3>
        
        {item.rating && (
           <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                 <div className="w-3.5 h-3.5 bg-[#118C4F] rounded-full flex items-center justify-center">
                    <Star size={8} className="text-white fill-white" />
                 </div>
                 <span className="text-[13px] font-bold text-brand-dark">{item.rating}</span>
                 <span className="text-[13px] text-slate-500">(100+)</span>
              </div>
           </div>
        )}

        <div className="flex items-center gap-3 mt-1 mb-3">
          <span className="text-[15px] font-bold text-brand-dark">{formatCurrency(item.price)}</span>
          {item.originalPrice && item.originalPrice > item.price && (
            <span className="text-xs text-slate-400 line-through">
              {formatCurrency(item.originalPrice)}
            </span>
          )}
        </div>
        
        {item.description && (
          <p className="text-[13px] text-slate-500 leading-relaxed line-clamp-2 pr-4">
            {item.description}
          </p>
        )}
      </div>

      {/* Image & Action - Right Side */}
      <div className="relative flex-shrink-0 flex flex-col items-center">
        <div className="relative w-[130px] h-[130px] md:w-[150px] md:h-[150px] rounded-2xl overflow-hidden shadow-sm bg-slate-50">
           <Image
             src={getValidImageUrl(imgError ? fallback : item.image, fallback)}
             alt={item.name}
             fill
             className="object-cover transition-transform duration-700"
             onError={() => setImgError(true)}
           />
           <div className="absolute top-2 right-2 z-10">
              <button 
                onClick={(e) => { e.preventDefault(); toggleFavorite(item.id); }}
                className={`w-7 h-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm transition-colors ${isFav ? 'text-[#FF5252]' : 'text-slate-400 hover:text-[#FF5252]'}`}
              >
                 <Heart size={14} className={isFav ? 'fill-[#FF5252]' : ''} />
              </button>
           </div>
        </div>

        {/* Action Button */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[85%] z-10">
          {item.isAvailable ? (
            <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.12)] border border-slate-100 h-10 flex items-center justify-center overflow-hidden">
               <AnimatePresence mode="wait">
                  {qty === 0 ? (
                    <button
                      onClick={handleAdd}
                      className="w-full h-full text-[#118C4F] font-black text-[15px] transition-all flex items-center justify-center"
                    >
                      ADD
                    </button>
                  ) : (
                    <div className="flex items-center justify-between w-full h-full text-[#118C4F]">
                       <button
                         onClick={() => updateQuantity(item.id, qty - 1)}
                         className="w-10 h-full flex items-center justify-center hover:bg-slate-50 transition-colors"
                       >
                         <Minus size={14} className="stroke-[3]" />
                       </button>
                       <span className="text-[15px] font-black tabular-nums">{qty}</span>
                       <button
                         onClick={() => updateQuantity(item.id, qty + 1)}
                         className="w-10 h-full flex items-center justify-center hover:bg-slate-50 transition-colors"
                       >
                         <Plus size={14} className="stroke-[3]" />
                       </button>
                    </div>
                  )}
               </AnimatePresence>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-100 h-10 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
               Sold Out
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
