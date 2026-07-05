import { create } from 'zustand';
import { api } from '../lib/api';

interface Category {
  id: number;
  nazwa: string;
  dzieci: Category[];
}

interface EquipmentModel {
  id: number;
  nazwa: string;
  typ_sprzetu: string;
  kategoria_nazwa: string;
  kod_kreskowy: string | null;
  ulubiony: boolean;
  udostepniony_crn: boolean;
  cena_podstawowa: number;
  uwagi: string | null;
  stan: {
    total: number;
    magazyn: number;
    eventy: number;
    serwis: number;
    rack: number;
  };
  dostepnych: number;
}

interface WarehouseState {
  categories: Category[];
  models: EquipmentModel[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasMore: boolean;
  page: number;
  filters: {
    search: string;
    kategoriaId: number | null;
  };
  fetchCategories: () => Promise<void>;
  fetchModels: (reset?: boolean) => Promise<void>;
  setFilter: (key: 'search' | 'kategoriaId', value: any) => void;
}

export const useWarehouseStore = create<WarehouseState>((set, get) => ({
  categories: [],
  models: [],
  isLoading: false,
  isFetchingNextPage: false,
  hasMore: true,
  page: 1,
  filters: {
    search: '',
    kategoriaId: null,
  },

  fetchCategories: async () => {
    try {
      const res = await api.get('/api/magazyn/kategorie');
      set({ categories: res.data });
    } catch (error) {
      console.error('Failed to load categories', error);
    }
  },

  fetchModels: async (reset = false) => {
    const { page, filters, models, isFetchingNextPage } = get();
    if (isFetchingNextPage) return; // Zabezpieczenie przed podwójnym strzałem

    const currentPage = reset ? 1 : page;
    
    set({ 
      ...(reset ? { isLoading: true, models: [] } : { isFetchingNextPage: true }),
      page: currentPage 
    });

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
      });
      if (filters.search) params.append('search', filters.search);
      if (filters.kategoriaId) params.append('kategoriaId', filters.kategoriaId.toString());

      const res = await api.get(`/api/magazyn/modele?${params.toString()}`);
      
      const newModels = res.data;
      set({ 
        models: reset ? newModels : [...models, ...newModels],
        hasMore: newModels.length === 20, // Jeśli przyszło mniej niż limit, to koniec
        page: currentPage + 1,
        isLoading: false,
        isFetchingNextPage: false,
      });
    } catch (error) {
      console.error('Failed to fetch models', error);
      set({ isLoading: false, isFetchingNextPage: false });
    }
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
    get().fetchModels(true); // Reset list on filter change
  },
}));