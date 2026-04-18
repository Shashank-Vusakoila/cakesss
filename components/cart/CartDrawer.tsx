'use client'
import { useCartStore } from '@/hooks/useCart'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { formatCurrency } from '@/utils'
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
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-card z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-brand-primary/10 rounded-lg flex items-center justify-center">
                  <ShoppingBag size={18} className="text-brand-primary" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-brand-dark">Your Cart</h2>
                </div>
              </div>
              <button
                onClick={closeCart}
                className="w-8 h-8 rounded-full bg-brand-background flex items-center justify-center hover:bg-brand-border transition-colors text-brand-text-dark"
              >
                <X size={16} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingBag size={36} className="text-brand-primary/40" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-dark">Your cart is empty</p>
                    <p className="text-sm text-brand-text-light mt-1">Add some delicious bakes to get started!</p>
                  </div>
                  <button
                    onClick={closeCart}
                    className="btn-primary text-sm"
                  >
                    Browse Menu
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map(item => (
                    <motion.div
                      key={item.menuItem.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex gap-4 p-3 rounded-xl bg-brand-background group border border-brand-border"
                    >
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.menuItem.image || 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=200'}
                          alt={item.menuItem.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-brand-dark line-clamp-1">{item.menuItem.name}</p>
                        <p className="text-brand-primary font-bold text-sm mt-0.5">{formatCurrency(item.menuItem.price)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-2 bg-brand-card rounded-lg border border-brand-border px-2 py-1">
                            <button
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity - 1)}
                              className="w-5 h-5 flex items-center justify-center hover:text-brand-primary transition-colors text-brand-text-light"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-semibold w-4 text-center text-brand-dark">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.menuItem.id, item.quantity + 1)}
                              className="w-5 h-5 flex items-center justify-center hover:text-brand-primary transition-colors text-brand-text-light"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-xs text-brand-text-light font-medium">
                            = {formatCurrency(item.menuItem.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.menuItem.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-brand-border hover:text-red-500 self-start mt-1"
                      >
                        <Trash2 size={15} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-6 py-5 border-t border-brand-border bg-brand-background">
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between text-brand-text-light">
                    <span>Subtotal</span>
                    <span>{formatCurrency(sub)}</span>
                  </div>
                  <div className="flex justify-between text-brand-text-light">
                    <span>GST (5%)</span>
                    <span>{formatCurrency(t)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-brand-border">
                    <span className="text-brand-dark">Total</span>
                    <span className="text-brand-primary">{formatCurrency(tot)}</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full btn-primary flex items-center justify-center gap-2 text-sm"
                >
                  Proceed to Checkout
                  <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
