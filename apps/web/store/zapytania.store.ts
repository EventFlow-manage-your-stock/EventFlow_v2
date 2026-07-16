import { create } from 'zustand';
import { api } from '../lib/api';

interface ZapytaniaState {
  items: any[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  updateStatus: (id: number, newStatus: string) => Promise<void>;
}

export const useZapytaniaStore = create<ZapytaniaState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/api/zapytania');
      set({ items: res.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch zapytania', error);
      set({ isLoading: false });
    }
  },

  updateStatus: async (id: number, newStatus: string) => {
    // Optimistic UI update (natychmiastowa reakcja dla Drag & Drop)
    const prevItems = get().items;
    set({ items: prevItems.map(item => item.id === id ? { ...item, status: newStatus } : item) });
    
    try {
      await api.patch(`/api/zapytania/${id}/status`, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status', error);
      // Revert in case of failure
      set({ items: prevItems });
    }
  }
}));