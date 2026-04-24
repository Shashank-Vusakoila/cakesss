import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  favorites: string[] // Array of item IDs
  toggleFavorite: (itemId: string) => void
  isFavorite: (itemId: string) => boolean
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (itemId) =>
        set((state) => ({
          favorites: state.favorites.includes(itemId)
            ? state.favorites.filter((id) => id !== itemId)
            : [...state.favorites, itemId],
        })),
      isFavorite: (itemId) => get().favorites.includes(itemId),
    }),
    {
      name: 'bnd-favorites-storage',
    }
  )
)
