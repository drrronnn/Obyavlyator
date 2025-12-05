import { create } from 'zustand';

interface GeneralState {
  // UI состояния
  isSidebarOpen: boolean;
  
  // Действия
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleSidebar: () => void;
}

export const useGeneralStore = create<GeneralState>()((set) => ({
  // Начальные состояния
  isSidebarOpen: false,
  
  // Действия
  setIsSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));