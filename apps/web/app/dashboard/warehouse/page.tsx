'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { 
  Heart, Image as ImageIcon, Calendar, Calculator, Eye, Edit2, 
  Trash2, X, Plus, Search, ChevronDown, Wrench, Share2, FileText
} from 'lucide-react';
import { useWarehouseStore } from '../../../store/warehouse.store';
import { useRouter } from 'next/navigation';

export default function InternalWarehousePage() {
  const { 
    categories, 
    models, 
    isLoading, 
    isFetchingNextPage,
    hasMore,
    filters,
    fetchCategories, 
    fetchModels,
    setFilter
  } = useWarehouseStore();

  const router = useRouter();

  const activeParentCategory = categories.find(c => c.id === filters.kategoriaId) || categories[0];
  
  // Ref dla elementu "obserwatora" do Infinite Scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLTableRowElement) => {
    if (isLoading || isFetchingNextPage) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchModels();
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [isLoading, isFetchingNextPage, hasMore, fetchModels]);

  useEffect(() => {
    fetchCategories();
    fetchModels(true);
  }, []); // Run once on mount

  return (
    <div className="flex flex-col h-full bg-white rounded-tl-2xl border-t border-l border-slate-200 overflow-hidden shadow-sm">
      
      {/* 1. GŁÓWNA NAWIGACJA KATEGORII */}
      <div className="flex flex-wrap items-center gap-6 px-6 py-4 border-b border-slate-200 bg-white shadow-sm z-10">
        {categories.map((cat) => (
          <button 
            key={cat.id}
            onClick={() => setFilter('kategoriaId', cat.id)}
            className={`flex items-center gap-1 text-[13px] font-bold uppercase tracking-wider transition ${
              filters.kategoriaId === cat.id ? 'text-blue-600' : 'text-slate-600 hover:text-blue-500'
            }`}
          >
            {cat.nazwa} <ChevronDown size={14} className="text-slate-400" />
          </button>
        ))}
        <button className="flex items-center gap-1 text-[13px] font-bold uppercase tracking-wider text-slate-600 hover:text-red-500 px-3 py-1 rounded-full border border-slate-200 ml-auto transition">
          <Heart size={14} className="text-slate-400" /> Ulubione
        </button>
        <button className="flex items-center gap-2 text-[13px] font-bold text-emerald-600 border border-emerald-500 px-3 py-1.5 rounded bg-emerald-50 hover:bg-emerald-100 transition">
           <span className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center"></span> Zobacz jak działają opakowania
        </button>
      </div>

      {/* 2. SUBKATEGORIE */}
      {activeParentCategory?.dzieci?.length > 0 && (
        <div className="flex flex-wrap gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/50">
          {activeParentCategory.dzieci.map((sub) => (
            <button key={sub.id} className="text-[13px] font-medium text-slate-500 hover:text-slate-800 transition">
              {sub.nazwa}
            </button>
          ))}
        </div>
      )}

      {/* 3. PASEK WYSZUKIWANIA I AKCJI */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Szukaj..."
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              className="pl-3 pr-8 py-2 border border-slate-300 rounded-md text-sm w-[250px] focus:outline-none focus:border-blue-500"
            />
            {filters.search ? (
               <X size={16} className="absolute right-2 top-2.5 text-slate-400 cursor-pointer" onClick={() => setFilter('search', '')}/>
            ) : (
               <Search size={16} className="absolute right-2 top-2.5 text-slate-400" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <input type="datetime-local" className="border border-slate-300 rounded-md text-sm px-3 py-2 text-slate-600 outline-none" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="datetime-local" className="border border-slate-300 rounded-md text-sm px-3 py-2 text-slate-600 outline-none" />
            <button className="border border-slate-300 px-4 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Szukaj</button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded shadow-sm hover:bg-sky-500 transition">Kalendarz</button>
          <button className="bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded shadow-sm hover:bg-sky-500 transition">Zestawienie</button>
          <button className="bg-sky-400 text-white text-sm font-medium px-4 py-2 rounded shadow-sm hover:bg-sky-500 transition">Inwentaryzacja</button>
          
          <div className="h-8 w-px bg-slate-200 mx-2"></div>

          <button 
            onClick={() => router.push('/dashboard/warehouse/models/new')} // Zamiast modala
            className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 text-sm font-bold px-4 py-2 rounded shadow-sm hover:bg-slate-50 transition"
            >
            <Plus size={16} className="text-emerald-500" /> Dodaj <ChevronDown size={14}/>
            </button>
          <button className="flex items-center gap-1 bg-white border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50 transition">
            Eksport <ChevronDown size={14}/>
          </button>
          <button className="bg-white border border-blue-400 text-blue-500 text-sm font-medium px-4 py-2 rounded hover:bg-blue-50 transition">
            Naklejki z kodami
          </button>
          <button className="bg-white border border-blue-400 text-blue-500 text-sm font-medium px-4 py-2 rounded hover:bg-blue-50 transition">
            Ukryj zdjęcia
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium px-4 py-2 rounded hover:bg-slate-50 transition">
            <Share2 size={16} /> Znajdź sprzęt w event network
          </button>
        </div>
      </div>

      {/* Pasek narzędzi nad samą tabelą */}
      <div className="flex justify-end p-2 bg-slate-50 border-b border-slate-200 gap-1">
         <button className="p-1.5 bg-white border border-slate-300 rounded shadow-sm text-slate-500 hover:text-slate-800"><Edit2 size={14}/></button>
         <button className="p-1.5 bg-sky-400 border border-sky-500 rounded shadow-sm text-white hover:bg-sky-500"><Wrench size={14}/></button>
      </div>

      {/* 4. TABELA DANYCH */}
      <div className="flex-1 overflow-auto custom-scrollbar relative">
        {isLoading && models.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-500">Ładowanie magazynu...</div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap min-w-[1200px]">
            <thead className="sticky top-0 bg-white border-b border-slate-200 z-10 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-4 w-10 flex gap-2">↓ L.p. S U</th>
                <th className="p-4 w-20 text-center">Zdjęcie</th>
                <th className="p-4 min-w-[200px]">Nazwa</th>
                <th className="p-4">Typ</th>
                <th className="p-4">Kategoria</th>
                <th className="p-4">Na stanie</th>
                <th className="p-4">Dostępnych</th>
                <th className="p-4">Rezerwacje</th>
                <th className="p-4">Cena</th>
                <th className="p-4">Kod kreskowy</th>
                <th className="p-4">Uwagi</th>
                <th className="p-4">Konflikty</th>
                <th className="p-4 text-center">Cross Rental Network</th>
                <th className="p-4 text-center">Status CRN</th>
                <th className="p-4">Magazyny</th>
                <th className="p-4">Notatka</th>
                <th className="p-4 text-center">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {models.map((item, index) => {
                const isLast = index === models.length - 1;
                return (
                  <tr 
                    key={item.id} 
                    ref={isLast ? lastElementRef : null}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    <td className="p-4"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="p-4 text-blue-500 font-medium">
                      <div className="flex items-center gap-1.5">
                         <span>{index + 1}</span>
                         <div className="flex flex-col gap-0 text-slate-400 cursor-pointer">
                            <span className="text-[10px] leading-[8px]">▲</span>
                            <span className="text-[10px] leading-[8px]">▼</span>
                         </div>
                         <Heart size={14} className={item.ulubiony ? "text-red-500 fill-red-500" : "text-slate-300"} />
                         <span className="text-slate-400 font-bold text-lg leading-none">+</span>
                         <span className="text-blue-500 font-bold text-lg leading-none">↓</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {item.zdjecie ? (
                         <img src={item.zdjecie} alt="foto" className="w-10 h-10 object-contain mx-auto" />
                      ) : (
                         <div className="w-10 h-10 bg-slate-100 border border-slate-200 text-slate-300 flex items-center justify-center rounded mx-auto">
                            <ImageIcon size={20} />
                         </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar size={14} className="text-emerald-500 bg-emerald-50 p-0.5 rounded cursor-pointer" />
                        <Calculator size={14} className="text-sky-500 bg-sky-50 p-0.5 rounded cursor-pointer" />
                      </div>
                      <span className="text-blue-600 font-medium cursor-pointer hover:underline">{item.nazwa}</span>
                    </td>
                    <td className="p-4 text-slate-600">{item.typ_sprzetu === 'sprzet' ? 'Sprzęt' : item.typ_sprzetu}</td>
                    <td className="p-4 text-slate-600">{item.kategoria_nazwa}</td>
                    
                    {/* Skomplikowana kolumna Na stanie wg screena */}
                    <td className="p-4 min-w-[120px]">
                      <div className="text-base font-bold text-slate-700">{item.stan.total}</div>
                      <div className="flex flex-col gap-0.5 text-[11px] font-semibold text-slate-600 mt-1">
                         {item.stan.magazyn > 0 && <div><span className="bg-slate-800 text-white px-1.5 py-0.5 rounded mr-1">1</span>Magazyn: {item.stan.magazyn}</div>}
                         {item.stan.eventy > 0 && <div><span className="bg-sky-500 text-white px-1.5 py-0.5 rounded mr-1">2</span>Na eventach: {item.stan.eventy}</div>}
                         {item.stan.serwis > 0 && <div className="text-red-500"><span className="bg-red-500 text-white px-1.5 py-0.5 rounded mr-1">3</span>Serwis: {item.stan.serwis}</div>}
                         {item.stan.rack > 0 && <div><span className="bg-slate-400 text-white px-1.5 py-0.5 rounded mr-1">4</span>W rackach: {item.stan.rack}</div>}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="text-base font-bold text-slate-700">{item.dostepnych}</div>
                      {item.stan.serwis > 0 && (
                        <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1 inline-block">W serwisie: {item.stan.serwis}</div>
                      )}
                    </td>

                    <td className="p-4 text-slate-400">-</td>
                    
                    <td className="p-4 text-slate-600 text-xs">Podstawowa: <span className="font-bold text-slate-800">{item.cena_podstawowa.toFixed(2)} PLN</span></td>
                    <td className="p-4 text-slate-600">{item.kod_kreskowy || '-'}</td>
                    <td className="p-4 text-slate-400">-</td>
                    <td className="p-4"><span className="bg-emerald-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm">0</span></td>
                    <td className="p-4 text-center">
                       {item.udostepniony_crn ? (
                         <span className="text-blue-500 font-medium cursor-pointer">Udostępnij</span>
                       ) : (
                         <span className="text-blue-500 font-medium cursor-pointer">Udostępnij</span> // Na screenie wszystko ma "Udostępnij"
                       )}
                    </td>
                    <td className="p-4 text-center text-slate-400">-</td>
                    <td className="p-4 text-slate-600 font-medium">SYCOWSKA <span className="bg-white border border-slate-200 text-slate-400 text-[10px] px-1 ml-1 rounded">+</span></td>
                    <td className="p-4"><span className="text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded text-[11px] font-medium hover:bg-slate-200 cursor-pointer transition">Notatka</span></td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Eye size={16} className="cursor-pointer hover:text-blue-500" />
                        <div className="w-6 h-6 bg-slate-700 rounded text-white flex items-center justify-center cursor-pointer hover:bg-slate-800">
                          <Edit2 size={12} />
                        </div>
                        <X size={20} className="cursor-pointer font-bold text-slate-800 hover:text-red-500" />
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {isFetchingNextPage && (
                 <tr>
                    <td colSpan={18} className="p-4 text-center text-slate-400">
                       <Loader2 className="w-5 h-5 animate-spin mx-auto inline-block mr-2"/> Wczytywanie kolejnych pozycji...
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}