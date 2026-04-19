import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, MenuItem } from '@/types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: MenuItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, qty: number) => void
  clearCart: () => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  subtotal: () => number
  tax: () => number
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (menuItem) => {
        set(state => {
          const existing = state.items.find(i => i.menuItem.id === menuItem.id)
          if (existing) {
            return {
              items: state.items.map(i =>
                i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { menuItem, quantity: 1 }] }
        })
      },

      removeItem: (id) => {
        set(state => ({ items: state.items.filter(i => i.menuItem.id !== id) }))
      },

      updateQuantity: (id, qty) => {
        if (qty <= 0) {
          get().removeItem(id)
          return
        }
        set(state => ({
          items: state.items.map(i => i.menuItem.id === id ? { ...i, quantity: qty } : i),
        }))
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),
      tax: () => Math.round(get().subtotal() * 0.05),
      total: () => get().subtotal() + get().tax(),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'bakes-delights-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
