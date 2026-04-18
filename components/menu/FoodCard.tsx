'use client'
import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Minus, Star, Clock, Heart } from 'lucide-react'
import { MenuItem } from '@/types'
import { useCartStore } from '@/hooks/useCart'
import { formatCurrency } from '@/utils'
import toast from 'react-hot-toast'

interface Props { item: MenuItem }

export default function FoodCard({ item }: Props) {
  const { items, addItem, updateQuantity } = useCartStore()
  const cartItem = items.find(i => i.menuItem.id === item.id)
  const qty = cartItem?.quantity ?? 0
  const [imgError, setImgError] = useState(false)
  const [liked, setLiked] = useState(false)

  const fallback = `https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80`

  const handleAdd = () => {
    addItem(item)
    toast.success(`${item.name} added to cart!`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="card overflow-hidden group cursor-pointer rounded-2xl"
    >
      {/* Image */}
      <div className="relative h-44 overflow-hidden bg-gray-200">
        <Image
          src={imgError ? fallback : (item.image || fallback)}
          alt={item.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          onError={() => setImgError(true)}
        />
        {/* Rating badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full text-xs font-semibold shadow-md">
            <Star size={12} className="text-yellow-500" fill="currentColor" />
            <span className="text-brand-dark">{item.rating?.toFixed(1) || '4.5'}</span>
          </div>
        </div>
        {/* Heart / favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked) }}
          className="absolute top-3 right-3 w-9 h-9 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-md"
        >
          <Heart size={16} className={liked ? 'text-brand-primary fill-brand-primary' : 'text-gray-300'} />
        </button>
        {!item.isAvailable && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-sm font-semibold bg-black/70 px-3 py-1.5 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-brand-dark text-sm leading-tight line-clamp-1">{item.name}</h3>
          <p className="text-xs text-brand-text-light mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
        </div>

        <div className="flex items-center gap-2 text-xs text-brand-text-light">
          <Clock size={10} />
          <span>{item.prepTime || 15} mins</span>
          <div className={`ml-auto ${item.isVeg ? 'veg-dot' : 'nonveg-dot'}`} />
        </div>

        {/* Price & Add */}
        <div className="flex items-center justify-between pt-2 border-t border-brand-border">
          <span className="font-bold text-base text-brand-dark">{formatCurrency(item.price)}</span>

          {item.isAvailable && (
            <AnimatePresence mode="wait">
              {qty === 0 ? (
                <motion.button
                  key="add"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleAdd}
                  className="flex items-center gap-1.5 bg-brand-primary text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-brand-orange-dark hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Plus size={14} />
                  Add
                </motion.button>
              ) : (
                <motion.div
                  key="qty"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 bg-brand-primary/10 border border-brand-primary/30 rounded-full px-2.5 py-1.5"
                >
                  <button
                    onClick={() => updateQuantity(item.id, qty - 1)}
                    className="w-5 h-5 flex items-center justify-center text-brand-primary hover:bg-brand-primary/20 rounded-full transition-colors"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="text-sm font-bold text-brand-primary min-w-[16px] text-center">{qty}</span>
                  <button
                    onClick={() => updateQuantity(item.id, qty + 1)}
                    className="w-5 h-5 flex items-center justify-center text-brand-primary hover:bg-brand-primary/20 rounded-full transition-colors"
                  >
                    <Plus size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </motion.div>
  )
}
