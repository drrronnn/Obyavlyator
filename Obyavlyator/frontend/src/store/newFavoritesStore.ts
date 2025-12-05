import { create } from 'zustand';

interface NewFavoritesStore {
  count: number;
  setCount: (count: number) => void;
  resetCount: () => void;
}

export const useNewFavoritesStore = create<NewFavoritesStore>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
  resetCount: () => set({ count: 0 }),
}));