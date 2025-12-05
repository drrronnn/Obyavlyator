import { create } from 'zustand';

interface FavoritesStore {
  favoriteIds: Set<string>;
  isConnected: boolean;
  addFavorite: (id: string) => void;
  removeFavorite: (id: string) => void;
  setFavorites: (ids: string[]) => void;
  setConnected: (connected: boolean) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>((set, get) => ({
  favoriteIds: new Set(),
  isConnected: false,
  addFavorite: (id) => set((state) => ({ 
    favoriteIds: new Set([...state.favoriteIds, id]) 
  })),
  removeFavorite: (id) => set((state) => {
    const newSet = new Set(state.favoriteIds);
    newSet.delete(id);
    return { favoriteIds: newSet };
  }),
  setFavorites: (ids) => set({ favoriteIds: new Set(ids) }),
  setConnected: (connected) => set({ isConnected: connected }),
  isFavorite: (id) => get().favoriteIds.has(id),
}));