'use client'
import { useCartStore } from '@/hooks/useCart'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight, Sparkles, ShoppingCart } from 'lucide-react'
import { formatCurrency, getValidImageUrl } from '@/utils'
import Link from 'next/link'
import Image from 'next/image'

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, tax, total } = useCartStore()
  const sub = subtotal()
  const t = tax()
  const tot = total()

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-brand-dark/40 backdrop-blur-md"
            onClick={closeCart}
          />

          <div className="absolute inset-y-0 right-0 max-w-full flex">
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative w-screen max-w-md bg-white shadow-2xl flex flex-col pointer-events-auto"
            >
              {/* Header */}
              <div className="px-8 py-8 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-orange rounded-2xl flex items-center justify-center text-white shadow-orange">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black text-brand-orange uppercase tracking-[.3em] block mb-0.5">Your Selection</span>
                    <h2 className="text-2xl font-black text-brand-dark tracking-tighter">My Cart</h2>
                  </div>
                </div>
                <button
                  onClick={closeCart}
                  className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-brand-dark hover:bg-gray-100 transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-8 text-center">
                    <div className="w-32 h-32 bg-[#FAFAF8] rounded-[3rem] flex items-center justify-center relative">
                       <div className="absolute inset-0 bg-brand-orange/5 animate-ping rounded-full" />
                       <ShoppingCart size={56} className="text-gray-200" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-brand-dark tracking-tight">Empty Tray</h3>
                      <p className="text-gray-400 font-medium mt-2 italic italic-font">Sweetness awaits. Browse our collection and start your bake-journey.</p>
                    </div>
                    <button
                      onClick={closeCart}
                      className="btn-primary"
                    >
                      Browse Our Bakes
                    </button>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map(item => (
                      <motion.div
                        key={item.menuItem.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, x: 20 }}
                        className="flex gap-5 p-4 rounded-3xl bg-[#FAFAF8] border border-gray-50 group hover:shadow-card transition-all"
                      >
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm">
                          <Image
                            src={getValidImageUrl(item.menuItem.image, "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80")}
                            alt={item.menuItem.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="flex justify-between items-start gap-2">
                             <div className="flex-1">
                                <h4 className="text-base font-black text-brand-dark line-clamp-1 leading-tight tracking-tight">{item.menuItem.name}</h4>
                                <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mt-1">{formatCurrency(item.menuItem.price)} / unit</p>
                             </div>
                             <button
                               onClick={() => removeItem(item.menuItem.id)}
                               className="text-gray-300 hover:text-brand-red transition-colors p-1"
                             >
                               <Trash2 size={16} />
                             </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-1 shadow-sm">
                              <button
                                onClick={() => updateQuantity(item.menuItem.id, Math.max(0, item.quantity - 1))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-dark transition-all"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-black text-brand-dark w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-brand-dark transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-sm font-black text-brand-dark">
                              {formatCurrency(item.menuItem.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Checkout Actions */}
              {items.length > 0 && (
                <div className="px-8 py-10 border-t border-gray-100 bg-white/50 backdrop-blur-xl">
                  <div className="space-y-4 mb-10">
                    <div className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      <span>Item Total</span>
                      <span className="text-brand-dark">{formatCurrency(sub)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black text-gray-400 uppercase tracking-widest">
                      <span>GST & Taxes (5%)</span>
                      <span className="text-brand-dark">{formatCurrency(t)}</span>
                    </div>
                    <div className="flex justify-between items-end pt-6 mt-6 border-t border-gray-900/5">
                      <div>
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Amount</p>
                         <span className="text-3xl font-black text-brand-dark tracking-tighter">Order Total</span>
                      </div>
                      <span className="text-3xl font-black text-brand-orange tracking-tighter">{formatCurrency(tot)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-4 bg-brand-cream/50 rounded-2xl border border-brand-orange/10 mb-8">
                     <Sparkles size={16} className="text-brand-orange shrink-0" />
                     <p className="text-[10px] font-bold text-gray-500 leading-relaxed italic-font italic">
                        Bespoke bakes for discerning gourmands. Freshness guaranteed.
                     </p>
                  </div>

                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="btn-primary w-full py-5 flex items-center justify-center gap-4 group hover:shadow-orange"
                  >
                    Proceed to Checkout
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
